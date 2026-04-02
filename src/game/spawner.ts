import { bossEnemy, eliteEnemy, normalEnemies } from "../content/enemies";
import { pickRandom, randomFloat } from "../core/random";
import type { Vector2 } from "../core/types";
import type { BattleState } from "./state";
import { nextEntityId } from "./state";
import { spawnEffect } from "./effects";

export function updateSpawner(state: BattleState, viewport: Vector2, dt: number): void {
  if (state.bossDefeated) {
    return;
  }

  state.spawnTimer -= dt;
  state.eliteTimer -= dt;

  const phase = getSpawnPhase(state.time);
  if (state.spawnTimer <= 0 && !state.bossSpawned && state.enemies.length < phase.maxEnemies) {
    state.spawnTimer = phase.spawnInterval;
    const spawnCount = Math.min(phase.spawnCount, phase.maxEnemies - state.enemies.length);
    for (let index = 0; index < spawnCount; index += 1) {
      spawnEnemyFromConfig(state, pickRandom(phase.pool), viewport);
    }
  }

  if (state.eliteTimer <= 0 && !state.bossSpawned) {
    state.eliteTimer = phase.eliteInterval;
    if (state.enemies.length < phase.maxEnemies + 3) {
      spawnEnemyFromConfig(state, eliteEnemy, viewport);
    }
  }

  if (!state.bossSpawned && state.time >= 510) {
    state.bossSpawned = true;
    state.bossWarningTimer = 3.5;
    spawnEffect(state, "boss-warning", viewport.x / 2, viewport.y / 2, "#ff6359", 140, 3.2);
    spawnEnemyFromConfig(state, bossEnemy, viewport);
  }
}

export function spawnBossNow(state: BattleState, viewport: Vector2): void {
  if (state.bossSpawned) {
    return;
  }
  state.bossSpawned = true;
  state.bossWarningTimer = 1.8;
  spawnEffect(state, "boss-warning", viewport.x / 2, viewport.y / 2, "#ff6359", 140, 2);
  spawnEnemyFromConfig(state, bossEnemy, viewport);
}

export function clearEnemies(state: BattleState): void {
  state.enemies = [];
}

function spawnEnemyFromConfig(state: BattleState, config: typeof normalEnemies[number], viewport: Vector2): void {
  const side = Math.floor(Math.random() * 4);
  const padding = 36;
  const spawn = { x: 0, y: 0 };
  if (side === 0) {
    spawn.x = -padding;
    spawn.y = randomFloat(0, viewport.y);
  } else if (side === 1) {
    spawn.x = viewport.x + padding;
    spawn.y = randomFloat(0, viewport.y);
  } else if (side === 2) {
    spawn.x = randomFloat(0, viewport.x);
    spawn.y = -padding;
  } else {
    spawn.x = randomFloat(0, viewport.x);
    spawn.y = viewport.y + padding;
  }

  state.enemies.push({
    id: nextEntityId(state),
    x: spawn.x,
    y: spawn.y,
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

function getSpawnPhase(time: number): {
  spawnInterval: number;
  spawnCount: number;
  eliteInterval: number;
  maxEnemies: number;
  pool: typeof normalEnemies;
} {
  if (time < 75) {
    return {
      spawnInterval: 1.2,
      spawnCount: 1,
      eliteInterval: 34,
      maxEnemies: 14,
      pool: normalEnemies.filter((enemy) => enemy.id === "worksheet" || enemy.id === "paper-ball")
    };
  }

  if (time < 180) {
    return {
      spawnInterval: 0.95,
      spawnCount: 2,
      eliteInterval: 30,
      maxEnemies: 22,
      pool: normalEnemies
    };
  }

  if (time < 330) {
    return {
      spawnInterval: 0.72,
      spawnCount: 3,
      eliteInterval: 25,
      maxEnemies: 30,
      pool: normalEnemies
    };
  }

  return {
    spawnInterval: 0.56,
    spawnCount: 4,
    eliteInterval: 20,
    maxEnemies: 38,
    pool: normalEnemies
  };
}
