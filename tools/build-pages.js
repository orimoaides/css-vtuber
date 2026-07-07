#!/usr/bin/env node
/*
 * build-pages.js — 変身スタジオ GitHub Pages 用「あいことば解凍ゲート」ビルダー
 *
 * 対象HTMLを AES-256-GCM + PBKDF2(SHA-256) で暗号化し docs/ に「解凍ローダー」として出力する。
 * 依存ゼロ（Node標準 crypto のみ）。ブラウザ側は WebCrypto で復号するため相互運用に合わせてある。
 *
 * 使い方:
 *   node tools/build-pages.js --password "orimo-dante"
 *   node tools/build-pages.js --password "xxxx" --iterations 200000 --out docs
 *
 * 暗号仕様（WebCrypto互換）:
 *   key      = PBKDF2-HMAC-SHA256(password, salt, iterations, 32bytes)
 *   payload  = iv(12) || ciphertext || authTag(16)   ← WebCrypto は tag を末尾連結で受ける
 *   salt はビルド1回につき1つ（全ファイル共通）→ セッション内は導出鍵を1回だけ計算し使い回せる。
 *   誤パスワード判定は GCM の認証タグ検証失敗（＝改ざん/鍵違いで decrypt が例外）に委ねる。
 *
 * リポジトリに平文パスワードは残さない。docs に出るのは salt / iterations / 暗号文のみ。
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---- 引数パース ----
function parseArgs(argv) {
  const a = { iterations: 200000, out: 'docs' };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--password') a.password = argv[++i];
    else if (k === '--iterations') a.iterations = parseInt(argv[++i], 10);
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--help' || k === '-h') a.help = true;
  }
  return a;
}

const args = parseArgs(process.argv);
if (args.help || !args.password) {
  console.log('使い方: node tools/build-pages.js --password "<あいことば>" [--iterations 200000] [--out docs]');
  process.exit(args.password ? 0 : 1);
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, args.out);
const ITER = args.iterations;
const PASSWORD = args.password;

// ---- 対象ファイル（変身スタジオの本体・全て自己完結HTML）----
// controller.html が iframe/別窓で参照する6モデル + コントローラ本体。
const TARGETS = [
  'controller.html',
  'css-vtuber.html',            // orimo（既定モデル）
  'css-vtuber-chochin.html',
  'css-vtuber-buchitama.html',
  'css-vtuber-nikusuke.html',
  'css-vtuber-binzo.html',
  'css-vtuber-kurage.html',
];

// 暗号化せずそのままコピーする非HTML資産（Chrome拡張など）
const COPY_DIRS = ['vcam-extension'];

// ---- 鍵導出・暗号化 ----
const SALT = crypto.randomBytes(16);
const KEY = crypto.pbkdf2Sync(PASSWORD, SALT, ITER, 32, 'sha256');

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // WebCrypto 互換レイアウト: iv || ciphertext || tag
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

// ---- ローダーHTMLテンプレート ----
function loaderHTML({ title, payloadB64, saltB64, iterations }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<style>
  :root{
    --orange:#E85D26; --cream:#F4ECD8; --ink:#292826; --teal:#5E7E7A; --pop:#F2B33C;
    --paper:#fffdf7;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0; background:var(--cream);
    font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;
    color:var(--ink);
    display:none;                 /* ゲート表示 or 自動解凍が決まるまで描画しない（iframe再入力なしのチラつき防止）*/
    align-items:center; justify-content:center;
    padding:24px;
    -webkit-tap-highlight-color:transparent;
  }
  body.show{display:flex}
  /* 背景の淡い格子（おりもラボの紙質感）*/
  body::before{
    content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      radial-gradient(var(--orange) 1.4px, transparent 1.4px),
      radial-gradient(var(--teal) 1.4px, transparent 1.4px);
    background-size:38px 38px, 38px 38px;
    background-position:0 0, 19px 19px;
    opacity:.10;
  }
  .card{
    position:relative; z-index:1; width:min(420px,100%);
    background:var(--paper); border:3px solid var(--ink); border-radius:18px;
    box-shadow:7px 7px 0 var(--ink);
    padding:28px 24px 24px;
  }
  .badge{
    display:inline-flex; align-items:center; gap:6px;
    font-size:12px; font-weight:700; letter-spacing:.08em;
    color:var(--ink); background:var(--pop);
    border:2px solid var(--ink); border-radius:999px;
    padding:4px 12px; box-shadow:2px 2px 0 var(--ink);
    transform:rotate(-1.5deg);
  }
  h1{ margin:16px 0 4px; font-size:30px; font-weight:800; line-height:1.15; letter-spacing:.01em }
  .sub{ margin:0 0 24px; font-size:15px; color:var(--teal); font-weight:700 }
  .key-emoji{ font-size:48px; line-height:1; display:block; margin:4px 0 12px; filter:saturate(1.05) }
  label{ display:block; font-size:13px; font-weight:700; margin:0 0 8px; color:var(--ink) }
  .field{ display:flex; gap:10px; align-items:stretch }
  input[type=password]{
    flex:1; min-width:0; font:inherit; font-size:18px; font-weight:700;
    padding:12px 14px; color:var(--ink); background:var(--cream);
    border:2px solid var(--ink); border-radius:10px; box-shadow:2px 2px 0 var(--ink) inset;
    letter-spacing:.04em;
  }
  input[type=password]:focus{ outline:none; background:#fff; box-shadow:0 0 0 3px var(--pop) }
  input[type=password]::placeholder{ color:#b7ad95; font-weight:700 }
  button{
    font:inherit; font-size:18px; font-weight:800; white-space:nowrap;
    padding:12px 20px; color:#fff; background:var(--orange);
    border:2px solid var(--ink); border-radius:10px; box-shadow:2px 2px 0 var(--ink);
    cursor:pointer; transition:transform .05s ease, box-shadow .05s ease;
  }
  button:hover{ transform:translate(-1px,-1px); box-shadow:3px 3px 0 var(--ink) }
  button:active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink) }
  button:disabled{ opacity:.55; cursor:progress; transform:none; box-shadow:2px 2px 0 var(--ink) }
  .msg{ min-height:22px; margin:14px 2px 0; font-size:15px; font-weight:700 }
  .msg.err{ color:var(--orange) }
  .msg.ok{ color:#1f9d57 }
  .hint{ margin:18px 0 0; font-size:12px; color:var(--teal); line-height:1.6 }
  .shake{ animation:shake .38s ease }
  @keyframes shake{
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
    40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(3px)}
  }
  @media (max-width:400px){
    .card{padding:22px 18px 20px} h1{font-size:24px} .field{flex-direction:column}
    button{width:100%}
  }
  .nokey{ position:relative; z-index:1; max-width:420px; text-align:center }
</style>
</head>
<body>
  <form class="card" id="gate" autocomplete="off" novalidate>
    <span class="badge">おりもラボ・変身スタジオ</span>
    <span class="key-emoji" aria-hidden="true">🔑</span>
    <h1>あいことばを<br>となえてください</h1>
    <p class="sub">とびらの むこうに スタジオが ねむっている</p>
    <label for="pw">🔑 あいことば</label>
    <div class="field">
      <input type="password" id="pw" name="pw" placeholder="あいことば" autocomplete="off"
             autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text" aria-label="あいことば">
      <button type="submit" id="go">ひらく</button>
    </div>
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
    <p class="hint">※ このページは あんごう化されています。ただしい あいことばで とびらが ひらきます。<br>
       いちど ひらけば、このセッション中は 何度も 入力する ひつようは ありません。</p>
  </form>

<script>
(function(){
  "use strict";
  var SALT_B64 = "${saltB64}";
  var ITER = ${iterations};
  var PAYLOAD_B64 = "${payloadB64}";
  var SS_KEY = "henshin-studio-key-v1";   // 導出鍵をセッション内だけ保持（タブを閉じると消える）

  function b64ToBytes(b64){
    var bin = atob(b64), len = bin.length, out = new Uint8Array(len);
    for (var i=0;i<len;i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function bytesToB64(bytes){
    var bin = "", chunk = 0x8000;
    for (var i=0;i<bytes.length;i+=chunk){
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
    }
    return btoa(bin);
  }

  var SALT = b64ToBytes(SALT_B64);

  function importRawKey(rawBytes){
    return crypto.subtle.importKey("raw", rawBytes, {name:"AES-GCM"}, true, ["decrypt"]);
  }
  function deriveKey(password){
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function(base){
        return crypto.subtle.deriveKey(
          {name:"PBKDF2", salt:SALT, iterations:ITER, hash:"SHA-256"},
          base, {name:"AES-GCM", length:256}, true, ["decrypt"]);
      });
  }
  function decryptWith(key){
    var raw = b64ToBytes(PAYLOAD_B64);
    var iv = raw.subarray(0,12);
    var body = raw.subarray(12);   // ciphertext || tag（WebCryptoは末尾のtagを自動処理）
    return crypto.subtle.decrypt({name:"AES-GCM", iv:iv}, key, body)
      .then(function(buf){ return new TextDecoder().decode(buf); });
  }
  function reveal(html){
    document.open();
    document.write(html);
    document.close();
  }
  function showGate(){ document.body.classList.add("show"); setTimeout(function(){ var p=document.getElementById("pw"); if(p) p.focus(); }, 30); }

  // --- 起動: セッションに鍵があれば自動解凍（iframe/別窓/ページ遷移で再入力なし）---
  function boot(){
    if (!(window.crypto && crypto.subtle)){
      // セキュアコンテキスト外（file:// 等）ではWebCrypto不可
      showGate();
      document.getElementById("msg").textContent = "このブラウザ／接続では 解凍できません（httpsが必要）";
      document.getElementById("msg").className = "msg err";
      return;
    }
    var cached = null;
    try { cached = sessionStorage.getItem(SS_KEY); } catch(e){}
    if (cached){
      importRawKey(b64ToBytes(cached))
        .then(decryptWith)
        .then(reveal)
        .catch(function(){
          try { sessionStorage.removeItem(SS_KEY); } catch(e){}
          showGate();
        });
    } else {
      showGate();
    }
  }

  window.addEventListener("DOMContentLoaded", function(){
    var form = document.getElementById("gate");
    var pw = document.getElementById("pw");
    var go = document.getElementById("go");
    var msg = document.getElementById("msg");
    var card = document.getElementById("gate");

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var pass = pw.value;
      if (!pass){ pw.focus(); return; }
      go.disabled = true;
      msg.className = "msg"; msg.textContent = "とびらを しらべています…";
      var derivedKey;
      deriveKey(pass)
        .then(function(k){ derivedKey = k; return decryptWith(k); })
        .then(function(html){
          msg.className = "msg ok"; msg.textContent = "ひらいた！";
          return crypto.subtle.exportKey("raw", derivedKey).then(function(raw){
            try { sessionStorage.setItem(SS_KEY, bytesToB64(new Uint8Array(raw))); } catch(e){}
            reveal(html);
          });
        })
        .catch(function(){
          go.disabled = false;
          msg.className = "msg err";
          msg.textContent = "あいことばが ちがうようだ…";
          card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
          pw.select();
        });
    });

    boot();
  });
})();
</script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// docs/index.html（ゲートなしの入口 → controller.html へ誘導。秘密は含まない）
function landingHTML() {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>おりもラボ・変身スタジオ</title>
<meta http-equiv="refresh" content="0; url=controller.html">
<link rel="canonical" href="controller.html">
<style>
  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
    background:#F4ECD8;color:#292826;font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
  a{color:#E85D26;font-weight:800}
</style>
</head>
<body>
  <p>スタジオへ すすみます… ひらかない場合は <a href="controller.html">こちら</a></p>
</body>
</html>
`;
}

// ---- 出力 ----
function rimraf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name), d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function build() {
  rimraf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  const saltB64 = SALT.toString('base64');
  let count = 0;

  for (const name of TARGETS) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) { console.warn('  スキップ（無し）:', name); continue; }
    const plaintext = fs.readFileSync(src, 'utf8');
    const titleMatch = plaintext.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : name;
    const payloadB64 = encrypt(plaintext);
    const html = loaderHTML({ title, payloadB64, saltB64, iterations: ITER });
    fs.writeFileSync(path.join(OUT, name), html);
    count++;
    console.log('  暗号化:', name, '(' + Math.round(plaintext.length / 1024) + 'KB → ローダー ' + Math.round(html.length / 1024) + 'KB)');
  }

  // 入口
  fs.writeFileSync(path.join(OUT, 'index.html'), landingHTML());

  // 非HTML資産をそのままコピー
  for (const dir of COPY_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) { copyDir(src, path.join(OUT, dir)); console.log('  コピー:', dir + '/'); }
  }

  console.log('\n完了: ' + count + '本を暗号化 → ' + OUT);
  console.log('salt=' + saltB64 + '  iterations=' + ITER + '  （平文パスワードは出力に含めていません）');
}

build();
