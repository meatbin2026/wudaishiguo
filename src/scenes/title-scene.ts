import type { AppContext, Scene } from "../core/types";
import { ensureFaceAssetLoaded, getFaceAssetPath } from "../services/face-asset";

export class TitleScene implements Scene {
  private element: HTMLDivElement | null = null;

  constructor(
    private context: AppContext,
    private startBattle: () => void
  ) {}

  enter(): void {
    this.context.hudRoot.innerHTML = "";
    this.context.overlayRoot.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "screen";
    panel.innerHTML = `
      <div class="screen__panel">
        <div class="screen__hero">
          <div class="screen__hero-copy">
            <div class="screen__eyebrow">Campus Survivor</div>
            <h1 class="screen__title">校园割草<br />放学大作战</h1>
            <p class="screen__copy">
              扮演元气学生，在操场和教学楼之间边跑边打，躲开作业本怪、纸团怪和黑板 Boss，
              用升级三选一撑过整整一局。
            </p>
          </div>
          <div class="screen__poster" aria-hidden="true">
            <div class="screen__poster-face">
              <img class="screen__poster-photo" data-role="poster-photo" alt="头像预览" src="${getFaceAssetPath()}" />
            </div>
            <div class="screen__poster-body"></div>
            <div class="screen__poster-badge">后续可换成照片脸</div>
            <div class="screen__poster-spark screen__poster-spark--a"></div>
            <div class="screen__poster-spark screen__poster-spark--b"></div>
            <div class="screen__poster-spark screen__poster-spark--c"></div>
          </div>
        </div>
        <div class="screen__actions">
          <button class="screen__button" data-action="start">开始游戏</button>
          <button class="screen__button" disabled>角色</button>
          <button class="screen__button" disabled>地图</button>
          <button class="screen__button" disabled>榜单</button>
        </div>
        <div class="screen__status">替换 <code>/public/art/player-face.svg</code> 或同名图片素材，即可更新主角脸部。</div>
        <div class="screen__tips">
          <div class="screen__tip">
            <strong>PC 操作</strong>
            <span>WASD 或方向键移动，自动攻击。</span>
          </div>
          <div class="screen__tip">
            <strong>手机操作</strong>
            <span>任意空白区域按下就会生成临时摇杆。</span>
          </div>
          <div class="screen__tip">
            <strong>后续预留</strong>
            <span>主角头部已预留照片替换区，后面能直接接你儿子的照片。</span>
          </div>
        </div>
      </div>
    `;
    panel.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", this.startBattle);
    this.context.overlayRoot.appendChild(panel);
    this.element = panel;
    void ensureFaceAssetLoaded();
  }

  exit(): void {
    this.element?.remove();
    this.element = null;
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.context.viewport.x, this.context.viewport.y);
  }
}
