import type { Scene } from "./types";

export class SceneManager {
  private current: Scene | null = null;

  set(scene: Scene): void {
    this.current?.exit();
    this.current = scene;
    this.current.enter();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx);
  }
}
