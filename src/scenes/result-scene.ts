import type { AppContext, RunSummary, Scene } from "../core/types";

export class ResultScene implements Scene {
  private element: HTMLDivElement | null = null;

  constructor(
    private context: AppContext,
    private summary: RunSummary,
    private startBattle: () => void,
    private goHome: () => void
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
            <div class="screen__eyebrow">${this.summary.victory ? "顺利毕业" : "课后加练"}</div>
            <h2 class="screen__title">${this.summary.victory ? "黑板 Boss 被击退了" : "今天先到这里"}</h2>
            <p class="screen__copy">
              生存 ${formatTime(this.summary.duration)}，等级 Lv.${this.summary.level}，击败 ${this.summary.defeats}。
              当前最佳生存时间 ${formatTime(this.summary.bestDuration)}。
            </p>
          </div>
          <div class="screen__report" aria-hidden="true">
            <div class="screen__report-row"><span>课堂表现</span><strong>${this.summary.victory ? "优秀" : "继续努力"}</strong></div>
            <div class="screen__report-row"><span>击败数</span><strong>${this.summary.defeats}</strong></div>
            <div class="screen__report-row"><span>生存时间</span><strong>${formatTime(this.summary.duration)}</strong></div>
          </div>
        </div>
        <div class="screen__tips">
          <div class="screen__tip"><strong>本局成绩</strong><span>击败 ${this.summary.defeats} 个校园拟物怪。</span></div>
          <div class="screen__tip"><strong>成长节奏</strong><span>升到了 Lv.${this.summary.level}，这一局的武器组合已经更成形了。</span></div>
          <div class="screen__tip"><strong>后续可扩展</strong><span>下一阶段可以继续加照片脸、角色选择、地图切换和榜单。</span></div>
        </div>
        <div class="screen__actions">
          <button class="screen__button" data-action="restart">再来一局</button>
          <button class="screen__button" data-action="home">返回首页</button>
        </div>
      </div>
    `;
    panel.querySelector<HTMLButtonElement>("[data-action='restart']")?.addEventListener("click", this.startBattle);
    panel.querySelector<HTMLButtonElement>("[data-action='home']")?.addEventListener("click", this.goHome);
    this.context.overlayRoot.appendChild(panel);
    this.element = panel;
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

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
