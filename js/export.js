/* ============================================================
   Standalone export. Bakes the current avatar (DOM + style vars
   + avatar.css) into ONE self-contained .html file with an
   embedded idle loop and an optional MediaPipe face tracker.
   The output needs no build step and no local files.
   ============================================================ */
(function () {
  function getAvatarCSS() {
    // serialize the avatar.css rules from the loaded stylesheet
    for (const sheet of document.styleSheets) {
      if (sheet.href && /avatar\.css/.test(sheet.href)) {
        try {
          return [...sheet.cssRules].map(r => r.cssText).join('\n');
        } catch (e) { /* cross-origin: fall through to fetch */ }
      }
    }
    return null;
  }

  async function getAvatarCSSAsync() {
    const inline = getAvatarCSS();
    if (inline) return inline;
    try {
      const res = await fetch('css/avatar.css');
      return await res.text();
    } catch (e) {
      return '/* avatar.css could not be inlined */';
    }
  }

  function cleanAvatarHTML(avatarEl) {
    const clone = avatarEl.cloneNode(true);
    clone.classList.remove('idle');
    // strip live pose vars so export opens neutral
    const style = clone.getAttribute('style') || '';
    const kept = style.split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--p-'))
      .join('; ');
    clone.setAttribute('style', kept);
    return clone.outerHTML;
  }

  const RUNTIME = String.raw`
(function(){
  var av = document.querySelector('.avatar');
  var status = document.getElementById('st');
  var set = function(o){ for(var k in o) av.style.setProperty(k,o[k]); };

  /* ---- idle motion ---- */
  var idleOn = true, t0 = performance.now(), tracking = false, nextBlink = 1500;
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
  function idle(now){
    if(idleOn && !tracking){
      var t=(now-t0)/1000;
      set({
        '--p-breath': (rm*(Math.sin(t*1.5)*0.5+0.5)).toFixed(3),
        '--p-yaw': (rm*Math.sin(t*0.5)*0.25).toFixed(3),
        '--p-pitch': (rm*Math.sin(t*0.37)*0.12).toFixed(3),
        '--p-roll': (rm*Math.sin(t*0.43)*0.12).toFixed(3),
        '--p-eye-x': (rm*Math.sin(t*0.6)*0.4).toFixed(3),
      });
      if(now>nextBlink){
        av.style.setProperty('--p-blink','1');
        setTimeout(function(){av.style.setProperty('--p-blink','0');},110);
        nextBlink = now + 1800 + Math.random()*3000;
      }
    }
    requestAnimationFrame(idle);
  }
  requestAnimationFrame(idle);

  /* ---- face tracking (loaded on demand) ---- */
  var CDN='https://cdn.jsdelivr.net/npm/@mediapipe';
  function load(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.crossOrigin='anonymous';s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  var dist=function(a,b){return Math.hypot(a.x-b.x,a.y-b.y);};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
  var sm={},lerp=function(a,b,t){return a+(b-a)*t;};
  function S(k,v,t){if(sm[k]==null)sm[k]=v;sm[k]=lerp(sm[k],v,t);return sm[k];}
  var base=null,bf=0,acc={pitch:0,bg:0,oL:0,oR:0};

  window.startTrack = async function(){
    if(tracking) return;
    status.textContent='カメラ初期化中…';
    try{
      await load(CDN+'/camera_utils/camera_utils.js');
      await load(CDN+'/face_mesh/face_mesh.js');
    }catch(e){ status.textContent='読み込み失敗（ネット接続を確認）'; return; }
    var video=document.createElement('video'); video.playsInline=true; video.muted=true;
    var mesh=new window.FaceMesh({locateFile:function(f){return CDN+'/face_mesh/'+f;}});
    mesh.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
    mesh.onResults(onResults);
    var cam=new window.Camera(video,{onFrame:async function(){await mesh.send({image:video});},width:640,height:480});
    tracking=true; status.textContent='トラッキング中 ●';
    await cam.start();
  };

  function onResults(r){
    var lms=r.multiFaceLandmarks&&r.multiFaceLandmarks[0];
    if(!lms){status.textContent='顔を検出できません…';return;}
    var L=function(i){return lms[i];};
    var oL=L(33),iL=L(133),oR=L(263),iR=L(362),nose=L(1),chin=L(152),top=L(10),fl=L(234),fr=L(454);
    var fw=dist(fl,fr)||1e-4, fh=dist(top,chin)||1e-4;
    var em={x:(oL.x+oR.x)/2,y:(oL.y+oR.y)/2};
    var yaw=(nose.x-em.x)/fw, pitch=(nose.y-em.y)/fh, roll=Math.atan2(oR.y-oL.y,oR.x-oL.x);
    var opL=dist(L(159),L(145))/(dist(oL,iL)||1e-4), opR=dist(L(386),L(374))/(dist(oR,iR)||1e-4);
    var mo=dist(L(13),L(14))/(dist(L(78),L(308))||1e-4), mw=dist(L(78),L(308))/fw;
    var bg=(dist(L(105),L(159))+dist(L(334),L(386)))/2/fh;
    var gx=0,gy=0;
    if(lms.length>=478){var il=L(468),ir=L(473);
      gx=((il.x-(oL.x+iL.x)/2)/(dist(oL,iL)||1e-4))+((ir.x-(oR.x+iR.x)/2)/(dist(oR,iR)||1e-4));
      gy=(il.y-(L(159).y+L(145).y)/2)/(dist(L(159),L(145))||1e-4);}
    if(!base&&bf<15){bf++;acc.pitch+=pitch;acc.bg+=bg;acc.oL+=opL;acc.oR+=opR;
      if(bf===15)base={pitch:acc.pitch/15,bg:acc.bg/15,oL:acc.oL/15,oR:acc.oR/15};}
    var b=base||{pitch:0.34,bg:0.12,oL:0.32,oR:0.32};
    set({
      '--p-yaw':S('yaw',clamp(yaw*5,-1,1),0.45).toFixed(3),
      '--p-pitch':S('pi',clamp((pitch-b.pitch)*6,-1,1),0.45).toFixed(3),
      '--p-roll':S('ro',clamp(roll/0.6,-1,1),0.45).toFixed(3),
      '--p-blink-l':S('bl',clamp(1-opL/b.oL,0,1),0.6).toFixed(3),
      '--p-blink-r':S('br',clamp(1-opR/b.oR,0,1),0.6).toFixed(3),
      '--p-mouth':S('m',clamp((mo-0.05)*2.2,0,1),0.5).toFixed(3),
      '--p-mouth-wide':S('mw',clamp((mw-b.bg)*6,-0.4,1),0.45).toFixed(3),
      '--p-brow':S('bw',clamp((bg-b.bg)*8,-1,1),0.45).toFixed(3),
      '--p-eye-x':S('gx',clamp(gx*3,-1,1),0.4).toFixed(3),
      '--p-eye-y':S('gy',clamp(gy*2,-1,1),0.4).toFixed(3)
    });
  }
  document.getElementById('btnTrack').addEventListener('click',window.startTrack);
  document.getElementById('btnIdle').addEventListener('click',function(){idleOn=!idleOn;this.classList.toggle('off',!idleOn);});
})();`;

  async function buildHTML(avatarEl, model, bg) {
    const css = await getAvatarCSSAsync();
    const avatarHTML = cleanAvatarHTML(avatarEl);
    const title = (model && model.name) ? model.name : 'CSS VTuber';
    const bgValue = bg || '#10141f';
    const isTransparent = bgValue === 'transparent';

    const doc = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — CSS VTuber</title>
<style>
:root{ color-scheme: dark; }
*{ box-sizing:border-box; }
html,body{ margin:0; height:100%; }
body{
  display:grid; place-items:center; min-height:100vh;
  background:${bgValue};
  font-family:system-ui,"Hiragino Kaku Gothic ProN",sans-serif;
  overflow:hidden;
}
${isTransparent ? '/* OBS: add this file as a Browser Source — the background is transparent. */\nhtml,body{ background:transparent !important; }' : ''}
.scene{ display:grid; place-items:center; gap:18px; }
.toolbar{
  position:fixed; left:50%; bottom:22px; transform:translateX(-50%);
  display:flex; gap:10px; align-items:center;
  background:rgba(20,26,40,.8); backdrop-filter:blur(8px);
  padding:10px 14px; border-radius:999px; border:1px solid rgba(255,255,255,.1);
}
.toolbar button{
  border:0; border-radius:999px; padding:9px 16px; cursor:pointer;
  font-size:13px; font-weight:600; color:#fff; background:#3a4a7a;
}
.toolbar button#btnTrack{ background:#d05a78; }
.toolbar button.off{ opacity:.45; }
#st{ color:#9fb0d8; font-size:12px; min-width:120px; }
${css}
</style>
</head>
<body>
<div class="scene">
  ${avatarHTML}
</div>
<div class="toolbar">
  <button id="btnTrack">● フェイストラッキング開始</button>
  <button id="btnIdle">アイドル motion</button>
  <span id="st">アイドル中</span>
</div>
<script>${RUNTIME}</script>
</body>
</html>`;
    return doc;
  }

  async function exportHTML(avatarEl, model, bg) {
    const doc = await buildHTML(avatarEl, model, bg);
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `css-vtuber-${(model && model.id) || 'avatar'}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  window.VTExport = { exportHTML, buildHTML };
})();
