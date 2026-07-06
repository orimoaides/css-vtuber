/* ============================================================
   Face tracking. Lazy-loads MediaPipe FaceMesh from CDN, reads
   landmarks from the webcam, and emits normalized pose values
   (-1..1, or 0..1) that map directly onto the avatar --p-* vars.
   ============================================================ */
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe';
  const SCRIPTS = [
    `${CDN}/camera_utils/camera_utils.js`,
    `${CDN}/face_mesh/face_mesh.js`,
  ];

  function loadScript(src) {
    return new Promise((res, rej) => {
      if ([...document.scripts].some(s => s.src === src)) return res();
      const s = document.createElement('script');
      s.src = src; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = () => rej(new Error('load fail ' + src));
      document.head.appendChild(s);
    });
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function Tracker() {
    this.running = false;
    this.camera = null;
    this.mesh = null;
    this.smooth = {};
    this.base = null;     // neutral baseline, captured on first stable frames
    this.baseFrames = 0;
  }

  Tracker.prototype.start = async function (video, onPose, onStatus) {
    onStatus && onStatus('カメラ初期化中…');
    await loadScript(SCRIPTS[0]);
    await loadScript(SCRIPTS[1]);

    const mesh = new window.FaceMesh({
      locateFile: f => `${CDN}/face_mesh/${f}`,
    });
    mesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    mesh.onResults(r => this._onResults(r, onPose, onStatus));
    this.mesh = mesh;

    const camera = new window.Camera(video, {
      onFrame: async () => { if (this.running) await mesh.send({ image: video }); },
      width: 640, height: 480,
    });
    this.camera = camera;
    this.running = true;
    await camera.start();
    onStatus && onStatus('トラッキング中 ● 顔を正面に向けてください');
  };

  Tracker.prototype.recalibrate = function () {
    this.base = null; this.baseFrames = 0; this._acc = null;
  };

  Tracker.prototype.stop = function () {
    this.running = false;
    if (this.camera) { try { this.camera.stop(); } catch (e) {} }
    if (this.mesh) { try { this.mesh.close(); } catch (e) {} }
    this.base = null; this.baseFrames = 0;
  };

  Tracker.prototype._sm = function (key, val, t) {
    if (this.smooth[key] == null) this.smooth[key] = val;
    this.smooth[key] = lerp(this.smooth[key], val, t);
    return this.smooth[key];
  };

  Tracker.prototype._onResults = function (r, onPose, onStatus) {
    const lms = r.multiFaceLandmarks && r.multiFaceLandmarks[0];
    if (!lms) { onStatus && onStatus('顔を検出できません…'); return; }

    const L = i => lms[i];
    const eyeOuterL = L(33), eyeInnerL = L(133);
    const eyeOuterR = L(263), eyeInnerR = L(362);
    const noseTip = L(1), chin = L(152), brow = L(10);
    const faceL = L(234), faceR = L(454);

    const faceW = dist(faceL, faceR) || 1e-4;
    const faceH = dist(brow, chin) || 1e-4;
    const eyeMid = { x: (eyeOuterL.x + eyeOuterR.x) / 2, y: (eyeOuterL.y + eyeOuterR.y) / 2 };

    // head pose
    const yawRaw = (noseTip.x - eyeMid.x) / faceW;            // ~ -0.2..0.2
    const pitchRaw = (noseTip.y - eyeMid.y) / faceH;          // baseline ~0.35
    const rollRaw = Math.atan2(eyeOuterR.y - eyeOuterL.y, eyeOuterR.x - eyeOuterL.x);

    // eye openness (EAR-like)
    const openL = dist(L(159), L(145)) / (dist(eyeOuterL, eyeInnerL) || 1e-4);
    const openR = dist(L(386), L(374)) / (dist(eyeOuterR, eyeInnerR) || 1e-4);

    // mouth
    const mOpen = dist(L(13), L(14)) / (dist(L(78), L(308)) || 1e-4);
    const mWide = dist(L(78), L(308)) / faceW;

    // brow raise (brow-to-eye gap)
    const browGap = (dist(L(105), L(159)) + dist(L(334), L(386))) / 2 / faceH;

    // gaze from iris centers (refineLandmarks)
    let gazeX = 0, gazeY = 0;
    if (lms.length >= 478) {
      const irisL = L(468), irisR = L(473);
      const gxL = (irisL.x - (eyeOuterL.x + eyeInnerL.x) / 2) / (dist(eyeOuterL, eyeInnerL) || 1e-4);
      const gxR = (irisR.x - (eyeOuterR.x + eyeInnerR.x) / 2) / (dist(eyeOuterR, eyeInnerR) || 1e-4);
      gazeX = (gxL + gxR);
      const gyL = (irisL.y - (L(159).y + L(145).y) / 2) / (dist(L(159), L(145)) || 1e-4);
      gazeY = gyL;
    }

    // capture neutral baseline over first ~15 stable frames
    if (!this.base && this.baseFrames < 15) {
      this.baseFrames++;
      this._acc = this._acc || { pitch: 0, browGap: 0, mWide: 0, openL: 0, openR: 0 };
      this._acc.pitch += pitchRaw; this._acc.browGap += browGap;
      this._acc.mWide += mWide; this._acc.openL += openL; this._acc.openR += openR;
      if (this.baseFrames === 15) {
        const n = 15;
        this.base = {
          pitch: this._acc.pitch / n, browGap: this._acc.browGap / n,
          mWide: this._acc.mWide / n, openL: this._acc.openL / n, openR: this._acc.openR / n,
        };
        onStatus && onStatus('トラッキング中 ●');
      }
    }
    const base = this.base || { pitch: 0.34, browGap: 0.12, mWide: 0.42, openL: 0.32, openR: 0.32 };

    // map → pose vars
    const yaw = clamp(yawRaw * 5, -1, 1);
    const pitch = clamp((pitchRaw - base.pitch) * 6, -1, 1);
    const roll = clamp(rollRaw / 0.6, -1, 1);
    const blinkL = clamp(1 - (openL / base.openL), 0, 1);
    const blinkR = clamp(1 - (openR / base.openR), 0, 1);
    const mouth = clamp((mOpen - 0.05) * 2.2, 0, 1);
    const wide = clamp((mWide - base.mWide) * 6, -0.4, 1);
    const browUp = clamp((browGap - base.browGap) * 8, -1, 1);

    const t = 0.45;
    onPose({
      '--p-yaw': this._sm('yaw', yaw, t).toFixed(3),
      '--p-pitch': this._sm('pitch', pitch, t).toFixed(3),
      '--p-roll': this._sm('roll', roll, t).toFixed(3),
      '--p-blink-l': this._sm('bl', blinkL, 0.6).toFixed(3),
      '--p-blink-r': this._sm('br', blinkR, 0.6).toFixed(3),
      '--p-mouth': this._sm('m', mouth, 0.5).toFixed(3),
      '--p-mouth-wide': this._sm('mw', wide, t).toFixed(3),
      '--p-brow': this._sm('bw', browUp, t).toFixed(3),
      '--p-eye-x': this._sm('gx', clamp(gazeX * 3, -1, 1), 0.4).toFixed(3),
      '--p-eye-y': this._sm('gy', clamp((gazeY - 0) * 2, -1, 1), 0.4).toFixed(3),
    });
  };

  window.VTTracker = new Tracker();
})();
