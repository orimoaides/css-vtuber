/* ビューアタブ側 (http://localhost:8321/controller.html?viewer に注入):
   「仮想カメラ開始」ボタンでタブ自身をキャプチャし、
   会議サイトからのWebRTCオファーに映像で応える (配信サーバー役)。 */
(() => {
  /* ページ側の診断用マーカー (controller.htmlが「拡張なし」の案内を出すか判定する) */
  document.documentElement.dataset.cssvtubercam = '1';

  const qp = new URLSearchParams(location.search);
  if (!qp.has('viewer')) return;   /* モデル表示専用窓でのみ動く */

  try { chrome.runtime.sendMessage({dir: 'register-viewer'}).catch(() => {}); } catch (_) {}

  let capture = null;
  const pcs = new Map();           /* 会議タブID → RTCPeerConnection */
  const iceBuf = new Map();        /* offerより先に届いたICE候補の一時置き場 */
  const log = (...a) => console.log('[CSS VTuber Camera]', ...a);

  /* 開始ボタンと状態バッジ */
  const btn = document.createElement('button');
  btn.textContent = '🎥 仮想カメラ開始';
  btn.style.cssText =
    'position:fixed;left:10px;bottom:10px;z-index:99999;padding:8px 14px;' +
    'font-size:13px;font-weight:700;color:#fff;background:#f5741d;border:0;' +
    'border-radius:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)';
  const badge = document.createElement('div');
  badge.textContent = '🔴 仮想カメラ配信中 (この窓は閉じない)';
  badge.style.cssText =
    'position:fixed;left:10px;bottom:10px;z-index:99999;padding:6px 12px;display:none;' +
    'font-size:12px;color:#fff;background:rgba(198,40,40,.9);border-radius:10px;' +
    'transition:opacity .4s';
  document.body.appendChild(btn);
  document.body.appendChild(badge);

  /* バッジは配信映像に映り込むため、少し経つと自動で消す (マウスを動かすと再表示) */
  let badgeHideT = 0;
  function pokeBadge(){
    if (badge.style.display === 'none') return;
    badge.style.opacity = '1';
    clearTimeout(badgeHideT);
    badgeHideT = setTimeout(() => { badge.style.opacity = '0'; }, 3000);
  }
  window.addEventListener('pointermove', pokeBadge);

  /* 配信の開始/停止をページ(controller.html?viewer)へ通知。
     ページ側が二重描画停止(paused-preview)と配信ミニマム(stream-min)の引き金にする。 */
  function notifyStream(on){ try { window.postMessage({__vcamStream: {on: !!on}}, '*'); } catch (_) {} }

  function stopAll(){
    capture = null;
    pcs.forEach(pc => { try { pc.close(); } catch (_) {} });
    pcs.clear();
    btn.style.display = '';
    badge.style.display = 'none';
    notifyStream(false);
  }

  function updateBadge(){
    let n = 0;
    pcs.forEach(pc => { if (pc.connectionState === 'connected') n++; });
    const f = fps ? ' ' + fps + 'fps' : '';
    badge.textContent = n > 0
      ? '🔴 配信中 (接続' + n + ')' + f + ' — この窓は閉じない'
      : '🟠 待機中 (Meet/YouTubeでCSS VTuber Cameraを選択)' + f;
    pokeBadge();
  }

  btn.addEventListener('click', async () => {
    try {
      capture = await navigator.mediaDevices.getDisplayMedia({
        /* 解像度/fpsを固定して軽量化: Retina(2x)の巨大フレームや60fpsで詰まるのを防ぐ。
           Meet/YouTube側は結局720p程度に落とすので720p24で十分。 */
        video: {
          width:     {ideal: 1280, max: 1280},
          height:    {ideal: 720,  max: 720},
          frameRate: {ideal: 20,   max: 24}
        },
        audio: false,
        preferCurrentTab: true,        /* ダイアログで「このタブ」が最初に出る */
        selfBrowserSurface: 'include'
      });
      /* 環境によりmaxが効かないことがあるので明示的に再適用(ベストエフォート) */
      try { await capture.getVideoTracks()[0].applyConstraints({
        width:{max:1280}, height:{max:720}, frameRate:{max:24}
      }); } catch (_) {}
    } catch (err) { log('キャプチャ開始キャンセル/失敗:', err.name); return; }
    log('キャプチャ開始');
    btn.style.display = 'none';
    badge.style.display = 'block';
    startFpsMeter();
    updateBadge();
    notifyStream(true);
    capture.getVideoTracks()[0].addEventListener('ended', () => { log('キャプチャ終了'); stopFpsMeter(); stopAll(); });
  });

  /* ===== 実測fps表示: キャプチャ映像をrVFCで数え、バッジに小さく出す ===== */
  let fpsVid = null, fpsRvfc = 0, fpsCount = 0, fpsWinT = 0, fps = 0, fpsFallT = 0;
  function startFpsMeter(){
    stopFpsMeter();
    const st = capture; if (!st) return;
    fpsVid = document.createElement('video');
    fpsVid.muted = true; fpsVid.playsInline = true;
    fpsVid.srcObject = new MediaStream([st.getVideoTracks()[0]]);
    fpsVid.play().catch(() => {});
    fpsWinT = performance.now(); fpsCount = 0;
    if (fpsVid.requestVideoFrameCallback) {
      const tick = () => {
        fpsCount++;
        const now = performance.now();
        if (now - fpsWinT >= 1000) { fps = Math.round(fpsCount * 1000 / (now - fpsWinT)); fpsCount = 0; fpsWinT = now; updateBadge(); }
        fpsRvfc = fpsVid.requestVideoFrameCallback(tick);
      };
      fpsRvfc = fpsVid.requestVideoFrameCallback(tick);
    } else {
      /* rVFC非対応環境: トラックの公称frameRateを表示(実測ではない旨は概算) */
      fpsFallT = setInterval(() => {
        const s = capture && capture.getVideoTracks()[0] && capture.getVideoTracks()[0].getSettings();
        fps = s && s.frameRate ? Math.round(s.frameRate) : 0; updateBadge();
      }, 1000);
    }
  }
  function stopFpsMeter(){
    if (fpsVid && fpsRvfc && fpsVid.cancelVideoFrameCallback) { try { fpsVid.cancelVideoFrameCallback(fpsRvfc); } catch (_) {} }
    if (fpsFallT) { clearInterval(fpsFallT); fpsFallT = 0; }
    if (fpsVid) { try { fpsVid.srcObject = null; } catch (_) {} fpsVid = null; }
    fps = 0;
  }

  const send = (to, m) => { try { chrome.runtime.sendMessage({dir: 'toConsumer', to, m}).catch(() => {}); } catch (_) {} };

  chrome.runtime.onMessage.addListener(msg => {
    if (!msg || msg.dir !== 'toViewer') return;
    const m = msg.m, from = msg.from;
    if (m.t === 'offer') {
      log('オファー受信 (tab', from + ')', capture ? '' : '← キャプチャ未開始のため無応答');
      if (!capture) return;            /* 未開始 → 無応答 (会議側は実カメラへフォールバック) */
      const old = pcs.get(from);
      if (old) { try { old.close(); } catch (_) {} }
      const pc = new RTCPeerConnection();
      pcs.set(from, pc);
      pc.onconnectionstatechange = () => { log('接続状態:', pc.connectionState); updateBadge(); };
      capture.getVideoTracks().forEach(t => pc.addTrack(t, capture));
      pc.onicecandidate = ev => send(from, {t: 'ice', c: ev.candidate ? ev.candidate.toJSON() : null});
      pc.setRemoteDescription(m.sdp)
        .then(() => {
          /* offerより先に届いていたICE候補を反映 */
          (iceBuf.get(from) || []).forEach(c => pc.addIceCandidate(c).catch(() => {}));
          iceBuf.delete(from);
          return pc.createAnswer();
        })
        .then(a => pc.setLocalDescription(a))
        .then(() => { send(from, {t: 'answer', sdp: pc.localDescription.toJSON()}); log('アンサー送信'); })
        .catch(err => log('応答失敗:', err));
    } else if (m.t === 'ice' && m.c) {
      const pc = pcs.get(from);
      if (pc) pc.addIceCandidate(m.c).catch(() => {});
      else {
        /* まだofferを処理していない → 取り置き (メッセージ順序の乱れ対策) */
        if (!iceBuf.has(from)) iceBuf.set(from, []);
        const buf = iceBuf.get(from);
        if (buf.length < 32) buf.push(m.c);
      }
    }
  });
  log('ビューア準備OK (拡張は読み込み済み)');
})();
