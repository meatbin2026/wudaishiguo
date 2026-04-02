import type { UpgradeOption } from "../core/types";

export class UpgradeModal {
  private element: HTMLDivElement;
  private onPick: ((option: UpgradeOption) => void) | null = null;

  constructor(private root: HTMLDivElement) {
    this.element = document.createElement("div");
    this.element.className = "modal hidden";
    this.root.appendChild(this.element);
  }

  open(options: UpgradeOption[], onPick: (option: UpgradeOption) => void): void {
    this.onPick = onPick;
    this.element.innerHTML = `
      <h2 class="modal__title">升级三选一</h2>
      <div class="modal__grid">
        ${options
          .map(
            (option) => `
              <button class="modal__card" data-id="${option.id}">
                <span class="modal__tag">${option.kind === "weapon" ? "武器" : "被动"}</span>
                <h3>${option.label}</h3>
                <p>${option.description}</p>
              </button>
            `
          )
          .join("")}
      </div>
    `;
    this.element.querySelectorAll<HTMLButtonElement>(".modal__card").forEach((button) => {
      button.addEventListener("click", () => {
        const option = options.find((item) => item.id === button.dataset.id);
        if (option && this.onPick) {
          this.onPick(option);
          this.close();
        }
      });
    });
    this.element.classList.remove("hidden");
  }

  close(): void {
    this.onPick = null;
    this.element.classList.add("hidden");
  }

  getOpenRect(): DOMRect | null {
    if (this.element.classList.contains("hidden")) {
      return null;
    }
    return this.element.getBoundingClientRect();
  }

  destroy(): void {
    this.element.remove();
  }
}
