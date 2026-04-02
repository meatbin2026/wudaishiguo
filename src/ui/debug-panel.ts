export class DebugPanel {
  private element: HTMLDivElement;
  private visible = false;

  constructor(
    private root: HTMLDivElement,
    actions: Array<{ id: string; label: string; onClick: () => void }>
  ) {
    this.element = document.createElement("div");
    this.element.className = "debug-panel hidden";
    this.element.innerHTML = `
      <strong>调试面板</strong>
      <span>快速调刷怪、Boss 和升级节奏。</span>
    `;
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.dataset.action = action.id;
      button.addEventListener("click", action.onClick);
      this.element.appendChild(button);
    });
    this.root.appendChild(this.element);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.classList.toggle("hidden", !this.visible);
  }

  hide(): void {
    this.visible = false;
    this.element.classList.add("hidden");
  }

  getRect(): DOMRect | null {
    if (!this.visible) {
      return null;
    }
    return this.element.getBoundingClientRect();
  }

  destroy(): void {
    this.element.remove();
  }
}
