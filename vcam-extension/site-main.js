/* CSS VTuber Camera — 会議サイト側パッチ (MAINワールド)
   getUserMedia / enumerateDevices を上書きして「CSS VTuber Camera」という
   仮想カメラデバイスを生やす。
   実映像は localhost のビューアタブから WebRTC (タブ間ループバック) で受け取る。

   仕組み: サイトへは常に canvas.captureStream の安定したトラックを返し、
   canvas には「ビューア映像」か「案内画面(未接続時)」を描く。
   接続に失敗しても4秒ごとに自動再接続し、つながった瞬間モデルに切り替わる。 */
(() => {
  if (navigator.mediaDevices.__cssvtuber) return;
  navigator.mediaDevices.__cssvtuber = true;

  const VID = 'cssvtuber-virtual-camera';
  const realGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const realEnum = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
  const up = m => window.postMessage({__vcamUp: m}, '*');
  const log = (...a) => console.log('[CSS VTuber Camera]', ...a);
  log('パッチ適用済み (カメラ一覧に CSS VTuber Camera が追加されます)');

  /* ===== 出力キャンバス: サイトに渡す映像の実体 ===== */
  const W = 1280, H = 720;
  let canvas = null, cctx = null, camStream = null;
  let remoteVideo = null, remoteStream = null;
  let statusMsg = 'ビューアに接続中…';

  let statusTimer = 0, rvfcVid = null, rvfcId = 0;
  function ensureCanvas(){
    if (camStream) return;
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    cctx = canvas.getContext('2d');
    draw();
    /* 出力は20fpsに固定(ビューア側の20fpsと揃える。Meet再エンコード負荷をさらに軽減) */
    camStream = canvas.captureStream(20);
    scheduleDraw();
  }
  /* 描画スケジューラ:
     - 映像受信中 → ビューアのフレーム到着に合わせて requestVideoFrameCallback で描画
       (常時33ms=30fpsの空回し再描画をやめ、来た分だけ描く)
     - 映像なし(案内画面) → テキストが静的なので低速interval(500ms)で十分
     - rVFC非対応環境 → 33ms interval にフォールバック */
  function scheduleDraw(){
    const live = remoteVideo && remoteVideo.readyState >= 2;
    if (live && remoteVideo.requestVideoFrameCallback) {
      if (statusTimer) { clearInterval(statusTimer); statusTimer = 0; }
      if (rvfcVid === remoteVideo) return;
      rvfcVid = remoteVideo;
      const tick = () => {
        if (rvfcVid !== remoteVideo) return;   /* 映像が切れた/差し替わったら抜ける */
        draw();
        rvfcId = remoteVideo.requestVideoFrameCallback(tick);
      };
      rvfcId = remoteVideo.requestVideoFrameCallback(tick);
    } else if (live) {
      /* rVFC非対応: 20fps相当の50ms interval (第2弾で33ms=30fps→50ms=20fpsに削減) */
      rvfcVid = null;
      if (!statusTimer) statusTimer = setInterval(draw, 50);
    } else {
      /* 案内画面: 低速で回し、映像が来たら次tickでrVFCへ切替 */
      rvfcVid = null;
      if (!statusTimer) statusTimer = setInterval(() => { draw(); scheduleDraw(); }, 500);
    }
  }
  function draw(){
    if (!cctx) return;
    cctx.fillStyle = '#f6f1e7';
    cctx.fillRect(0, 0, W, H);
    if (remoteVideo && remoteVideo.readyState >= 2) {
      const vw = remoteVideo.videoWidth || 16, vh = remoteVideo.videoHeight || 9;
      const s = Math.min(W / vw, H / vh), dw = vw * s, dh = vh * s;
      cctx.drawImage(remoteVideo, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      cctx.textAlign = 'center';
      cctx.fillStyle = '#7f2f16';
      cctx.font = 'bold 52px "Segoe UI", sans-serif';
      cctx.fillText('CSS VTuber Camera', W / 2, H / 2 - 50);
      cctx.font = '28px "Segoe UI", sans-serif';
      cctx.fillText(statusMsg, W / 2, H / 2 + 20);
      cctx.font = '22px "Segoe UI", sans-serif';
      cctx.fillStyle = '#8a8175';
      cctx.fillText('(つながると自動でモデルに切り替わります)', W / 2, H / 2 + 64);
    }
  }

  /* ===== ビューアとのWebRTC接続 (失敗しても4秒ごとに自動再接続) ===== */
  let pc = null, waiting = false, retryTimer = 0, active = false;

  function connected(){
    return remoteStream && remoteStream.getVideoTracks().some(t => t.readyState === 'live');
  }
  function scheduleRetry(){
    if (!active) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, 4000);
  }
  function connect(){
    if (waiting || connected()) return;
    waiting = true;
    statusMsg = 'ビューアに接続中…';
    pc = new RTCPeerConnection();
    const to = setTimeout(() => {
      try { pc.close(); } catch (_) {}
      pc = null;
      waiting = false;
      statusMsg = 'ビューア窓の「🎥 仮想カメラ開始」を押してください';
      log('ビューアから応答なし。4秒後に再接続します (ビューア窓で🎥を押せば映ります)');
      scheduleRetry();
    }, 15000);   /* 重い環境ではビューアの初期化に時間がかかるため8秒→15秒 */
    pc.ontrack = ev => {
      clearTimeout(to);
      waiting = false;
      remoteStream = ev.streams[0] || new MediaStream([ev.track]);
      remoteVideo = document.createElement('video');
      remoteVideo.muted = true;
      remoteVideo.playsInline = true;
      /* rVFCが確実に発火するようDOMに置く(非表示・1x1)。captureStreamのソースはCanvas側 */
      remoteVideo.style.cssText = 'position:fixed;left:-2px;top:-2px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1';
      remoteVideo.srcObject = remoteStream;
      document.documentElement.appendChild(remoteVideo);
      remoteVideo.play().catch(() => {});
      remoteVideo.addEventListener('loadeddata', scheduleDraw, {once: true});
      scheduleDraw();
      ev.track.addEventListener('ended', () => {
        try { remoteVideo.remove(); } catch (_) {}
        remoteVideo = null; remoteStream = null; rvfcVid = null;
        statusMsg = 'ビューアが停止しました。再接続します…';
        log('ビューア停止 → 再接続待ち');
        scheduleDraw();
        scheduleRetry();
      });
      log('ビューアの映像を受信しました');
    };
    pc.onicecandidate = ev => up({t: 'ice', c: ev.candidate ? ev.candidate.toJSON() : null});
    pc.addTransceiver('video', {direction: 'recvonly'});
    pc.createOffer()
      .then(o => pc.setLocalDescription(o))
      .then(() => { up({t: 'offer', sdp: pc.localDescription.toJSON()}); log('ビューアへ接続要求を送信…'); })
      .catch(err => { clearTimeout(to); waiting = false; log('接続要求失敗:', err); scheduleRetry(); });
  }

  /* ビューア側からの応答 (isolatedワールド経由) */
  window.addEventListener('message', e => {
    if (e.source !== window || !e.data || !e.data.__vcamDown || !pc) return;
    const m = e.data.__vcamDown;
    if (m.t === 'answer') pc.setRemoteDescription(m.sdp).catch(() => {});
    else if (m.t === 'ice' && m.c) pc.addIceCandidate(m.c).catch(() => {});
  });

  /* ===== デバイス偽装 ===== */
  navigator.mediaDevices.enumerateDevices = async function(){
    const ds = await realEnum();
    ds.push({
      deviceId: VID, groupId: VID, kind: 'videoinput', label: 'CSS VTuber Camera',
      toJSON(){ return {deviceId: VID, groupId: VID, kind: 'videoinput', label: 'CSS VTuber Camera'}; }
    });
    return ds;
  };

  const patchTrack = t => {
    const gs = t.getSettings.bind(t);
    try { t.getSettings = () => Object.assign(gs(), {deviceId: VID, groupId: VID}); } catch (_) {}
    return t;
  };

  navigator.mediaDevices.getUserMedia = async function(c){
    const wantsVirtual = c && c.video && JSON.stringify(c.video).includes(VID);
    if (!wantsVirtual) return realGUM(c);
    log('CSS VTuber Camera が選択されました');
    active = true;
    ensureCanvas();
    connect();
    const out = new MediaStream([patchTrack(camStream.getVideoTracks()[0].clone())]);
    if (c.audio) {
      try {
        const a = await realGUM({audio: c.audio});
        a.getAudioTracks().forEach(t => out.addTrack(t));
      } catch (_) {}
    }
    return out;
  };
})();
