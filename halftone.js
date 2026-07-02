/* halftone.js — dot-matrix reveal engine
 * Mirrors the image-slot.js custom-element pattern. Renders a source image as a
 * grid of luminous dots on a <canvas>, then assembles the dots from the centre
 * outward when the element scrolls into view (the "Digital Sublime" signature).
 *
 * Usage:
 *   <halftone-img src="path.jpg" gap="7" tint="gold" placeholder="Base 44"></halftone-img>
 *
 * Attributes:
 *   src        image url
 *   gap        dot grid spacing in px (default 7)
 *   tint       gold | blue | prism | source  (default source — uses the pixel's own colour)
 *   radius     border-radius in px
 *   placeholder text shown before the image loads / if no src
 *
 * Honours prefers-reduced-motion: paints the final frame immediately, no assembly.
 */
(function () {
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TINTS = {
    gold: [255, 196, 84],
    blue: [120, 180, 255],
    prism: null, // handled per-dot by hue across x
  };

  class HalftoneImg extends HTMLElement {
    static get observedAttributes() { return ['src', 'gap', 'tint', 'radius', 'placeholder']; }

    connectedCallback() {
      if (this._wired) return;
      this._wired = true;
      this.style.display = 'block';
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      const radius = this.getAttribute('radius');
      if (radius) this.style.borderRadius = radius + 'px';

      this._canvas = document.createElement('canvas');
      this._canvas.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(this._canvas);
      this._ctx = this._canvas.getContext('2d');
      this._progress = 0;
      this._dots = null;

      this._renderPlaceholder();
      this._load();

      // Reveal when in view (own observer so it works independent of the page's reveal system)
      if ('IntersectionObserver' in window && !REDUCED) {
        this._io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { this.reveal(); this._io.disconnect(); }
          }
        }, { threshold: 0.18 });
        this._io.observe(this);
      } else {
        this._revealNow = true; // paint full once dots are ready
      }

      // Re-grid on resize (debounced)
      if ('ResizeObserver' in window) {
        let t;
        this._ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => this._build(), 120); });
        this._ro.observe(this);
      }
    }

    attributeChangedCallback() { if (this._wired) this._load(); }

    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      if (this._ro) this._ro.disconnect();
      cancelAnimationFrame(this._raf);
    }

    _renderPlaceholder() {
      const ph = this.getAttribute('placeholder') || '';
      if (ph && !this._img) {
        this.setAttribute('data-ph', ph);
        this.style.setProperty('--ph', `"${ph}"`);
      }
    }

    _load() {
      const src = this.getAttribute('src');
      if (!src) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { this._img = img; this._build(); };
      img.onerror = () => { /* leave placeholder */ };
      img.src = src;
    }

    _build() {
      if (!this._img) return;
      const rect = this.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height || (w * (this._img.height / this._img.width))));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._canvas.width = w * dpr;
      this._canvas.height = h * dpr;
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._w = w; this._h = h;

      // Draw source into an offscreen buffer at display size (object-fit: cover)
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const octx = off.getContext('2d');
      const ir = this._img.width / this._img.height, cr = w / h;
      let dw, dh, dx, dy;
      if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
      else { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
      octx.drawImage(this._img, dx, dy, dw, dh);
      const data = octx.getImageData(0, 0, w, h).data;

      const gap = Math.max(3, parseInt(this.getAttribute('gap'), 10) || 7);
      const tintName = this.getAttribute('tint') || 'source';
      const tint = TINTS[tintName] || null;
      const cx = w / 2, cy = h / 2;
      const maxDist = Math.hypot(cx, cy) || 1;

      const dots = [];
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const i = ((y | 0) * w + (x | 0)) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 8) continue;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (lum < 0.06) continue; // skip near-black: dots emerge from the void
          let col;
          if (tintName === 'prism') {
            col = `hsl(${Math.round((x / w) * 320)}, 90%, ${40 + lum * 35}%)`;
          } else if (tint) {
            const k = 0.45 + lum * 0.55;
            col = `rgb(${Math.round(tint[0] * k)},${Math.round(tint[1] * k)},${Math.round(tint[2] * k)})`;
          } else {
            col = `rgb(${r},${g},${b})`;
          }
          dots.push({
            x, y, col,
            rad: (gap / 2) * (0.35 + lum * 0.78),
            delay: (Math.hypot(x - cx, y - cy) / maxDist), // 0 centre → 1 edge
          });
        }
      }
      this._dots = dots;

      if (REDUCED || this._revealNow || this._progress >= 1) { this._progress = 1; this._paint(); }
      else this._paint(); // paint at current progress (0 = nothing yet)
    }

    _paint() {
      const ctx = this._ctx, dots = this._dots;
      if (!ctx) return;
      ctx.clearRect(0, 0, this._w, this._h);
      if (!dots) return;
      const p = this._progress;
      ctx.save();
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // Each dot has a 0.45-wide window within the global progress, ordered centre-out
        const local = Math.max(0, Math.min(1, (p - d.delay * 0.55) / 0.45));
        if (local <= 0) continue;
        const e = local < 1 ? 1 - Math.pow(1 - local, 3) : 1; // easeOutCubic
        ctx.globalAlpha = e;
        ctx.fillStyle = d.col;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rad * e, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    reveal() {
      if (this._progress >= 1) return;
      if (REDUCED) { this._progress = 1; this._paint(); return; }
      const dur = 1100;
      const t0 = performance.now();
      const tick = (now) => {
        this._progress = Math.min(1, (now - t0) / dur);
        this._paint();
        if (this._progress < 1) this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('halftone-img', HalftoneImg);
})();
