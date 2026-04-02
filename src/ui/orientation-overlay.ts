export class OrientationOverlay {
  private element: HTMLDivElement;

  constructor(private root: HTMLDivElement) {
    this.element = document.createElement("div");
    this.element.className = "orientation";
    this.element.innerHTML = `
      <strong>建议横屏游玩</strong>
      <span>横屏时视野更开阔，移动和升级选择都会更舒服。</span>
    `;
    this.root.appendChild(this.element);
  }

  update(): void {
    const portrait = window.innerHeight > window.innerWidth;
    this.element.classList.toggle("orientation--visible", portrait);
  }

  destroy(): void {
    this.element.remove();
  }
}
