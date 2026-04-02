import { getArtAssetPath } from "../services/art-assets";

export interface HudData {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  time: number;
  defeats: number;
  weaponSummary: string;
  phaseLabel: string;
}

export class Hud {
  private pauseButton: HTMLButtonElement;

  constructor(private root: HTMLDivElement, onPause: () => void) {
    this.root.innerHTML = `
      <div class="hud__group">
        <div class="hud__header hud__pill">
          <img class="hud__icon" src="${getArtAssetPath("school-crest")}" alt="" />
          <div>
            <strong>校园生存战</strong>
            <span class="hud__sub">放学冲刺 · 标准模式</span>
          </div>
        </div>
        <div class="hud__bar hud__pill">
          <div class="hud__bar-fill hud__bar-fill--hp" data-role="hp-fill"></div>
          <div class="hud__bar-label" data-role="hp-label"></div>
        </div>
        <div class="hud__bar hud__pill">
          <div class="hud__bar-fill hud__bar-fill--xp" data-role="xp-fill"></div>
          <div class="hud__bar-label" data-role="xp-label"></div>
        </div>
        <div class="hud__stats">
          <div class="hud__pill" data-role="level"></div>
          <div class="hud__pill" data-role="phase"></div>
          <div class="hud__pill" data-role="time"></div>
          <div class="hud__pill" data-role="defeats"></div>
        </div>
      </div>
      <div class="hud__group" style="justify-items:end;">
        <div class="hud__loadout hud__pill">
          <img class="hud__note" src="${getArtAssetPath("hud-note")}" alt="" />
          <div class="hud__loadout-copy" data-role="weapons"></div>
        </div>
        <button class="hud__button" data-role="pause-button">暂停</button>
      </div>
    `;
    this.pauseButton = this.root.querySelector<HTMLButtonElement>("[data-role='pause-button']")!;
    this.pauseButton.addEventListener("click", onPause);
  }

  render(data: HudData): void {
    const hpRatio = Math.max(0, Math.min(data.hp / data.maxHp, 1));
    const xpRatio = Math.max(0, Math.min(data.xp / data.xpToNext, 1));
    this.setFill("hp-fill", hpRatio * 100);
    this.setFill("xp-fill", xpRatio * 100);
    this.setText("hp-label", `体力 ${Math.ceil(data.hp)} / ${data.maxHp}`);
    this.setText("xp-label", `经验 ${Math.floor(data.xp)} / ${data.xpToNext}`);
    this.setText("level", `等级 Lv.${data.level}`);
    this.setText("phase", data.phaseLabel);
    this.setText("time", `时间 ${formatTime(data.time)}`);
    this.setText("defeats", `击败 ${data.defeats}`);
    this.setText("weapons", data.weaponSummary);
  }

  setPaused(paused: boolean): void {
    this.pauseButton.textContent = paused ? "继续" : "暂停";
  }

  destroy(): void {
    this.root.innerHTML = "";
  }

  private setText(role: string, text: string): void {
    const element = this.root.querySelector<HTMLElement>(`[data-role='${role}']`);
    if (element) {
      element.textContent = text;
    }
  }

  private setFill(role: string, width: number): void {
    const element = this.root.querySelector<HTMLElement>(`[data-role='${role}']`);
    if (element) {
      element.style.width = `${width}%`;
    }
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
