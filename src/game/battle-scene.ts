import { defaultCharacter } from "../content/characters";
import { normalEnemies } from "../content/enemies";
import { campusMap } from "../content/map";
import { getWeaponConfig } from "../content/weapons";
import { pickRandom, randomFloat } from "../core/random";
import { KeyboardInput } from "../input/keyboard-input";
import { TouchStickInput } from "../input/touch-stick";
import type { AppContext, RunSummary, Scene, UpgradeOption, Vector2 } from "../core/types";
import { Hud } from "../ui/hud";
import { UpgradeModal } from "../ui/upgrade-modal";
import { DebugPanel } from "../ui/debug-panel";
import { OrientationOverlay } from "../ui/orientation-overlay";
import { clearEnemies, spawnBossNow, updateSpawner } from "./spawner";
import { createInitialBattleState, nextEntityId, type BattleState } from "./state";
import { updatePlayer, updatePickupCollection } from "./player";
import { updateEnemies } from "./enemy";
import { spawnEffect, updateEffects } from "./effects";
import { updateBossHazards } from "./hazards";
import { applyUpgrade, rollUpgradeChoices } from "./upgrades";
import { updateProjectiles, updateWeapons } from "./projectile";
import { lerp, normalize } from "../utils/math";
import { ensureFaceAssetLoaded, getFaceAssetSync } from "../services/face-asset";
import {
  getArtAssetSync,
  preloadBattleArtAssets
} from "../services/art-assets";
import { playSfx } from "../services/audio-service";
import { saveBestRun } from "../services/save-service";

export class BattleScene implements Scene {
  private state: BattleState;
  private keyboardInput: KeyboardInput | null = null;
  private touchInput: TouchStickInput | null = null;
  private hud: Hud | null = null;
  private upgradeModal: UpgradeModal | null = null;
  private debugPanel: DebugPanel | null = null;
  private orientationOverlay: OrientationOverlay | null = null;
  private cleanupFns: Array<() => void> = [];

  constructor(
    private context: AppContext,
    private finishRun: (summary: RunSummary) => void
  ) {
    this.state = createInitialBattleState(context.viewport);
  }

  enter(): void {
    this.context.overlayRoot.innerHTML = "";
    this.context.hudRoot.innerHTML = "";
    this.keyboardInput = new KeyboardInput();
    this.touchInput = new TouchStickInput(
      this.context.canvas,
      this.context.touchIndicator,
      () => this.context.getUiRects()
    );
    this.hud = new Hud(this.context.hudRoot, () => {
      this.state.paused = !this.state.paused;
      this.hud?.setPaused(this.state.paused);
    });
    this.upgradeModal = new UpgradeModal(this.context.overlayRoot);
    this.debugPanel = new DebugPanel(this.context.overlayRoot, [
      { id: "level", label: "强制升级", onClick: () => this.forceLevelUp() },
      { id: "boss", label: "召唤 Boss", onClick: () => spawnBossNow(this.state, this.context.viewport) },
      { id: "clear", label: "清空怪物", onClick: () => clearEnemies(this.state) },
      {
        id: "invincible",
        label: "切换无敌",
        onClick: () => {
          this.state.player.invincible = !this.state.player.invincible;
        }
      }
    ]);
    this.orientationOverlay = new OrientationOverlay(this.context.overlayRoot);
    this.orientationOverlay.update();
    void ensureFaceAssetLoaded();
    void preloadBattleArtAssets();
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleDebugKey);
    this.cleanupFns.push(
      () => window.removeEventListener("resize", this.handleResize),
      () => window.removeEventListener("keydown", this.handleDebugKey)
    );
  }

  exit(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.keyboardInput?.destroy();
    this.touchInput?.destroy();
    this.hud?.destroy();
    this.upgradeModal?.destroy();
    this.debugPanel?.destroy();
    this.orientationOverlay?.destroy();
    this.context.touchIndicator.classList.add("hidden");
    this.context.overlayRoot.innerHTML = "";
    this.context.hudRoot.innerHTML = "";
  }

  update(dt: number): void {
    this.orientationOverlay?.update();
    if (this.state.completed) {
      return;
    }

    if (this.state.bossWarningTimer > 0) {
      this.state.bossWarningTimer = Math.max(0, this.state.bossWarningTimer - dt);
    }

    if (this.state.hitstopTimer > 0) {
      updateEffects(this.state, dt);
      this.renderHud();
      return;
    }

    if (this.state.paused) {
      this.renderHud();
      return;
    }

    this.state.time += dt;
    updatePlayer(this.state, this.getMoveVector(), dt, this.context.viewport.x, this.context.viewport.y);
    updateSpawner(this.state, this.context.viewport, dt);
    updateWeapons(this.state, dt);
    updateProjectiles(this.state, dt);
    updateEnemies(this.state, dt);
    updateBossHazards(this.state, dt);
    updatePickupCollection(this.state, dt);
    this.updateEnemyDeaths();
    updateEffects(this.state, dt);
    this.openUpgradeIfReady();
    this.renderHud();

    if (this.state.player.hp <= 0) {
      this.completeRun(false);
    }
    if (this.state.bossSpawned && !this.state.enemies.some((enemy) => enemy.config.boss) && this.state.bossWarningTimer <= 0) {
      this.state.bossDefeated = true;
      this.completeRun(true);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.context.viewport.x, this.context.viewport.y);
    const shakeOffset = getShakeOffset(this.state);
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);
    drawMap(ctx, this.context.viewport);
    drawPickups(ctx, this.state);
    drawProjectiles(ctx, this.state);
    drawHazards(ctx, this.state);
    drawPlayer(ctx, this.state);
    drawEnemies(ctx, this.state);
    drawEffects(ctx, this.state);
    ctx.restore();
    drawBossBanner(ctx, this.state, this.context.viewport);
  }

  private getMoveVector(): Vector2 {
    const keyboard = this.keyboardInput?.getVector() ?? { x: 0, y: 0 };
    const touch = this.touchInput?.getVector() ?? { x: 0, y: 0 };
    return normalize({ x: keyboard.x + touch.x, y: keyboard.y + touch.y });
  }

  private updateEnemyDeaths(): void {
    const survivors = [];
    for (const enemy of this.state.enemies) {
      if (enemy.hp > 0) {
        this.handleBossPhases(enemy);
        survivors.push(enemy);
        continue;
      }
      this.state.defeats += 1;
      this.state.pickups.push({
        id: nextEntityId(this.state),
        x: enemy.x,
        y: enemy.y,
        radius: enemy.config.elite || enemy.config.boss ? 12 : 8,
        value: enemy.config.xp,
        life: 24
      });
      spawnEffect(this.state, "pickup", enemy.x, enemy.y, enemy.config.color, enemy.radius + 10, 0.32);
      playSfx("defeat");
    }
    this.state.enemies = survivors;
  }

  private handleBossPhases(enemy: BattleState["enemies"][number]): void {
    if (!enemy.config.boss || !enemy.config.phases) {
      return;
    }
    const currentPhase = enemy.config.phases[enemy.phaseIndex];
    if (!currentPhase) {
      return;
    }
    const hpRatio = enemy.hp / enemy.maxHp;
    if (hpRatio <= currentPhase.hpRatio) {
      enemy.phaseIndex += 1;
      spawnEffect(this.state, "boss-warning", enemy.x, enemy.y, "#ff8758", 90, 1.2);
      playSfx("boss-alert");
      for (let index = 0; index < currentPhase.spawnBurst; index += 1) {
        const angle = (Math.PI * 2 * index) / currentPhase.spawnBurst;
        const config = pickRandom(normalEnemies);
        this.state.enemies.push({
          id: nextEntityId(this.state),
          x: enemy.x + Math.cos(angle) * randomFloat(56, 96),
          y: enemy.y + Math.sin(angle) * randomFloat(56, 96),
          config,
          radius: config.radius,
          hp: config.maxHp,
          maxHp: config.maxHp,
          dashTimer: randomFloat(0.2, config.dashCooldown ?? 1.8),
          dashVector: null,
          phaseIndex: 0,
          hitFlash: 0
        });
      }
    }
  }

  private renderHud(): void {
    this.hud?.render({
      hp: this.state.player.hp,
      maxHp: this.state.player.maxHp,
      xp: this.state.player.xp,
      xpToNext: this.state.player.xpToNext,
      level: this.state.player.level,
      time: this.state.time,
      defeats: this.state.defeats,
      weaponSummary: summarizeWeapons(this.state),
      phaseLabel: getPhaseLabel(this.state)
    });
    this.hud?.setPaused(this.state.paused);
  }

  private forceLevelUp(): void {
    this.state.player.xp = this.state.player.xpToNext;
    this.openUpgradeIfReady();
  }

  private openUpgradeIfReady(): void {
    if (this.state.player.xp < this.state.player.xpToNext) {
      return;
    }
    while (this.state.player.xp >= this.state.player.xpToNext) {
      this.state.player.xp -= this.state.player.xpToNext;
      this.state.player.level += 1;
      this.state.player.xpToNext = Math.floor(this.state.player.xpToNext * 1.22 + 8);
      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 12);
      spawnEffect(this.state, "level-up", this.state.player.x, this.state.player.y, "#6db6ff", 38, 0.8);
      playSfx("level-up");
    }
    const options = rollUpgradeChoices(this.state, 3);
    this.state.paused = true;
    this.hud?.setPaused(true);
    this.upgradeModal?.open(options, (option: UpgradeOption) => {
      applyUpgrade(this.state, option);
      this.state.paused = false;
      this.hud?.setPaused(false);
    });
  }

  private completeRun(victory: boolean): void {
    if (this.state.completed) {
      return;
    }
    this.state.completed = true;
    const saved = saveBestRun({
      duration: this.state.time,
      defeats: this.state.defeats,
      level: this.state.player.level,
      victory,
      bestDuration: 0
    });
    this.finishRun({
      duration: this.state.time,
      defeats: this.state.defeats,
      level: this.state.player.level,
      victory,
      bestDuration: saved.bestDuration
    });
  }

  private handleResize = (): void => {
    this.orientationOverlay?.update();
  };

  private handleDebugKey = (event: KeyboardEvent): void => {
    if (event.key === "`") {
      this.debugPanel?.toggle();
    }
    if (event.key.toLowerCase() === "p") {
      this.state.paused = !this.state.paused;
      this.hud?.setPaused(this.state.paused);
    }
  };
}

function summarizeWeapons(state: BattleState): string {
  return Object.entries(state.activeWeapons)
    .map(([weaponId, level]) => {
      const config = getWeaponConfig(weaponId);
      return `${config.name} Lv.${level + 1}`;
    })
    .join(" / ");
}

function drawMap(ctx: CanvasRenderingContext2D, viewport: Vector2): void {
  ctx.fillStyle = campusMap.skyColor;
  ctx.fillRect(0, 0, viewport.x, viewport.y);

  const backdrop = getArtAssetSync("campus-backdrop");
  if (backdrop) {
    ctx.drawImage(backdrop, 0, 0, viewport.x, viewport.y * 0.62);
  } else {
    const stripeHeight = viewport.y * 0.04;
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.fillRect(0, viewport.y * 0.22, viewport.x, stripeHeight);
  }

  ctx.fillStyle = campusMap.grassColor;
  ctx.fillRect(0, viewport.y * 0.28, viewport.x, viewport.y * 0.72);

  ctx.fillStyle = campusMap.trackColor;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(28, viewport.y * 0.72, viewport.x - 56, 60);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 4; index += 1) {
    const y = viewport.y * 0.72 + 14 + index * 12;
    ctx.beginPath();
    ctx.moveTo(52, y);
    ctx.lineTo(viewport.x - 52, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let index = 0; index < 6; index += 1) {
    const x = 80 + index * 160;
    const width = 80 + (index % 2) * 30;
    const height = 100 + (index % 3) * 35;
    ctx.fillRect(x, viewport.y * 0.18 - height, width, height);
  }

  ctx.fillStyle = "rgba(64, 110, 68, 0.22)";
  for (let index = 0; index < 12; index += 1) {
    ctx.beginPath();
    ctx.arc(40 + index * 120, viewport.y * 0.3, 26 + (index % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const board = getArtAssetSync("campus-board");
  if (board) {
    const boardWidth = 168;
    const boardHeight = 72;
    ctx.drawImage(board, viewport.x * 0.08, viewport.y * 0.08, boardWidth, boardHeight);
  } else {
    ctx.fillStyle = "rgba(255, 247, 220, 0.72)";
    ctx.fillRect(viewport.x * 0.08, viewport.y * 0.1, 180, 54);
    ctx.fillStyle = "#35566f";
    ctx.font = "700 16px Trebuchet MS";
    ctx.fillText("今日值日", viewport.x * 0.08 + 16, viewport.y * 0.1 + 22);
    ctx.font = "600 12px Trebuchet MS";
    ctx.fillText("作业本怪 / 纸飞机怪", viewport.x * 0.08 + 16, viewport.y * 0.1 + 42);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: BattleState): void {
  const player = state.player;
  ctx.save();
  ctx.translate(player.x, player.y);
  const hurtPulse = player.hurtTimer > 0 ? 1 + player.hurtTimer * 0.12 : 1;
  ctx.scale(hurtPulse, hurtPulse);

  ctx.fillStyle = "rgba(255, 223, 119, 0.22)";
  ctx.beginPath();
  ctx.arc(0, 2, 36 + Math.sin(performance.now() * 0.01) * 3, 0, Math.PI * 2);
  ctx.fill();

  const bodyAsset = getArtAssetSync("player-body");
  if (bodyAsset) {
    ctx.drawImage(bodyAsset, -42, 0, 84, 102);
  } else {
    ctx.fillStyle = defaultCharacter.accentColor;
    ctx.beginPath();
    ctx.arc(0, 18, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = defaultCharacter.bodyColor;
    ctx.fillRect(-20, 4, 40, 28);
  }

  ctx.fillStyle = defaultCharacter.faceFrameColor;
  ctx.beginPath();
  ctx.arc(0, -8, 22, 0, Math.PI * 2);
  ctx.fill();

  const faceAsset = getFaceAssetSync();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -8, 17, 0, Math.PI * 2);
  ctx.clip();
  if (faceAsset) {
    ctx.drawImage(faceAsset, -17, -25, 34, 34);
  } else {
    ctx.fillStyle = "#f2c98a";
    ctx.beginPath();
    ctx.arc(0, -8, 17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = "#47352c";
  ctx.fillRect(-14, -28, 28, 12);
  ctx.fillRect(-11, -17, 22, 7);

  ctx.fillStyle = "#3b2b20";
  ctx.beginPath();
  ctx.arc(-6, -10, 2, 0, Math.PI * 2);
  ctx.arc(6, -10, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5c3828";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -4, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -8, 22, Math.PI * 0.82, Math.PI * 1.18);
  ctx.stroke();

  ctx.restore();
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: BattleState): void {
  for (const enemy of state.enemies) {
    const pulse = 1 + enemy.hitFlash * 0.12;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.scale(pulse, pulse);
    const asset = getArtAssetSync(enemy.config.id as Parameters<typeof getArtAssetSync>[0]);
    if (asset) {
      ctx.globalAlpha = 0.7 + enemy.hitFlash * 0.3;
      const scale = enemy.config.boss ? 2.5 : enemy.config.elite ? 2.2 : 2;
      const width = enemy.radius * scale;
      const height = enemy.config.boss ? enemy.radius * 2.1 : enemy.radius * 2.2;
      ctx.drawImage(asset, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = mixColor(enemy.config.color, "#ffffff", enemy.hitFlash * 0.65);
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enemy.config.elite || enemy.config.boss) {
      ctx.fillStyle = "rgba(12, 35, 52, 0.18)";
      ctx.fillRect(-enemy.radius, enemy.radius + 8, enemy.radius * 2, 8);
      ctx.fillStyle = enemy.config.boss ? "#ff6b5d" : "#ffb54d";
      ctx.fillRect(-enemy.radius, enemy.radius + 8, (enemy.hp / enemy.maxHp) * enemy.radius * 2, 8);
    }
    ctx.restore();
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, state: BattleState): void {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    const asset = getArtAssetSync(projectile.weaponId as Parameters<typeof getArtAssetSync>[0]);
    if (asset) {
      const angle = projectile.persistent ? projectile.angle : Math.atan2(projectile.vy, projectile.vx);
      ctx.rotate(angle);
      const width =
        projectile.weaponId === "paper-plane"
          ? 26
          : projectile.weaponId === "pencil"
            ? 30
            : projectile.weaponId === "chalk"
              ? 20
              : projectile.weaponId === "textbook"
                ? 24
                : 22;
      const height =
        projectile.weaponId === "paper-plane"
          ? 18
          : projectile.weaponId === "pencil"
            ? 10
            : projectile.weaponId === "chalk"
              ? 20
              : projectile.weaponId === "textbook"
                ? 20
                : 18;
      ctx.drawImage(asset, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawPickups(ctx: CanvasRenderingContext2D, state: BattleState): void {
  for (const pickup of state.pickups) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = pickup.value >= 50 ? "#ffe27b" : "#8cc8ff";
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const asset = getArtAssetSync(
      pickup.value >= 50 ? "xp-orb-rare" : "xp-orb"
    );
    if (asset) {
      const size = pickup.value >= 50 ? 22 : 18;
      ctx.drawImage(asset, pickup.x - size / 2, pickup.y - size / 2, size, size);
    } else {
      ctx.fillStyle = pickup.value >= 50 ? "#ffcf5b" : "#59a7ff";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHazards(ctx: CanvasRenderingContext2D, state: BattleState): void {
  for (const hazard of state.hazards) {
    const progress = 1 - hazard.life / hazard.maxLife;
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    if (hazard.kind === "chalk-zone") {
      const flash = hazard.life <= hazard.maxLife * 0.28;
      ctx.globalAlpha = flash ? 0.85 : 0.45;
      ctx.strokeStyle = flash ? "#ff795f" : "#f8f4de";
      ctx.lineWidth = flash ? 6 : 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = flash ? "#ffd568" : "#f8f4de";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-hazard.radius * 0.45, -hazard.radius * 0.45);
      ctx.lineTo(hazard.radius * 0.45, hazard.radius * 0.45);
      ctx.moveTo(hazard.radius * 0.45, -hazard.radius * 0.45);
      ctx.lineTo(-hazard.radius * 0.45, hazard.radius * 0.45);
      ctx.stroke();
    } else {
      const currentRadius = lerp(24, hazard.targetRadius, progress);
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = "#ffe484";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ff8566";
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawEffects(ctx: CanvasRenderingContext2D, state: BattleState): void {
  for (const effect of state.effects) {
    const alpha = effect.life / effect.maxLife;
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.globalAlpha = alpha;
    const assetId =
      effect.kind === "hit"
        ? "effect-hit"
        : effect.kind === "level-up"
          ? "effect-level-up"
          : effect.kind === "pickup"
            ? "effect-pickup"
            : "effect-boss-warning";
    const asset = getArtAssetSync(assetId);
    if (asset) {
      const sizeMultiplier =
        effect.kind === "level-up" ? 2.2 : effect.kind === "boss-warning" ? 2.5 : 1.35;
      const size = lerp(effect.radius * 0.5, effect.radius, 1 - alpha) * sizeMultiplier;
      ctx.rotate((1 - alpha) * Math.PI * (effect.kind === "pickup" ? 1.2 : 0.65));
      ctx.drawImage(asset, -size / 2, -size / 2, size, size);
    } else {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.kind === "boss-warning" ? 4 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, lerp(effect.radius * 0.5, effect.radius, 1 - alpha), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBossBanner(ctx: CanvasRenderingContext2D, state: BattleState, viewport: Vector2): void {
  if (state.bossWarningTimer <= 0) {
    return;
  }
  const alpha = Math.min(1, state.bossWarningTimer);
  ctx.save();
  ctx.globalAlpha = alpha;
  const banner = getArtAssetSync("boss-alert");
  const width = viewport.x * 0.56;
  const height = 54;
  const x = viewport.x * 0.22;
  const y = 34;
  if (banner) {
    ctx.drawImage(banner, x, y, width, height);
  } else {
    ctx.fillStyle = "rgba(33, 20, 23, 0.72)";
    ctx.fillRect(x, y, width, height);
  }
  ctx.fillStyle = "#fff2ef";
  ctx.font = "700 24px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("黑板 Boss 正在逼近", viewport.x / 2, 68);
  ctx.restore();
}

function getShakeOffset(state: BattleState): Vector2 {
  if (state.shakeTimer <= 0 || state.shakeMagnitude <= 0) {
    return { x: 0, y: 0 };
  }
  const amount = state.shakeMagnitude * Math.min(1, state.shakeTimer * 8);
  return {
    x: (Math.random() - 0.5) * amount,
    y: (Math.random() - 0.5) * amount
  };
}

function getPhaseLabel(state: BattleState): string {
  if (state.bossSpawned && !state.bossDefeated) {
    return "阶段 黑板 Boss";
  }
  if (state.time < 90) {
    return "阶段 早读";
  }
  if (state.time < 210) {
    return "阶段 课间";
  }
  if (state.time < 360) {
    return "阶段 午后";
  }
  if (state.time < 540) {
    return "阶段 放学冲刺";
  }
  return "阶段 终极自习";
}

function mixColor(a: string, b: string, amount: number): string {
  if (amount <= 0.01) {
    return a;
  }
  const hex = (value: string): [number, number, number] => {
    const clean = value.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16)
    ];
  };
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const blend = (start: number, end: number): number => Math.round(start + (end - start) * amount);
  return `rgb(${blend(ar, br)}, ${blend(ag, bg)}, ${blend(ab, bb)})`;
}
