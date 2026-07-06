/* ============================================================
   Avatar builder. Renders the model-agnostic slot DOM into a
   mount, applies a model's style vars + accessory, and exposes
   helpers to set pose (--p-*) and style (--s-*) vars.
   ============================================================ */
(function () {
  const SLOT_HTML = `
    <div class="av-sparkles">
      <i style="--sx:6%;--sy:18%;--sd:0s;--ss:1"></i>
      <i style="--sx:90%;--sy:26%;--sd:.6s;--ss:.7"></i>
      <i style="--sx:16%;--sy:64%;--sd:1.1s;--ss:.85"></i>
      <i style="--sx:84%;--sy:70%;--sd:1.7s;--ss:1.1"></i>
      <i style="--sx:50%;--sy:6%;--sd:.9s;--ss:.6"></i>
      <i style="--sx:30%;--sy:90%;--sd:1.4s;--ss:.75"></i>
    </div>
    <div class="av-body">
      <div class="av-head">
        <div class="av-hair-back"></div>
        <div class="av-hair-tails">
          <div class="tail l"></div>
          <div class="tail r"></div>
          <div class="tail pony"></div>
        </div>
        <div class="av-face-base"></div>
        <div class="av-ear left"></div>
        <div class="av-ear right"></div>
        <div class="av-acc"></div>
        <div class="av-face">
          <div class="av-brow left"></div>
          <div class="av-brow right"></div>

          <div class="av-eye left">
            <div class="av-eye-white">
              <div class="av-iris">
                <div class="av-pupil"></div>
                <div class="av-hl"></div>
                <div class="av-hl small"></div>
              </div>
            </div>
            <div class="av-lid"></div>
            <div class="av-lash"></div>
          </div>

          <div class="av-eye right">
            <div class="av-eye-white">
              <div class="av-iris">
                <div class="av-pupil"></div>
                <div class="av-hl"></div>
                <div class="av-hl small"></div>
              </div>
            </div>
            <div class="av-lid"></div>
            <div class="av-lash"></div>
          </div>

          <div class="av-nose"></div>
          <div class="av-blush left"></div>
          <div class="av-blush right"></div>
          <div class="av-mouth"><div class="av-mouth-inner"></div></div>
        </div>
        <div class="av-hair-front"></div>

        <div class="av-extras">
          <div class="acc acc-ahoge"></div>
          <div class="acc acc-glasses"><i class="lens l"></i><i class="bridge"></i><i class="lens r"></i></div>
          <div class="acc acc-headphones"><i class="band"></i><i class="cup l"></i><i class="cup r"></i></div>
          <div class="acc acc-ribbon"><i class="loop l"></i><i class="loop r"></i><i class="knot"></i></div>
          <div class="acc acc-hat"><i class="brim"></i><i class="top"></i><i class="pom"></i></div>
          <div class="acc acc-collar"><i class="neck"></i><i class="wear"></i></div>
        </div>
      </div>
    </div>`;

  function Avatar(mount) {
    this.mount = mount;
    this.el = document.createElement('div');
    this.el.className = 'avatar';
    this.el.innerHTML = SLOT_HTML;
    mount.innerHTML = '';
    mount.appendChild(this.el);
    this.model = null;
  }

  Avatar.prototype.applyModel = function (model) {
    this.model = model;
    // reset model classes
    this.el.className = 'avatar';
    if (model.klass) this.el.classList.add(model.klass);
    // accessory layer
    this.el.querySelector('.av-acc').innerHTML = model.accessory || '';
    // style vars
    this.setStyles(model.vars || {});
    return this;
  };

  Avatar.prototype.setStyle = function (name, value) {
    this.el.style.setProperty(name, value);
  };
  Avatar.prototype.setStyles = function (obj) {
    for (const k in obj) this.el.style.setProperty(k, obj[k]);
  };
  Avatar.prototype.getStyle = function (name) {
    return this.el.style.getPropertyValue(name) ||
      getComputedStyle(this.el).getPropertyValue(name);
  };

  Avatar.prototype.setPose = function (obj) {
    for (const k in obj) this.el.style.setProperty(k, obj[k]);
  };
  Avatar.prototype.idle = function (on) {
    this.el.classList.toggle('idle', !!on);
  };

  window.Avatar = Avatar;
})();
