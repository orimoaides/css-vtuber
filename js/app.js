/* ============================================================
   App wiring: model picker, panel, idle loop, tracking, export.
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const stage = $('#stage');
  const mount = $('#avatarMount');
  const panelBody = $('#panelBody');
  const statusEl = $('#stageStatus');

  const avatar = new Avatar(mount);
  let currentModel = window.VT_MODELS[0];

  // ---- model picker ----
  const picker = $('#modelPicker');
  window.VT_MODELS.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id; o.textContent = `${m.emoji} ${m.name}`;
    picker.appendChild(o);
  });
  function loadModel(model) {
    currentModel = model;
    avatar.applyModel(model);
    VTPanel.build(panelBody, avatar, () => {});
  }
  picker.addEventListener('change', e => loadModel(window.VT_MODEL_BY_ID[e.target.value]));

  // ---- panel buttons ----
  $('#randomBtn').addEventListener('click', () => {
    VTPanel.randomize(avatar);
    VTPanel.sync(panelBody, avatar);
    toast('ランダム生成しました');
  });
  $('#resetBtn').addEventListener('click', () => {
    loadModel(currentModel);
    toast('リセットしました');
  });

  // ---- stage toggles ----
  $('#toggleGrid').addEventListener('change', e => stage.classList.toggle('no-grid', !e.target.checked));
  $('#toggleMirror').addEventListener('change', e => stage.classList.toggle('no-mirror', !e.target.checked));
  const idleChk = $('#toggleIdle');

  // ---- background scenes ----
  // each: studio = what the editor stage shows, exp = what the exported body uses
  const BACKDROPS = {
    solid:       { studio: () => $('#bgColor').value, exp: () => $('#bgColor').value },
    studio:      { css: 'radial-gradient(120% 90% at 50% 18%, #2a2f48 0%, #14172447 40%, #0a0c14 100%)' },
    night:       { css: 'radial-gradient(120% 120% at 50% 0%, #2a3a6a 0%, #11162e 55%, #070912 100%)' },
    stars:       { css: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 70% 60%, #cfe, transparent), radial-gradient(2px 2px at 40% 80%, #fff, transparent), radial-gradient(1px 1px at 85% 20%, #fff, transparent), radial-gradient(120% 120% at 50% 10%, #1a2142, #060812)' },
    sunset:      { css: 'linear-gradient(180deg, #2a2350 0%, #6a3f6e 45%, #d97a5a 80%, #f4c07a 100%)' },
    chroma:      { css: '#00b140', exp: () => '#00b140', solid: true },
    transparent: { studio: () => 'transparent', exp: () => 'transparent', checker: true },
  };
  let currentBg = 'solid';
  function applyBg(id) {
    currentBg = id;
    const b = BACKDROPS[id] || BACKDROPS.solid;
    stage.classList.toggle('bg-checker', !!b.checker);
    const val = b.studio ? b.studio() : b.css;
    stage.style.background = b.checker ? '' : val;   // checker handled by CSS class
    if (!b.checker) stage.style.setProperty('--stage-bg', val);
  }
  function exportBgValue() {
    const b = BACKDROPS[currentBg] || BACKDROPS.solid;
    return b.exp ? b.exp() : (b.css || $('#bgColor').value);
  }
  $('#bgScene').addEventListener('change', e => applyBg(e.target.value));
  $('#bgColor').addEventListener('input', () => { if (currentBg === 'solid') applyBg('solid'); });

  // ---- idle motion loop (drives --p-* when not tracking) ----
  let tracking = false;
  let puppet = false;
  let holdUntil = 0;            // expression hold: suspends idle writes
  let t0 = performance.now();
  let nextBlink = performance.now() + 1500;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function idleLoop(now) {
    if (idleChk.checked && !tracking && !puppet && now > holdUntil) {
      const t = (now - t0) / 1000;
      // reduced motion: keep the avatar still, only allow gentle blinking
      const amp = reduceMotion ? 0 : 1;
      avatar.setPose({
        '--p-breath': (amp * (Math.sin(t * 1.5) * 0.5 + 0.5)).toFixed(3),
        '--p-yaw': (amp * Math.sin(t * 0.5) * 0.22).toFixed(3),
        '--p-pitch': (amp * Math.sin(t * 0.37) * 0.12).toFixed(3),
        '--p-roll': (amp * Math.sin(t * 0.43) * 0.12).toFixed(3),
        '--p-eye-x': (amp * Math.sin(t * 0.6) * 0.4).toFixed(3),
        '--p-eye-y': (amp * Math.sin(t * 0.45) * 0.25).toFixed(3),
      });
      if (now > nextBlink) {
        avatar.setPose({ '--p-blink': '1' });
        setTimeout(() => avatar.setPose({ '--p-blink': '0' }), 110);
        nextBlink = now + 1800 + Math.random() * 3200;
      }
    }
    requestAnimationFrame(idleLoop);
  }
  requestAnimationFrame(idleLoop);

  // ---- tracking ----
  const trackBtn = $('#trackBtn');
  const calibBtn = $('#calibBtn');
  const video = $('#camFeed');
  calibBtn.addEventListener('click', () => {
    VTTracker.recalibrate();
    statusEl.textContent = '再キャリブレーション中… 正面を向いてください';
    toast('正面を向いてキャリブレーション');
  });
  trackBtn.addEventListener('click', async () => {
    if (tracking) {
      VTTracker.stop();
      tracking = false;
      stage.classList.remove('tracking');
      trackBtn.classList.remove('on');
      trackBtn.textContent = '● フェイストラッキング';
      statusEl.textContent = 'アイドル中';
      calibBtn.hidden = true;
      // reset blink to open
      avatar.setPose({ '--p-blink-l': '0', '--p-blink-r': '0' });
      return;
    }
    try {
      trackBtn.textContent = '初期化中…';
      await VTTracker.start(video, p => avatar.setPose(p), s => statusEl.textContent = s);
      tracking = true;
      stage.classList.add('tracking');
      trackBtn.classList.add('on');
      trackBtn.textContent = '■ トラッキング停止';
      calibBtn.hidden = false;
    } catch (e) {
      console.error(e);
      statusEl.textContent = 'カメラを起動できません: ' + e.message;
      trackBtn.textContent = '● フェイストラッキング';
      toast('カメラ起動に失敗しました');
    }
  });

  // ---- expression presets ----
  const EXPR = {
    neutral:   { '--p-mouth':'0','--p-mouth-wide':'0','--p-brow':'0','--p-blink':'0','--p-blink-l':'0','--p-blink-r':'0','--p-pitch':'0' },
    smile:     { '--p-mouth':'0.32','--p-mouth-wide':'0.85','--p-brow':'0.25','--p-blink':'0.18','--p-blink-l':'0.18','--p-blink-r':'0.18' },
    surprised: { '--p-mouth':'0.7','--p-mouth-wide':'0','--p-brow':'1','--p-blink':'0','--p-blink-l':'0','--p-blink-r':'0','--p-pitch':'-0.15' },
    angry:     { '--p-mouth':'0.12','--p-mouth-wide':'-0.3','--p-brow':'-1','--p-blink':'0.1','--p-blink-l':'0.1','--p-blink-r':'0.1','--p-pitch':'0.1' },
    sad:       { '--p-mouth':'0.1','--p-mouth-wide':'-0.2','--p-brow':'0.55','--p-blink':'0.25','--p-pitch':'0.22','--p-eye-y':'0.4' },
    sleepy:    { '--p-mouth':'0.22','--p-mouth-wide':'-0.1','--p-brow':'0.2','--p-blink':'0.7','--p-blink-l':'0.7','--p-blink-r':'0.7','--p-pitch':'0.25' },
    wink:      { '--p-mouth':'0.3','--p-mouth-wide':'0.7','--p-blink-r':'1','--p-blink-l':'0','--p-brow':'0.3' },
    happy:     { '--p-mouth':'0.42','--p-mouth-wide':'1','--p-blink':'0.5','--p-blink-l':'0.5','--p-blink-r':'0.5','--p-brow':'0.45' },
    smug:      { '--p-mouth':'0.12','--p-mouth-wide':'0.35','--p-blink':'0.45','--p-blink-l':'0.45','--p-blink-r':'0.45','--p-brow':'-0.3','--p-eye-y':'0.25' },
  };
  let exprAnimTimer;
  document.querySelectorAll('.expr-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (tracking) { toast('トラッキング中は表情プリセットを使えません'); return; }
      const e = EXPR[b.dataset.expr] || EXPR.neutral;
      // reset transient pose first, then apply (with a brief glide)
      avatar.setPose({ '--p-blink':'0','--p-blink-l':'0','--p-blink-r':'0','--p-eye-y':'0','--p-pitch':'0' });
      avatar.el.classList.add('expr-anim');
      avatar.setPose(e);
      clearTimeout(exprAnimTimer);
      exprAnimTimer = setTimeout(() => avatar.el.classList.remove('expr-anim'), 420);
      holdUntil = performance.now() + 2800;   // hold the face before idle resumes
    });
  });

  // ---- talk test (lip-sync preview, no mic needed) ----
  let talking = false;
  $('#talkBtn').addEventListener('click', () => {
    if (tracking) { toast('トラッキング中はテスト不要です'); return; }
    if (talking) return;
    talking = true;
    const end = performance.now() + 3500;
    let next = 0;
    function flap(now) {
      if (now >= end) {
        avatar.setPose({ '--p-mouth': '0', '--p-mouth-wide': '0' });
        talking = false;
        return;
      }
      holdUntil = now + 200;              // keep idle from overwriting the mouth
      if (now >= next) {
        // open in bursts like syllables, occasionally close
        const open = Math.random() < 0.2 ? 0 : (0.25 + Math.random() * 0.6);
        avatar.setPose({
          '--p-mouth': open.toFixed(2),
          '--p-mouth-wide': (Math.random() * 0.4 - 0.1).toFixed(2),
        });
        next = now + 90 + Math.random() * 110;
      }
      requestAnimationFrame(flap);
    }
    requestAnimationFrame(flap);
  });

  // ---- puppet (mouse) mode ----
  const puppetChk = $('#togglePuppet');
  puppetChk.addEventListener('change', e => {
    puppet = e.target.checked && !tracking;
    if (!puppet) avatar.setPose({ '--p-mouth':'0' });
  });
  stage.addEventListener('mousemove', e => {
    if (!puppet) return;
    const r = stage.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    avatar.setPose({
      '--p-yaw': (nx * 0.8).toFixed(3),
      '--p-pitch': (-ny * 0.6).toFixed(3),
      '--p-eye-x': (nx * 0.6).toFixed(3),
      '--p-eye-y': (ny * 0.5).toFixed(3),
    });
  });
  stage.addEventListener('mousedown', () => { if (puppet) avatar.setPose({ '--p-mouth':'0.7' }); });
  stage.addEventListener('mouseup', () => { if (puppet) avatar.setPose({ '--p-mouth':'0' }); });

  // ---- save / share via URL hash ----
  function serialize() {
    const styleVars = {};
    (avatar.el.getAttribute('style') || '').split(';').forEach(s => {
      const [k, v] = s.split(':').map(x => x && x.trim());
      if (k && k.startsWith('--s-')) styleVars[k] = v;
    });
    const acc = [...avatar.el.classList]
      .filter(c => c !== 'avatar' && c !== 'idle' && !c.startsWith('model-'));
    return { m: currentModel.id, s: styleVars, c: acc };
  }
  function applyState(state) {
    const model = window.VT_MODEL_BY_ID[state.m] || window.VT_MODELS[0];
    picker.value = model.id;
    loadModel(model);
    if (state.c) state.c.forEach(c => avatar.el.classList.add(c));
    if (state.s) avatar.setStyles(state.s);
    VTPanel.sync(panelBody, avatar);
  }
  function encodeState() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(serialize()))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decodeState(s) {
    try {
      const b = s.replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  }
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#a=' + encodeState();
    try {
      await navigator.clipboard.writeText(url);
      toast('共有リンクをコピーしました ✓');
    } catch (e) {
      location.hash = 'a=' + encodeState();
      toast('URLに保存しました（コピー不可・アドレスバー参照）');
    }
  });

  // ---- saved avatars (localStorage) ----
  const SAVE_KEY = 'vt_saved_avatars';
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; }
  }
  function setSaved(arr) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  $('#saveBtn').addEventListener('click', () => {
    const arr = getSaved();
    const state = serialize();
    state.bg = currentBg;
    state.name = `${currentModel.emoji} 保存${arr.length + 1}`;
    arr.push(state);
    while (arr.length > 16) arr.shift();
    setSaved(arr);
    toast('アバターを保存しました ✓（ギャラリーから呼び出せます）');
  });

  // ---- preset gallery ----
  const galleryModal = $('#galleryModal');
  const galleryGrid = $('#galleryGrid');

  function makeCard(item, opts) {
    const card = document.createElement('button');
    card.className = 'gallery-card';
    const prev = document.createElement('div');
    prev.className = 'gallery-prev';
    card.appendChild(prev);
    const name = document.createElement('div');
    name.className = 'gallery-name';
    name.textContent = item.name;
    card.appendChild(name);
    const mini = new Avatar(prev);
    const model = window.VT_MODEL_BY_ID[item.m] || window.VT_MODELS[0];
    mini.applyModel(model);
    if (item.s) mini.setStyles(item.s);
    (item.c || []).forEach(c => mini.el.classList.add(c));
    card.addEventListener('click', () => {
      applyState({ m: item.m, s: item.s, c: item.c });
      if (item.bg) { $('#bgScene').value = item.bg; applyBg(item.bg); }
      closeGallery();
      toast(`「${item.name}」を適用しました ✓`);
    });
    if (opts && opts.onDelete) {
      const del = document.createElement('span');
      del.className = 'gallery-del';
      del.textContent = '✕';
      del.title = '削除';
      del.addEventListener('click', e => { e.stopPropagation(); opts.onDelete(); });
      card.appendChild(del);
    }
    return card;
  }
  function sectionLabel(text) {
    const h = document.createElement('div');
    h.className = 'gallery-section';
    h.textContent = text;
    return h;
  }
  function buildGallery() {
    galleryGrid.innerHTML = '';
    const saved = getSaved();
    if (saved.length) {
      galleryGrid.appendChild(sectionLabel('💾 保存したアバター'));
      saved.forEach((item, i) => {
        galleryGrid.appendChild(makeCard(item, {
          onDelete: () => {
            const arr = getSaved(); arr.splice(i, 1); setSaved(arr);
            buildGallery();
            toast('削除しました');
          },
        }));
      });
      galleryGrid.appendChild(sectionLabel('✨ プリセット'));
    }
    (window.VT_PRESETS || []).forEach(preset => galleryGrid.appendChild(makeCard(preset)));
  }
  function openGallery() {
    buildGallery();   // rebuild each time so saved avatars stay fresh
    galleryModal.hidden = false;
  }

  // ---- JSON export / import of the current avatar ----
  $('#jsonExportBtn').addEventListener('click', () => {
    const state = serialize();
    state.bg = currentBg;
    state.name = currentModel.name;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `css-vtuber-${currentModel.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('JSONを書き出しました ✓');
  });
  $('#jsonImportBtn').addEventListener('click', () => $('#jsonFile').click());
  $('#jsonFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const state = JSON.parse(reader.result);
        if (!state || !window.VT_MODEL_BY_ID[state.m]) throw new Error('invalid');
        applyState(state);
        if (state.bg) { $('#bgScene').value = state.bg; applyBg(state.bg); }
        closeGallery();
        toast('JSONを読み込みました ✓');
      } catch (err) {
        toast('JSONの読み込みに失敗しました');
      }
      $('#jsonFile').value = '';
    };
    reader.readAsText(file);
  });
  function closeGallery() { galleryModal.hidden = true; }
  $('#galleryBtn').addEventListener('click', openGallery);
  galleryModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeGallery));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGallery(); });

  // ---- export ----
  $('#exportBtn').addEventListener('click', async () => {
    toast('HTMLを書き出し中…');
    try {
      await VTExport.exportHTML(avatar.el, currentModel, exportBgValue());
      toast('単体HTMLを出力しました ✓');
    } catch (e) {
      console.error(e);
      toast('出力に失敗しました');
    }
  });

  // ---- toast ----
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---- help overlay (auto-shows on first visit) ----
  const helpModal = $('#helpModal');
  function openHelp() { helpModal.hidden = false; }
  function closeHelp() { helpModal.hidden = true; }
  $('#helpBtn').addEventListener('click', openHelp);
  $('#helpStart').addEventListener('click', closeHelp);
  helpModal.querySelectorAll('[data-close-help]').forEach(el => el.addEventListener('click', closeHelp));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHelp(); });
  try {
    if (!localStorage.getItem('vt_seen_help')) {
      openHelp();
      localStorage.setItem('vt_seen_help', '1');
    }
  } catch (e) {}

  // ---- keyboard shortcuts ----
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.metaKey || e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '9') {
      const idx = parseInt(k, 10) - 1;
      if (window.VT_MODELS[idx]) { picker.value = window.VT_MODELS[idx].id; loadModel(window.VT_MODELS[idx]); }
    } else if (k === 'r') { $('#randomBtn').click(); }
    else if (k === 'g') { galleryModal.hidden ? openGallery() : closeGallery(); }
    else if (k === 'e') { $('#exportBtn').click(); }
    else if (k === ' ') {
      e.preventDefault();
      avatar.setPose({ '--p-blink': '1' });
      setTimeout(() => avatar.setPose({ '--p-blink': '0' }), 130);
    }
  });

  // ---- boot ----
  const hash = location.hash.match(/a=([^&]+)/);
  const saved = hash && decodeState(hash[1]);
  if (saved) { applyState(saved); toast('共有データを読み込みました'); }
  else loadModel(currentModel);
})();
