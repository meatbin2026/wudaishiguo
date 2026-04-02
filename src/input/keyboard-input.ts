import type { MoveInput, Vector2 } from "../core/types";
import { normalize } from "../utils/math";

const KEY_BINDINGS: Record<string, keyof KeyboardInput["pressed"]> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right"
};

export class KeyboardInput implements MoveInput {
  private pressed = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const mapped = KEY_BINDINGS[event.code];
    if (!mapped) {
      return;
    }
    this.pressed[mapped] = true;
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const mapped = KEY_BINDINGS[event.code];
    if (!mapped) {
      return;
    }
    this.pressed[mapped] = false;
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  getVector(): Vector2 {
    const x = (this.pressed.right ? 1 : 0) - (this.pressed.left ? 1 : 0);
    const y = (this.pressed.down ? 1 : 0) - (this.pressed.up ? 1 : 0);
    return normalize({ x, y });
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
