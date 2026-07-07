/* 会議サイト側の中継: MAINワールドのパッチ ↔ 拡張(bg.js) を橋渡しするだけ */
window.addEventListener('message', e => {
  if (e.source === window && e.data && e.data.__vcamUp) {
    try { chrome.runtime.sendMessage({dir: 'up', m: e.data.__vcamUp}).catch(() => {}); } catch (_) {}
  }
});
chrome.runtime.onMessage.addListener(msg => {
  if (msg && msg.dir === 'down') window.postMessage({__vcamDown: msg.m}, '*');
});
