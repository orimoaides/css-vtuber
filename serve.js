/* 開発用の簡易静的サーバー: node serve.js → http://localhost:8321/
   getUserMedia(カメラ)が file:// で動かない環境向け。依存なし */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = 8321;
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
              '.png':'image/png','.md':'text/plain; charset=utf-8'};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath === '/' ? 'controller.html' : urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log('ポート' + PORT + 'は使用中です。サーバーはすでに起動済みなので、そのまま使えます。');
    process.exit(0);
  }
  throw err;
});
server.listen(PORT, () => console.log('serving on http://localhost:' + PORT + '  (この窓を閉じると止まります)'));
