import { SceneManager } from "./scene-manager";
import type { AppContext, Rect } from "./types";
import { requireElement } from "../ui/dom";
import { TitleScene } from "../scenes/title-scene";
import { BattleScene } from "../game/battle-scene";
import { ResultScene } from "../scenes/result-scene";
import { installAudioUnlock } from "../services/audio-service";

export function createGameApp(): void {
  const canvas = requireElement<HTMLCanvasElement>("#game");
  const hudRoot = requireElement<HTMLDivElement>("#hud");
  const overlayRoot = requireElement<HTMLDivElement>("#overlay-root");
  const touchIndicator = requireElement<HTMLDivElement>("#touch-indicator");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  const viewport = { x: window.innerWidth, y: window.innerHeight };
  const appContext: AppContext = {
    canvas,
    ctx,
    overlayRoot,
    hudRoot,
    touchIndicator,
    viewport,
    getUiRects: () => collectUiRects(overlayRoot, hudRoot)
  };
  const manager = new SceneManager();

  const showTitle = (): void => {
    manager.set(new TitleScene(appContext, startBattle));
  };

  const startBattle = (): void => {
    manager.set(
      new BattleScene(appContext, (summary) => {
        manager.set(new ResultScene(appContext, summary, startBattle, showTitle));
      })
    );
  };

  const resize = (): void => {
    viewport.x = window.innerWidth;
    viewport.y = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.x * ratio);
    canvas.height = Math.floor(viewport.y * ratio);
    canvas.style.width = `${viewport.x}px`;
    canvas.style.height = `${viewport.y}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resize();
  window.addEventListener("resize", resize);
  installAudioUnlock();
  showTitle();

  let last = performance.now();
  const frame = (now: number): void => {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    manager.update(dt);
    manager.render(ctx);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function collectUiRects(overlayRoot: HTMLElement, hudRoot: HTMLElement): Rect[] {
  const elements = [
    ...overlayRoot.querySelectorAll<HTMLElement>("button, .modal, .screen__panel, .debug-panel, .orientation"),
    ...hudRoot.querySelectorAll<HTMLElement>("button")
  ];
  return elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
}
