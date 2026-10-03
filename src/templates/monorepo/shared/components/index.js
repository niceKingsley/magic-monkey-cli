class MagicButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        button {
          width: 100%;
          padding: 6px 12px;
          background: #10b981;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition:
            background-color 0.2s ease,
            transform 0.1s ease;
          box-sizing: border-box;
        }
        button:hover {
          background: #059669;
        }
        button:active {
          transform: scale(0.98);
        }
      </style>
      <button><slot>点击测试</slot></button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('magic-button')) {
  customElements.define('magic-button', MagicButton);
}

export { MagicButton };
