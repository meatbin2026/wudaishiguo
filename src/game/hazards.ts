import type { BattleState, HazardInstance } from "./state";
import { nextEntityId, triggerHitstop, triggerScreenShake } from "./state";
import { damagePlayer } from "./player";
import { spawnEffect } from "./effects";
import { playSfx } from "../services/audio-service";
import { lerp } from "../utils/math";

export function updateBossHazards(state: BattleState, dt: number): void {
  const boss = state.enemies.find((enemy) => enemy.config.boss);
  if (boss) {
    state.bossAttackTimer -= dt;
    if (state.bossAttackTimer <= 0) {
      spawnBossPattern(state, boss.phaseIndex, boss.x, boss.y);
      state.bossAttackTimer = boss.phaseIndex >= 2 ? 3 : boss.phaseIndex === 1 ? 4 : 5;
    }
  } else {
    state.bossAttackTimer = 4.5;
  }

  state.hazards = state.hazards.filter((hazard) => {
    hazard.life -= dt;
    if (hazard.kind === "chalk-zone" && !hazard.triggered && hazard.life <= hazard.maxLife * 0.28) {
      hazard.triggered = true;
      if (Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y) <= hazard.radius + state.player.radius) {
        damagePlayer(state, hazard.damage);
      }
      triggerScreenShake(state, 0.12, 7);
      triggerHitstop(state, 0.03);
      playSfx("boss-alert");
      spawnEffect(state, "boss-warning", hazard.x, hazard.y, "#ffd568", hazard.radius + 12, 0.3);
    }

    if (hazard.kind === "shockwave" && !hazard.triggered) {
      const progress = 1 - hazard.life / hazard.maxLife;
      const currentRadius = lerp(24, hazard.targetRadius, progress);
      const playerDistance = Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y);
      if (Math.abs(playerDistance - currentRadius) <= 16 + state.player.radius) {
        hazard.triggered = true;
        damagePlayer(state, hazard.damage);
        triggerScreenShake(state, 0.14, 8);
        triggerHitstop(state, 0.035);
      }
    }

    return hazard.life > 0;
  });
}

function spawnBossPattern(state: BattleState, phaseIndex: number, bossX: number, bossY: number): void {
  if (phaseIndex === 0) {
    state.hazards.push(createChalkZone(state, state.player.x, state.player.y, 56, 1.05, 20));
    playSfx("boss-alert");
    return;
  }

  if (phaseIndex === 1) {
    state.hazards.push(createShockwave(state, bossX, bossY, 220, 1, 22));
    state.hazards.push(createChalkZone(state, state.player.x + 36, state.player.y - 18, 52, 0.95, 22));
    playSfx("boss-alert");
    return;
  }

  state.hazards.push(createShockwave(state, bossX, bossY, 250, 1.05, 24));
  state.hazards.push(createChalkZone(state, state.player.x, state.player.y, 54, 0.9, 22));
  state.hazards.push(createChalkZone(state, state.player.x + 72, state.player.y + 28, 48, 0.95, 20));
  state.hazards.push(createChalkZone(state, state.player.x - 72, state.player.y - 24, 48, 0.95, 20));
  playSfx("boss-alert");
}

function createChalkZone(
  state: BattleState,
  x: number,
  y: number,
  radius: number,
  life: number,
  damage: number
): HazardInstance {
  return {
    id: nextEntityId(state),
    kind: "chalk-zone",
    x,
    y,
    radius,
    targetRadius: radius,
    life,
    maxLife: life,
    damage,
    triggered: false
  };
}

function createShockwave(
  state: BattleState,
  x: number,
  y: number,
  radius: number,
  life: number,
  damage: number
): HazardInstance {
  return {
    id: nextEntityId(state),
    kind: "shockwave",
    x,
    y,
    radius: 24,
    targetRadius: radius,
    life,
    maxLife: life,
    damage,
    triggered: false
  };
}
