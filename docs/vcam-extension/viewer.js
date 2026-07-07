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

  function stopAll(){
    capture = null;
    pcs.forEach(pc => { try { pc.close(); } catch (_) {} });
    pcs.clear();
    btn.style.display = '';
    badge.style.display = 'none';
  }

  function updateBadge(){
    let n = 0;
    pcs.forEach(pc => { if (pc.connectionState === 'connected') n++; });
    badge.textContent = n > 0
      ? '🔴 仮想カメラ配信中 (接続' + n + ') この窓は閉じない'
      : '🟠 仮想カメラ待機中 (Meet/YouTube側でCSS VTuber Cameraを選択)';
    pokeBadge();
  }

  btn.addEventListener('click', async () => {
    try {
      capture = await navigator.mediaDevices.getDisplayMedia({
        video: {frameRate: 30},
        audio: false,
        preferCurrentTab: true,        /* ダイアログで「このタブ」が最初に出る */
        selfBrowserSurface: 'include'
      });
    } catch (err) { log('キャプチャ開始キャンセル/失敗:', err.name); return; }
    log('キャプチャ開始');
    btn.style.display = 'none';
    badge.style.display = 'block';
    updateBadge();
    capture.getVideoTracks()[0].addEventListener('ended', () => { log('キャプチャ終了'); stopAll(); });
  });

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
