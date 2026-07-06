/* ============================================================
   Curated preset looks for the gallery. Each is a full state:
     m = model id, s = style var overrides, c = classes, bg = scene
   Applied via the same applyState() path as share links.
   ============================================================ */
window.VT_PRESETS = [
  {
    name: 'ミラ / 標準',
    m: 'mira', s: {}, c: [], bg: 'studio',
  },
  {
    name: 'ピンクツインテ',
    m: 'mira',
    s: { '--s-hair': '#ff9ec4', '--s-hair2': '#e96fb0',
         '--s-hair-shine': '#ffd0e6', '--s-iris': '#ff5fa2', '--s-iris2': '#ffd0e6',
         '--s-acc': '#ff5fa2', '--s-blush-op': '0.7' },
    c: ['hair-twintails', 'acc-ribbon'], bg: 'sunset',
  },
  {
    name: 'クール / メガネ',
    m: 'mira',
    s: { '--s-hair': '#3b4a63', '--s-hair2': '#26334a', '--s-hair-shine': '#566a8c',
         '--s-iris': '#36b9c9', '--s-iris2': '#bff0f6', '--s-eye-tilt': '6deg',
         '--s-acc': '#36b9c9' },
    c: ['acc-glasses', 'acc-headphones', 'hair-short'], bg: 'night',
  },
  {
    name: '金髪ロング',
    m: 'mira',
    s: { '--s-hair': '#ffd86b', '--s-hair2': '#e6a93f', '--s-hair-shine': '#fff0bf',
         '--s-iris': '#5aa9ff', '--s-iris2': '#cfe7ff', '--s-eye-tilt': '-4deg',
         '--s-acc': '#ff7aa8' },
    c: ['hair-long', 'acc-ahoge'], bg: 'studio',
  },
  {
    name: 'クマさん',
    m: 'kuma', s: {}, c: [], bg: 'studio',
  },
  {
    name: 'ネコ耳 / 夜',
    m: 'neko',
    s: { '--s-iris': '#9b6cff', '--s-iris2': '#dccbff', '--s-acc': '#9b6cff' },
    c: ['acc-ribbon'], bg: 'stars',
  },
  {
    name: 'クロード',
    m: 'claude', s: {}, c: [], bg: 'sunset',
  },
  {
    name: 'サイバーロボ',
    m: 'robo',
    s: { '--s-iris': '#ff4d6d', '--s-iris2': '#ffd0d8', '--s-mouth-color': '#ff4d6d',
         '--s-acc': '#ff4d6d' },
    c: [], bg: 'chroma',
  },
  {
    name: 'キツネ / 夕焼け',
    m: 'kitsune', s: {}, c: ['acc-ribbon'], bg: 'sunset',
  },
  {
    name: 'パンダ',
    m: 'panda', s: {}, c: [], bg: 'studio',
  },
  {
    name: 'スライム / 星空',
    m: 'slime', s: {}, c: [], bg: 'stars',
  },
  {
    name: 'おばけ / 夜',
    m: 'ghost', s: {}, c: [], bg: 'night',
  },
  {
    name: '天使ミラ',
    m: 'mira',
    s: { '--s-hair': '#fff3d6', '--s-hair2': '#ecd9a8', '--s-hair-shine': '#fffaf0',
         '--s-iris': '#7fd0ff', '--s-iris2': '#e0f5ff', '--s-acc': '#ffe39a' },
    c: ['hair-long', 'acc-ahoge'], bg: 'studio',
  },
  {
    name: 'ネオン青ロボ',
    m: 'robo',
    s: { '--s-iris': '#7cffd6', '--s-iris2': '#e6fff7', '--s-mouth-color': '#7cffd6',
         '--s-acc': '#7cffd6' },
    c: [], bg: 'night',
  },
  {
    name: 'うさぎ / リボン',
    m: 'usagi', s: {}, c: ['acc-ribbon'], bg: 'studio',
  },
  {
    name: 'ドラゴン / 夜',
    m: 'dragon', s: {}, c: [], bg: 'night',
  },
  {
    name: '魔法少女 ✨',
    m: 'mira',
    s: { '--s-hair': '#ffb3d1', '--s-hair2': '#e98bb4', '--s-hair-shine': '#ffe0ee',
         '--s-iris': '#e85a90', '--s-iris2': '#ffd0e6', '--s-acc': '#ff7ab0' },
    c: ['hair-twintails', 'acc-ribbon', 'fx-sparkle'], bg: 'sunset',
  },
  {
    name: '森の妖精 ✨',
    m: 'mira',
    s: { '--s-hair': '#86c98a', '--s-hair2': '#4f9b5c', '--s-hair-shine': '#d6f0d0',
         '--s-iris': '#3a8f56', '--s-iris2': '#cdeec0', '--s-acc': '#5bbf6e' },
    c: ['hair-long', 'acc-ahoge', 'fx-sparkle'], bg: 'studio',
  },
  {
    name: '執事ロボ',
    m: 'robo',
    s: { '--s-iris': '#ffd86b', '--s-iris2': '#fff3cf', '--s-mouth-color': '#ffd86b',
         '--s-acc': '#3a4a7a' },
    c: ['acc-collar'], bg: 'night',
  },
];
