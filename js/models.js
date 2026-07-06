/* ============================================================
   Model registry. Each model is the SAME slot structure so the
   control panel and face tracking work identically across them.
   A model only customizes:
     - klass     : a body class for model-specific CSS overrides
     - vars      : default --s-* style values
     - accessory : extra CSS-only DOM injected into .av-acc
   ============================================================ */
window.VT_MODELS = [
  {
    id: 'mira',
    name: 'ミラ（人間・少女）',
    emoji: '🙂',
    klass: 'model-human',
    vars: {
      '--s-skin': '#ffe3d3', '--s-skin-sh': '#f3b9a4', '--s-skin-line': '#e69e88',
      '--s-iris': '#6a5acd', '--s-iris2': '#b8a9ff',
      '--s-hair': '#6f80c4', '--s-hair2': '#4d5d9c', '--s-hair-shine': '#a7b4e6',
      '--s-mouth-color': '#c4566a', '--s-brow-color': '#5d4636',
      '--s-acc': '#ff6f91'
    },
    accessory: ''
  },

  {
    id: 'kuma',
    name: 'クマ（けもの）',
    emoji: '🐻',
    klass: 'model-bear',
    vars: {
      '--s-head-w': '250px', '--s-head-h': '236px',
      '--s-head-round': '50% 50% 46% 46% / 50% 50% 50% 50%',
      '--s-skin': '#caa179', '--s-skin-sh': '#a87f55', '--s-skin-line': '#8a6541',
      '--s-eye-w': '44px', '--s-eye-h': '50px', '--s-eye-gap': '40px', '--s-eye-y': '6px',
      '--s-iris': '#3a2a1c', '--s-iris2': '#6e4f33',
      '--s-brow-color': '#6b4a2e', '--s-brow-thick': '6px',
      '--s-mouth-color': '#5a3826', '--s-mouth-y': '86px', '--s-mouth-w': '30px',
      '--s-nose-op': '1',
      '--s-blush': '#e79a7a', '--s-blush-op': '0.4',
      '--s-hair': '#c49a72', '--s-hair2': '#a87f55', '--s-hair-shine': '#dcb98f',
      '--s-acc': '#3a2a1c'
    },
    accessory: `
      <div class="bear-ear left"></div>
      <div class="bear-ear right"></div>
      <div class="bear-snout"><div class="bear-nose"></div></div>`
  },

  {
    id: 'claude',
    name: 'クロード（マスコット）',
    emoji: '✴️',
    klass: 'model-claude',
    vars: {
      '--s-head-w': '236px', '--s-head-h': '236px',
      '--s-head-round': '50%',
      '--s-skin': '#e8a07e', '--s-skin-sh': '#d97757', '--s-skin-line': '#c25c3c',
      '--s-eye-w': '40px', '--s-eye-h': '52px', '--s-eye-gap': '34px', '--s-eye-y': '4px',
      '--s-eye-white': '#2b1d16', '--s-iris': '#2b1d16', '--s-iris2': '#3a261c',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#2b1d16', '--s-mouth-y': '64px', '--s-mouth-w': '34px',
      '--s-nose-op': '0',
      '--s-blush': '#ffb38f', '--s-blush-op': '0.5',
      '--s-hair': '#d97757', '--s-hair2': '#c25c3c', '--s-hair-shine': '#f0b89c',
      '--s-acc': '#d97757'
    },
    accessory: `
      <div class="claude-burst"></div>`
  },

  {
    id: 'neko',
    name: 'ネコ（けもの）',
    emoji: '🐱',
    klass: 'model-cat',
    vars: {
      '--s-head-w': '232px', '--s-head-h': '212px',
      '--s-head-round': '46% 46% 48% 48% / 48% 48% 52% 52%',
      '--s-skin': '#fff4ea', '--s-skin-sh': '#e9d3c0', '--s-skin-line': '#d8b69e',
      '--s-eye-w': '54px', '--s-eye-h': '64px', '--s-eye-gap': '36px', '--s-eye-y': '8px',
      '--s-iris': '#3fae7a', '--s-iris2': '#9be8c0',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#d98aa0', '--s-mouth-y': '74px', '--s-mouth-w': '24px',
      '--s-nose-op': '1',
      '--s-blush': '#ffb0b8', '--s-blush-op': '0.45',
      '--s-hair': '#f0e2d4', '--s-hair2': '#dcc6b3', '--s-hair-shine': '#fff7ee',
      '--s-acc': '#ffb0b8'
    },
    accessory: `
      <div class="cat-ear left"></div>
      <div class="cat-ear right"></div>
      <div class="cat-nose"></div>
      <div class="cat-whiskers left"><i></i><i></i><i></i></div>
      <div class="cat-whiskers right"><i></i><i></i><i></i></div>`
  },

  {
    id: 'robo',
    name: 'ロボット（メカ）',
    emoji: '🤖',
    klass: 'model-robot',
    vars: {
      '--s-head-w': '236px', '--s-head-h': '212px',
      '--s-head-round': '26% 26% 30% 30% / 26% 26% 34% 34%',
      '--s-skin': '#cfd8e6', '--s-skin-sh': '#9aa8bd', '--s-skin-line': '#7c8aa0',
      '--s-eye-w': '58px', '--s-eye-h': '40px', '--s-eye-gap': '30px', '--s-eye-y': '10px',
      '--s-eye-white': '#0d1726', '--s-iris': '#19e3ff', '--s-iris2': '#bafcff',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#19e3ff', '--s-mouth-y': '64px', '--s-mouth-w': '54px',
      '--s-nose-op': '0',
      '--s-blush': '#19e3ff', '--s-blush-op': '0.35',
      '--s-hair': '#aeb9c9', '--s-hair2': '#7c8aa0', '--s-hair-shine': '#e4ebf5',
      '--s-acc': '#19e3ff'
    },
    accessory: `
      <div class="robo-antenna"><i></i></div>
      <div class="robo-panel left"></div>
      <div class="robo-panel right"></div>
      <div class="robo-bolt tl"></div><div class="robo-bolt tr"></div>
      <div class="robo-bolt bl"></div><div class="robo-bolt br"></div>`
  },

  {
    id: 'kitsune',
    name: 'キツネ（けもの）',
    emoji: '🦊',
    klass: 'model-fox',
    vars: {
      '--s-head-w': '240px', '--s-head-h': '214px',
      '--s-head-round': '44% 44% 50% 50% / 46% 46% 54% 54%',
      '--s-skin': '#ef9a5c', '--s-skin-sh': '#d97a3c', '--s-skin-line': '#b85f28',
      '--s-eye-w': '50px', '--s-eye-h': '56px', '--s-eye-gap': '40px', '--s-eye-y': '4px',
      '--s-eye-tilt': '8deg',
      '--s-iris': '#5a3a1c', '--s-iris2': '#a87a40',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#7a3826', '--s-mouth-y': '80px', '--s-mouth-w': '22px',
      '--s-nose-op': '1',
      '--s-blush': '#ffae8a', '--s-blush-op': '0.4',
      '--s-hair': '#ef9a5c', '--s-hair2': '#d97a3c', '--s-hair-shine': '#ffc79a',
      '--s-acc': '#7a3826'
    },
    accessory: `
      <div class="fox-ear left"></div>
      <div class="fox-ear right"></div>
      <div class="fox-muzzle"><div class="fox-nose"></div></div>`
  },

  {
    id: 'panda',
    name: 'パンダ（けもの）',
    emoji: '🐼',
    klass: 'model-panda',
    vars: {
      '--s-head-w': '250px', '--s-head-h': '232px',
      '--s-head-round': '50% 50% 48% 48% / 50% 50% 50% 50%',
      '--s-skin': '#fbf7f2', '--s-skin-sh': '#e3dcd2', '--s-skin-line': '#cfc6ba',
      '--s-eye-w': '40px', '--s-eye-h': '46px', '--s-eye-gap': '42px', '--s-eye-y': '10px',
      '--s-iris': '#2b2420', '--s-iris2': '#5a4f47',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#5a3a30', '--s-mouth-y': '84px', '--s-mouth-w': '26px',
      '--s-nose-op': '1',
      '--s-blush': '#ffb3b0', '--s-blush-op': '0.35',
      '--s-hair': '#fbf7f2', '--s-hair2': '#e3dcd2', '--s-hair-shine': '#ffffff',
      '--s-acc': '#22201e'
    },
    accessory: `
      <div class="panda-ear left"></div>
      <div class="panda-ear right"></div>
      <div class="panda-patch left"></div>
      <div class="panda-patch right"></div>`
  },

  {
    id: 'slime',
    name: 'スライム',
    emoji: '🟢',
    klass: 'model-slime',
    vars: {
      '--s-head-w': '240px', '--s-head-h': '210px',
      '--s-head-round': '50% 50% 46% 46% / 64% 64% 40% 40%',
      '--s-skin': '#8fe9b0', '--s-skin-sh': '#46c483', '--s-skin-line': '#2ea869',
      '--s-eye-w': '40px', '--s-eye-h': '52px', '--s-eye-gap': '38px', '--s-eye-y': '6px',
      '--s-eye-white': '#13321f', '--s-iris': '#0e2a18', '--s-iris2': '#1f5a36',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#1e5638', '--s-mouth-y': '58px', '--s-mouth-w': '30px',
      '--s-nose-op': '0',
      '--s-blush': '#7fffc0', '--s-blush-op': '0.4',
      '--s-hair': '#8fe9b0', '--s-hair2': '#46c483', '--s-hair-shine': '#e6fff1',
      '--s-acc': '#46c483'
    },
    accessory: `<div class="slime-shine"></div>`
  },

  {
    id: 'ghost',
    name: 'おばけ',
    emoji: '👻',
    klass: 'model-ghost',
    vars: {
      '--s-head-w': '226px', '--s-head-h': '232px',
      '--s-head-round': '50% 50% 40% 40% / 60% 60% 30% 30%',
      '--s-skin': '#f3f1ff', '--s-skin-sh': '#d6d2f0', '--s-skin-line': '#b9b3e0',
      '--s-eye-w': '38px', '--s-eye-h': '50px', '--s-eye-gap': '36px', '--s-eye-y': '2px',
      '--s-eye-white': '#2a2350', '--s-iris': '#1d1840', '--s-iris2': '#4a3f7a',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#3a2f66', '--s-mouth-y': '62px', '--s-mouth-w': '30px',
      '--s-nose-op': '0',
      '--s-blush': '#c9b8ff', '--s-blush-op': '0.45',
      '--s-hair': '#f3f1ff', '--s-hair2': '#d6d2f0', '--s-hair-shine': '#ffffff',
      '--s-acc': '#a99cff'
    },
    accessory: `<div class="ghost-skirt"><i></i><i></i><i></i><i></i></div>`
  },

  {
    id: 'usagi',
    name: 'うさぎ（けもの）',
    emoji: '🐰',
    klass: 'model-rabbit',
    vars: {
      '--s-head-w': '224px', '--s-head-h': '216px',
      '--s-head-round': '48% 48% 50% 50% / 52% 52% 48% 48%',
      '--s-skin': '#fffafc', '--s-skin-sh': '#f0e2ea', '--s-skin-line': '#dcc6d2',
      '--s-eye-w': '46px', '--s-eye-h': '58px', '--s-eye-gap': '38px', '--s-eye-y': '8px',
      '--s-iris': '#b5538f', '--s-iris2': '#ffc2e6',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#d56a93', '--s-mouth-y': '70px', '--s-mouth-w': '22px',
      '--s-nose-op': '1',
      '--s-blush': '#ffb6cf', '--s-blush-op': '0.5',
      '--s-hair': '#fffafc', '--s-hair2': '#f0e2ea', '--s-hair-shine': '#ffffff',
      '--s-acc': '#ff9ec4'
    },
    accessory: `
      <div class="rabbit-ear left"><i></i></div>
      <div class="rabbit-ear right"><i></i></div>
      <div class="rabbit-nose"></div>`
  },

  {
    id: 'dragon',
    name: 'ドラゴン',
    emoji: '🐲',
    klass: 'model-dragon',
    vars: {
      '--s-head-w': '236px', '--s-head-h': '216px',
      '--s-head-round': '46% 46% 50% 50% / 50% 50% 50% 50%',
      '--s-skin': '#8fe6b6', '--s-skin-sh': '#3fb583', '--s-skin-line': '#2a9168',
      '--s-eye-w': '48px', '--s-eye-h': '58px', '--s-eye-gap': '40px', '--s-eye-y': '4px',
      '--s-eye-tilt': '6deg',
      '--s-iris': '#d4a020', '--s-iris2': '#ffe69a',
      '--s-brow-thick': '0px', '--s-brow-w': '0px',
      '--s-mouth-color': '#1f6b48', '--s-mouth-y': '78px', '--s-mouth-w': '26px',
      '--s-nose-op': '0',
      '--s-blush': '#7effc0', '--s-blush-op': '0.35',
      '--s-hair': '#8fe6b6', '--s-hair2': '#3fb583', '--s-hair-shine': '#d8fff0',
      '--s-acc': '#ffd86b'
    },
    accessory: `
      <div class="dragon-horn left"></div>
      <div class="dragon-horn right"></div>
      <div class="dragon-fin left"></div>
      <div class="dragon-fin right"></div>
      <div class="dragon-snout"><i></i><i></i></div>`
  }
];

window.VT_MODEL_BY_ID = Object.fromEntries(window.VT_MODELS.map(m => [m.id, m]));
