# CSS VTuber Studio — Roadmap (self-paced /loop)

Goal: An app that produces high-quality VTuber avatars built **entirely in CSS**
(no images), with a control panel to tune every part, multiple model types
(human / bear / Claude mascot / more), webcam face tracking, and **single-file
HTML export** that anyone can open and use.

## Architecture
- `--s-*` = style vars (control panel)   ·   `--p-*` = pose vars (tracking + idle)
- Same DOM "slots" across every model → one panel + one tracker drive all models.
- Files: index.html · css/{app,avatar}.css · js/{models,avatar,panel,tracking,export,app}.js

## Status
- [x] Iter 1 — Foundation: slot system, human/bear/Claude models, control panel,
      idle motion, MediaPipe face tracking, standalone HTML export. VERIFIED in preview.
- [x] Iter 1.1 — Fixed 3D head-turn z-fighting (hair-back now child of head, parallel
      plane). Redesigned fringe. All 3 models verified rendering + turning cleanly.
- [x] Iter 2 — Expression presets (7), puppet/mouse mode, URL save+share (#a=base64).
      VERIFIED: smile preset + expression bar render, no console errors.
- [x] Iter 3 — Fixed unitless-slider bug (unit '' was coerced to 'px'). Added 2 models:
      🐱 ネコ (slit pupils, triangular ears, whiskers, nose) and 🤖 ロボット (LED eyes,
      antenna w/ blink, side panels, bolts, grille mouth). Both VERIFIED, no errors.
      Now 5 models total.

- [x] Iter 4 — Accessory layer: 5 toggleable CSS accessories (メガネ/ヘッドホン/リボン/
      アホ毛/ニット帽) as a panel group. DOM is always present in slots (rotates w/ head),
      shown via .acc-* class. Share/export preserve accessories. ALL VERIFIED, no errors.

- [x] Iter 5 — Background scenes (単色/スタジオ/夜空/星空/夕焼け/クロマキー緑/透明),
      checkerboard preview for transparent, export bakes chosen bg (transparent → OBS
      browser-source hint). Tracking recalibrate() + 🎯 calibration button (shows while
      tracking). VERIFIED stars + transparent scenes, no errors.

- [x] Iter 6 — Hair styles (ボブ/ツインテール/ポニテ/ロング/ショート) via panel <select>
      (new 'select' control type toggling mutually-exclusive hair-* classes). serialize
      now captures ALL non-model classes (hair + acc persist in share/export). Wrote
      README.md (JP, full usage + OBS guide). VERIFIED twintails + select, no errors.

- [x] Iter 7 — Preset gallery: modal with 8 curated looks, each a LIVE mini avatar
      preview (bottom-anchored scaled). Click applies model+style+classes+bg via
      applyState. Fixed a real bug: `.acc-ribbon{top/left}` also matched the avatar root
      (carries the toggle class) and broke gallery positioning — scoped/removed it.
      ALL 8 previews + apply VERIFIED, no errors.

- [x] Iter 8 — Audit fix: `.acc-ahoge::before` was another bare rule leaking onto the
      avatar root → scoped to `.av-extras .acc-ahoge::before`. Removed unused `--c`.
      Mobile polish: @640px breakpoint — wraps topbar, hides tagline, full-width picker,
      2x2 button grid, wraps stage/expr controls. VERIFIED mobile 375px + desktop, no errors.

- [x] Iter 9 — Added 2 models: 🦊 キツネ (pointed ears, white muzzle) and 🐼 パンダ
      (black ears, iconic eye patches, nose). Now 7 models. Added 2 gallery presets
      (キツネ/夕焼け, パンダ → 10 total). VERIFIED both render, no errors.

- [x] Iter 10 — Split export into buildHTML()+exportHTML(). END-TO-END VERIFIED the
      standalone export: rendered the neko export via document.write (no studio files
      available) — avatar + toolbar + LIVE idle blink all worked. The headline
      "single HTML file" deliverable is confirmed self-contained & functional.

- [x] Iter 11 — Upgraded 🎲 randomize into a "gacha": coherent hair palette from one hue,
      random eyes/mouth/blush, random hair style + random accessories (30% each). Panel
      widgets (select + checkboxes) sync to the result. VERIFIED, no errors.

- [x] Iter 12 — Keyboard shortcuts (1-7 models, R random, G gallery, E export, Space
      blink; disabled while typing in inputs). Documented in README. VERIFIED 5/g/1/r, no errors.

- [x] Iter 13 — Eye quality pass: added a dark limbal ring (via color-mix) + faint inner
      glow ring (.av-iris::after) for anime-style depth. Looks better on human AND
      enhances the robot LED glow (no regression). VERIFIED human + robot, no errors.

- [x] Iter 14 — Save slots (localStorage): 💾保存 button stores current state (model+
      style+classes+bg). Gallery rebuilds each open with a "保存したアバター" section
      (live previews + hover ✕ delete) above presets. VERIFIED save/load/delete, no errors.

- [x] Iter 15 — Added 2 models: 🟢 スライム (translucent jelly, big shine, CSS jiggle)
      and 👻 おばけ (floaty body, wavy skirt, float anim). Now 9 models. Both animations
      are pure CSS so they carry into standalone exports. VERIFIED both, no errors.

- [x] Iter 16 — Enriched gallery to 14 presets (added スライム/星空, おばけ/夜, 天使ミラ,
      ネオン青ロボ) covering all 9 models. VERIFIED all render, no errors.

- [x] Iter 17 — Smooth expression glide: `.expr-anim` class adds .28s transitions to
      head/mouth/brow/lid/iris, added on expr-button click and auto-removed after 420ms
      so live tracking/idle stay snappy. VERIFIED (anim on→off, 0.28s, surprised face), no errors.

- [x] Iter 18 — Onboarding help overlay: auto-shows on first visit (localStorage flag),
      reopenable via "?" button. Explains models, panel, tracking, OBS export, shortcuts.
      VERIFIED auto-show/close/reopen/flag, no errors.

- [x] Iter 19 — Added 🐰 うさぎ model (tall pink-lined ears, pink nose). Now 10 models.
      Esc now closes the help modal too. VERIFIED rabbit render + Esc, no errors.

- [x] Iter 20 — Added うさぎ/リボン gallery preset (15 presets). Regression QA: rendered
      all 10 models in a montage — every one builds the full 9-child head, all distinct,
      no console errors. App healthy after 20 iterations.

- [x] Iter 21 — Idle ear twitches for bear/panda/cat/fox/rabbit (subtle periodic perk,
      base angle baked into keyframes, staggered durations). Pure CSS → plays in exports.
      VERIFIED ears rest correctly + anim applied, no errors.

- [x] Iter 22 — Accessibility: prefers-reduced-motion support. CSS @media disables looping
      idle anims (slime/ghost/antenna/ears); JS idle loop multiplies sway by amp=0; export
      runtime mirrors it. VERIFIED default (motion on) intact, no errors. (Can't toggle OS
      media feature in preview, but logic is a simple guard.)

- [x] Iter 23 — JSON export/import: gallery header buttons (⬇書出/⬆読込) download current
      config as .json and import+apply a .json (validated). VERIFIED round-trip via
      synthetic File (fox+glasses+night applied correctly), no errors. README updated.

- [x] Iter 24 — テーマ配色: 6 one-click coherent palettes (桜/海/森/夜/炎/宝石) recoloring
      hair+iris+acc, with swatch UI + panel picker sync. New 'themes' panel control type.
      VERIFIED 海 applied + synced, no errors.

- [x] Iter 25 — Share-link round-trip QA: encoded panda+ribbon+炎theme+stars to URL hash,
      full reload, verified model+classes+colors+bg all restored (visually + data). Core
      portability feature confirmed robust after 24 iterations. No errors.

- [x] Iter 26 — Added 🐲 ドラゴン model (cream horns, cheek fins, nostriled snout, golden
      slit pupils). Now 11 models + ドラゴン/夜 gallery preset (16 presets). VERIFIED, no errors.

- [x] Iter 27 — 🗣 喋るテスト (lip-sync preview): button runs a 3.5s rAF mouth-flap
      (syllable-like bursts) so users preview talking without a mic. Suspends idle via
      holdUntil. VERIFIED via screenshot (mouth mid-flap); rAF throttles under headless
      JS-only sampling but renders fine for real users. No errors.

- [x] Iter 28 — Added 襟・服 (collar/clothing) accessory toggle — accent-coloured collar
      at head base for a bust/streaming look (rotates with head). 6 accessories now.
      VERIFIED render + panel toggle, no errors.

- [x] Iter 29 — Export regression QA: built+rendered a standalone export of dragon +
      glasses + collar via document.write (no studio files). All new models/accessories/
      CSS (incl. reduced-motion) present and rendering, idle blink live. Headline single-
      file export STILL fully self-contained after 28 iters. No errors.

- [x] Iter 30 — 2 more expression presets: 😄 にっこり (squinty happy + grin) and 😏 じと目
      (half-lidded smug). 9 expressions now. VERIFIED happy render, no errors.

- [x] Iter 31 — Quality: added 涙袋 (aegyo-sal) soft under-eye highlight via .av-eye::after
      for cuteness; scoped out of robot/claude/slime (dot/LED eyes). VERIFIED human, no errors.

- [x] Iter 32 — ✨ キラキラ sparkle FX toggle: 6 twinkling CSS star particles around the
      avatar (accent-coloured, staggered, reduced-motion aware). Part of avatar → carries
      into export; persists via class serialize. VERIFIED render, no errors. 7 toggles now.

- [x] Iter 33 — Docs refresh: README + help overlay updated to current state (11 models,
      9 expressions, themes, sparkles/collar accessories, talk test, reduced-motion, 16
      gallery presets). VERIFIED help shows dragon + 11 models, no errors.

- [x] Iter 34 — 3 showcase gallery presets combining new FX (魔法少女 ✨ twintails+ribbon+
      sparkle, 森の妖精 ✨ long+ahoge+sparkle, 執事ロボ collar). 19 presets now. VERIFIED
      gallery renders all, no errors.

- [x] Iter 35 — Added モノクロ + オーロラ themes (8 total). Preview server had dropped
      (workspace restart) — restarted it. VERIFIED オーロラ applies + 8 swatches, no errors.

## Backlog (next iterations — quality first)
- [ ] More models: chibi, angel.
- [ ] Per-part visibility toggles (hide blush, etc.).
- [ ] Per-model expression tuning.
- [ ] Animated extras: hair physics on head turn, idle ear/tail wiggle.
- [ ] Background scenes (gradient/room/stars) + chroma-key green for OBS.
- [ ] Tracking polish: calibration button, gaze accuracy, smile/blink tuning,
      "puppet" mode (mouse-drive when no camera).
- [ ] Export options: transparent bg, OBS browser-source preset, size presets.
- [ ] Mobile/responsive panel; keyboard shortcuts.
- [ ] Gallery of presets; one-click randomize within a model.

## Notes / decisions
- Plain global scripts (no ES modules) so file:// export and preview both work.
- Tracking auto-captures a neutral baseline over first ~15 frames.
