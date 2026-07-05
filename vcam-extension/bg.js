/* タブ間ルーター: 会議サイト(consumer) ↔ localhostビューア(viewer) のWebRTCシグナリング中継 */
let viewerTab = null;

async function findViewer(){
  if (viewerTab !== null) {
    try { await chrome.tabs.get(viewerTab); return viewerTab; } catch (_) { viewerTab = null; }
  }
  try {
    const tabs = await chrome.tabs.query({url: 'http://localhost:8321/*'});
    const v = tabs.find(t => (t.url || '').includes('viewer'));
    viewerTab = v ? v.id : null;
  } catch (_) { viewerTab = null; }
  return viewerTab;
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab) return;
  if (msg.dir === 'register-viewer') {
    viewerTab = sender.tab.id;
  } else if (msg.dir === 'up') {
    /* 会議サイト → ビューア */
    findViewer().then(id => {
      if (id !== null) chrome.tabs.sendMessage(id, {dir: 'toViewer', from: sender.tab.id, m: msg.m}).catch(() => {});
    });
  } else if (msg.dir === 'toConsumer') {
    /* ビューア → 会議サイト */
    chrome.tabs.sendMessage(msg.to, {dir: 'down', m: msg.m}).catch(() => {});
  }
});
