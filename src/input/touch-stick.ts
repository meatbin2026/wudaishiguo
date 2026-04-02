import type { MoveInput, Rect, Vector2 } from "../core/types";
import { clamp, normalize } from "../utils/math";
import { isPointInsideRects } from "../utils/rect";

export class TouchStickInput implements MoveInput {
  private activePointerId: number | null = null;
  private origin: Vector2 | null = null;
  private vector: Vector2 = { x: 0, y: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private indicator: HTMLDivElement,
    private getUiRects: () => Rect[]
  ) {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  getVector(): Vector2 {
    return this.vector;
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" || this.activePointerId !== null) {
      return;
    }
    if (isPointInsideRects(event.clientX, event.clientY, this.getUiRects())) {
      return;
    }
    this.activePointerId = event.pointerId;
    this.origin = { x: event.clientX, y: event.clientY };
    this.vector = { x: 0, y: 0 };
    this.updateIndicator(this.origin, { x: 0, y: 0 }, false);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId || !this.origin) {
      return;
    }
    const dx = event.clientX - this.origin.x;
    const dy = event.clientY - this.origin.y;
    const maxRadius = 46;
    const distance = Math.hypot(dx, dy);
    const limited = distance > maxRadius ? maxRadius / distance : 1;
    const thumb = {
      x: dx * limited,
      y: dy * limited
    };
    const normalized = normalize({
      x: clamp(dx / maxRadius, -1, 1),
      y: clamp(dy / maxRadius, -1, 1)
    });
    const strength = clamp(distance / maxRadius, 0, 1);
    this.vector = {
      x: normalized.x * strength,
      y: normalized.y * strength
    };
    this.updateIndicator(this.origin, thumb, false);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }
    this.activePointerId = null;
    this.origin = null;
    this.vector = { x: 0, y: 0 };
    this.updateIndicator({ x: 0, y: 0 }, { x: 0, y: 0 }, true);
  };

  private updateIndicator(origin: Vector2, thumbOffset: Vector2, hidden: boolean): void {
    this.indicator.classList.toggle("hidden", hidden);
    if (hidden) {
      return;
    }
    this.indicator.style.left = `${origin.x}px`;
    this.indicator.style.top = `${origin.y}px`;
    const thumb = this.indicator.firstElementChild as HTMLDivElement | null;
    if (thumb) {
      thumb.style.transform = `translate(${thumbOffset.x}px, ${thumbOffset.y}px)`;
    }
  }
}
