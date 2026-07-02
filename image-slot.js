class ImageSlot extends HTMLElement {
  static get observedAttributes() { return ['src', 'fit', 'radius', 'placeholder']; }
  connectedCallback() { this._render(); }
  attributeChangedCallback() { if (this.isConnected) this._render(); }
  _render() {
    const src = this.getAttribute('src');
    const fit = this.getAttribute('fit') || 'cover';
    const radius = this.getAttribute('radius');
    const placeholder = this.getAttribute('placeholder') || '';
    const radCSS = radius ? `border-radius:${radius}px;` : '';
    if (src) {
      this.innerHTML = '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = placeholder;
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};display:block;${radCSS}`;
      this.appendChild(img);
    } else {
      this.style.cssText = 'display:grid;place-items:center;opacity:0.28;font-family:monospace;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;';
      this.innerHTML = placeholder ? `<span>${placeholder}</span>` : '';
    }
  }
}
customElements.define('image-slot', ImageSlot);
