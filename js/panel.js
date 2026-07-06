/* ============================================================
   Control panel. A declarative schema of groups -> controls, each
   bound to a --s-* style var on the avatar. Updates are live.
   ============================================================ */
(function () {
  const P = (v, label, min, max, step, unit) =>
    ({ type: 'range', var: v, label, min, max, step, unit: unit === undefined ? 'px' : unit });
  const C = (v, label) => ({ type: 'color', var: v, label });
  const T = (cls, label) => ({ type: 'toggle', cls, label });
  const SEL = (label, options) => ({ type: 'select', label, options });

  const SCHEMA = [
    { title: '顔・輪郭', icon: '◐', controls: [
      P('--s-scale', 'サイズ', 0.5, 1.6, 0.01, ''),
      P('--s-head-w', '顔の幅', 160, 300, 1),
      P('--s-head-h', '顔の高さ', 170, 300, 1),
      C('--s-skin', '肌の色'),
      C('--s-skin-sh', '影の色'),
    ]},
    { title: '目', icon: '👁', controls: [
      P('--s-eye-w', '横幅', 24, 90, 1),
      P('--s-eye-h', '高さ', 24, 100, 1),
      P('--s-eye-gap', '間隔', 8, 70, 1),
      P('--s-eye-y', '上下位置', -20, 40, 1),
      P('--s-eye-tilt', '吊り目↔たれ目', -16, 16, 0.5, 'deg'),
      C('--s-iris', '瞳の色'),
      C('--s-iris2', '瞳ハイライト'),
    ]},
    { title: '眉', icon: '⌒', controls: [
      P('--s-brow-y', '上下位置', -16, 24, 1),
      P('--s-brow-thick', '太さ', 0, 18, 1),
      P('--s-brow-w', '長さ', 0, 64, 1),
      P('--s-brow-angle', '角度', -16, 16, 0.5, 'deg'),
      C('--s-brow-color', '眉の色'),
    ]},
    { title: '口', icon: '◡', controls: [
      P('--s-mouth-w', '横幅', 16, 80, 1),
      P('--s-mouth-y', '上下位置', 30, 110, 1),
      C('--s-mouth-color', '口の色'),
    ]},
    { title: 'テーマ配色', icon: '🎨', controls: [
      { type: 'themes', themes: [
        { name: '桜', h: '#ffb3d1', d: '#e98bb4', sh: '#ffe0ee', i: '#e85a90', i2: '#ffd0e6', a: '#ff7ab0' },
        { name: '海', h: '#6fc6e8', d: '#3a8fc4', sh: '#cfeeff', i: '#2b7fc4', i2: '#bfe8ff', a: '#3aa0e0' },
        { name: '森', h: '#86c98a', d: '#4f9b5c', sh: '#d6f0d0', i: '#3a8f56', i2: '#cdeec0', a: '#5bbf6e' },
        { name: '夜', h: '#6b6fb0', d: '#454a86', sh: '#a7abe0', i: '#7c6cff', i2: '#cfc8ff', a: '#9a8cff' },
        { name: '炎', h: '#ff8a5c', d: '#e0552f', sh: '#ffd0b0', i: '#e0431f', i2: '#ffcaa0', a: '#ff6a3a' },
        { name: '宝石', h: '#c46fd0', d: '#9a3fa8', sh: '#f0c0f6', i: '#d36a2a', i2: '#ffd9a0', a: '#cf5ad8' },
        { name: 'モノクロ', h: '#9aa0ad', d: '#5c626e', sh: '#d6dae2', i: '#33373f', i2: '#aeb4be', a: '#7c8290' },
        { name: 'オーロラ', h: '#6fe0c8', d: '#5a8fd0', sh: '#d0fff2', i: '#7a5cff', i2: '#bfe8ff', a: '#5be0b0' },
      ]},
    ]},
    { title: '髪', icon: '〰', controls: [
      SEL('髪型', [
        { val: 'bob', label: 'ボブ（標準）', cls: '' },
        { val: 'twintails', label: 'ツインテール', cls: 'hair-twintails' },
        { val: 'ponytail', label: 'ポニーテール', cls: 'hair-ponytail' },
        { val: 'long', label: 'ロング', cls: 'hair-long' },
        { val: 'short', label: 'ショート', cls: 'hair-short' },
      ]),
      C('--s-hair', '髪の色'),
      C('--s-hair2', '髪の影'),
      C('--s-hair-shine', 'ツヤ'),
    ]},
    { title: 'チーク・その他', icon: '✿', controls: [
      C('--s-blush', 'チーク色'),
      P('--s-blush-op', 'チーク濃さ', 0, 1, 0.01, ''),
      P('--s-nose-op', '鼻の濃さ', 0, 1, 0.01, ''),
    ]},
    { title: 'アクセサリ', icon: '🎀', controls: [
      T('acc-glasses', 'メガネ'),
      T('acc-headphones', 'ヘッドホン'),
      T('acc-ribbon', 'リボン'),
      T('acc-ahoge', 'アホ毛'),
      T('acc-hat', 'ニット帽'),
      T('acc-collar', '襟・服'),
      T('fx-sparkle', '✨ キラキラ'),
    ]},
  ];

  function parseVal(raw) {
    const m = String(raw).trim().match(/-?[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  function build(panelBody, avatar, onChange) {
    panelBody.innerHTML = '';
    SCHEMA.forEach(group => {
      const sec = document.createElement('section');
      sec.className = 'pgroup';
      sec.innerHTML = `<h3 class="pgroup-title"><span>${group.icon}</span>${group.title}</h3>`;
      const body = document.createElement('div');
      body.className = 'pgroup-body';
      group.controls.forEach(ctl => {
        const cur = avatar.getStyle(ctl.var).trim();
        const row = document.createElement('div');
        row.className = 'pctl';
        if (ctl.type === 'themes') {
          row.classList.add('pctl-themes');
          row.innerHTML = `<div class="theme-row">${ctl.themes.map((t, i) =>
            `<button class="theme-sw" data-i="${i}" title="${t.name}"
               style="background:linear-gradient(135deg,${t.h},${t.d})">
               <span>${t.name}</span></button>`).join('')}</div>`;
          row.querySelectorAll('.theme-sw').forEach(btn => {
            btn.addEventListener('click', () => {
              const t = ctl.themes[btn.dataset.i];
              avatar.setStyles({
                '--s-hair': t.h, '--s-hair2': t.d, '--s-hair-shine': t.sh,
                '--s-iris': t.i, '--s-iris2': t.i2, '--s-acc': t.a,
              });
              sync(panelBody, avatar);   // reflect new colours in the pickers
              onChange && onChange();
            });
          });
        } else if (ctl.type === 'select') {
          const cur = ctl.options.find(o => o.cls && avatar.el.classList.contains(o.cls)) || ctl.options[0];
          const allCls = ctl.options.map(o => o.cls).filter(Boolean);
          row.innerHTML = `
            <label>${ctl.label}</label>
            <select class="pselect" data-classes="${allCls.join(',')}">
              ${ctl.options.map(o => `<option value="${o.cls}" ${o === cur ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>`;
          row.querySelector('select').addEventListener('change', e => {
            allCls.forEach(c => avatar.el.classList.remove(c));
            if (e.target.value) avatar.el.classList.add(e.target.value);
            onChange && onChange();
          });
        } else if (ctl.type === 'toggle') {
          const on = avatar.el.classList.contains(ctl.cls);
          row.classList.add('pctl-toggle');
          row.innerHTML = `
            <label class="tgl">
              <input type="checkbox" data-cls="${ctl.cls}" ${on ? 'checked' : ''}>
              <span>${ctl.label}</span>
            </label>`;
          row.querySelector('input').addEventListener('change', e => {
            avatar.el.classList.toggle(ctl.cls, e.target.checked);
            onChange && onChange();
          });
        } else if (ctl.type === 'color') {
          row.innerHTML = `
            <label>${ctl.label}</label>
            <input type="color" value="${toHex(cur)}" data-var="${ctl.var}">`;
          row.querySelector('input').addEventListener('input', e => {
            avatar.setStyle(ctl.var, e.target.value);
            onChange && onChange();
          });
        } else {
          const val = cur ? parseVal(cur) : ctl.min;
          row.innerHTML = `
            <label>${ctl.label} <output>${fmt(val, ctl.unit)}</output></label>
            <input type="range" min="${ctl.min}" max="${ctl.max}" step="${ctl.step}"
                   value="${val}" data-var="${ctl.var}" data-unit="${ctl.unit}">`;
          const input = row.querySelector('input');
          const out = row.querySelector('output');
          input.addEventListener('input', e => {
            const v = e.target.value;
            avatar.setStyle(ctl.var, ctl.unit ? v + ctl.unit : v);
            out.textContent = fmt(v, ctl.unit);
            onChange && onChange();
          });
        }
        body.appendChild(row);
      });
      sec.appendChild(body);
      panelBody.appendChild(sec);
    });
  }

  // refresh control widgets to match current avatar var values (after model swap / random)
  function sync(panelBody, avatar) {
    panelBody.querySelectorAll('input[data-cls]').forEach(input => {
      input.checked = avatar.el.classList.contains(input.dataset.cls);
    });
    panelBody.querySelectorAll('select[data-classes]').forEach(sel => {
      const classes = sel.dataset.classes.split(',').filter(Boolean);
      const active = classes.find(c => avatar.el.classList.contains(c)) || '';
      sel.value = active;
    });
    panelBody.querySelectorAll('input[data-var]').forEach(input => {
      const v = avatar.getStyle(input.dataset.var).trim();
      if (input.type === 'color') {
        input.value = toHex(v);
      } else {
        const n = parseVal(v);
        input.value = n;
        const out = input.closest('.pctl').querySelector('output');
        if (out) out.textContent = fmt(n, input.dataset.unit);
      }
    });
  }

  function fmt(v, unit) {
    const n = parseFloat(v);
    const s = Number.isInteger(n) ? n : n.toFixed(2);
    return unit === '' ? s : s + (unit || 'px');
  }

  function toHex(c) {
    c = (c || '').trim();
    if (/^#([0-9a-f]{6})$/i.test(c)) return c;
    if (/^#([0-9a-f]{3})$/i.test(c)) {
      return '#' + c.slice(1).split('').map(x => x + x).join('');
    }
    // rgb(...) -> hex
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b] = m[1].split(',').map(x => parseInt(x));
      return '#' + [r, g, b].map(x => ('0' + (x & 255).toString(16)).slice(-2)).join('');
    }
    return '#000000';
  }

  const HAIR_STYLES = ['', 'hair-twintails', 'hair-ponytail', 'hair-long', 'hair-short'];
  const ACCS = ['acc-glasses', 'acc-headphones', 'acc-ribbon', 'acc-ahoge', 'acc-hat'];

  function randomize(avatar) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const hue = Math.floor(rnd(0, 360));
    const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;
    // a coherent hair palette from one hue
    const hairH = Math.floor(rnd(0, 360));
    avatar.setStyles({
      '--s-eye-w': Math.round(rnd(40, 78)) + 'px',
      '--s-eye-h': Math.round(rnd(46, 90)) + 'px',
      '--s-eye-gap': Math.round(rnd(22, 50)) + 'px',
      '--s-eye-tilt': rnd(-12, 12).toFixed(1) + 'deg',
      '--s-iris': hsl(hue, Math.round(rnd(55, 85)), Math.round(rnd(45, 62))),
      '--s-iris2': hsl(hue, Math.round(rnd(55, 90)), Math.round(rnd(72, 86))),
      '--s-hair': hsl(hairH, Math.round(rnd(45, 80)), Math.round(rnd(48, 66))),
      '--s-hair2': hsl(hairH, Math.round(rnd(45, 80)), Math.round(rnd(34, 50))),
      '--s-hair-shine': hsl(hairH, Math.round(rnd(40, 70)), Math.round(rnd(74, 88))),
      '--s-mouth-w': Math.round(rnd(24, 56)) + 'px',
      '--s-brow-angle': rnd(-10, 10).toFixed(1) + 'deg',
      '--s-blush-op': rnd(0.25, 0.75).toFixed(2),
      '--s-acc': hsl(Math.floor(rnd(0, 360)), 80, 62),
    });
    // randomize hair style + accessories (only meaningful for models with hair,
    // but harmless on others — extras are hidden by model CSS anyway)
    [...HAIR_STYLES.filter(Boolean), ...ACCS].forEach(c => avatar.el.classList.remove(c));
    const hairStyle = pick(HAIR_STYLES);
    if (hairStyle) avatar.el.classList.add(hairStyle);
    ACCS.forEach(c => { if (Math.random() < 0.3) avatar.el.classList.add(c); });
  }

  window.VTPanel = { build, sync, randomize, SCHEMA };
})();
