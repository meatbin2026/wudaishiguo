import { getWeaponConfig } from "../content/weapons";
import type { BattleState, EnemyInstance, ProjectileInstance } from "./state";
import { nextEntityId } from "./state";
import { normalize } from "../utils/math";
import { applyDamageToEnemy } from "./enemy";
import { spawnEffect } from "./effects";
import { playSfx } from "../services/audio-service";
import { triggerHitstop, triggerScreenShake } from "./state";

export function updateWeapons(state: BattleState, dt: number): void {
  const activeIds = Object.keys(state.activeWeapons);
  for (const weaponId of activeIds) {
    const config = getWeaponConfig(weaponId);
    const level = state.activeWeapons[weaponId];
    const levelConfig = config.levels[level];
    if (!levelConfig) {
      continue;
    }
    if (config.attackKind === "orbit" || config.attackKind === "shield") {
      syncPersistentProjectiles(state, weaponId, config.attackKind, levelConfig);
      continue;
    }
    const cooldownMultiplier = 1 - state.passives.attackRateBonus;
    const nextCooldown = (state.weaponCooldowns[weaponId] ?? 0) - dt;
    if (nextCooldown > 0) {
      state.weaponCooldowns[weaponId] = nextCooldown;
      continue;
    }
    state.weaponCooldowns[weaponId] = levelConfig.cooldown * cooldownMultiplier;
    if (config.attackKind === "projectile") {
      spawnProjectileVolley(state, weaponId, level);
    } else if (config.attackKind === "burst") {
      spawnBurst(state, weaponId, level);
    } else if (config.attackKind === "sweep") {
      spawnSweep(state, weaponId, level);
    }
  }
}

export function updateProjectiles(state: BattleState, dt: number): void {
  const nextProjectiles: ProjectileInstance[] = [];
  for (const projectile of state.projectiles) {
    updateHitMemory(projectile, dt);
    if (projectile.persistent && projectile.attackKind !== "sweep") {
      projectile.angle += projectile.orbitSpeed * dt;
      const orbitAngle = projectile.angle + (Math.PI * 2 * projectile.slotIndex) / Math.max(projectile.slotCount, 1);
      projectile.x = state.player.x + Math.cos(orbitAngle) * projectile.orbitRadius;
      projectile.y = state.player.y + Math.sin(orbitAngle) * projectile.orbitRadius;
    } else if (projectile.attackKind === "sweep") {
      projectile.life -= dt;
      projectile.angle += projectile.orbitSpeed * dt;
      projectile.x = state.player.x + Math.cos(projectile.angle) * projectile.orbitRadius;
      projectile.y = state.player.y + Math.sin(projectile.angle) * projectile.orbitRadius;
    } else {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
    }

    collideProjectile(state, projectile);
    if (projectile.persistent || projectile.life > 0) {
      nextProjectiles.push(projectile);
    }
  }
  state.projectiles = nextProjectiles;
}

function spawnProjectileVolley(state: BattleState, weaponId: string, level: number): void {
  const config = getWeaponConfig(weaponId);
  const levelConfig = config.levels[level];
  const target = findNearestEnemy(state);
  if (!target) {
    return;
  }
  const aim = normalize({ x: target.x - state.player.x, y: target.y - state.player.y });
  const count = levelConfig.count ?? 1;
  for (let index = 0; index < count; index += 1) {
    const spread = count === 1 ? 0 : ((index / (count - 1)) * 0.34 - 0.17);
    const angle = Math.atan2(aim.y, aim.x) + spread;
    spawnProjectile(state, {
      weaponId,
      attackKind: config.attackKind,
      radius: levelConfig.radius ?? 8,
      damage: levelConfig.damage * (1 + state.passives.damageBonus),
      color: config.color,
      vx: Math.cos(angle) * (levelConfig.speed ?? 300),
      vy: Math.sin(angle) * (levelConfig.speed ?? 300),
      life: 2.2,
      maxLife: 2.2,
      pierce: levelConfig.pierce ?? 0,
      persistent: false,
      orbitRadius: 0,
      orbitSpeed: 0,
      slotIndex: 0,
      slotCount: 1,
      angle,
      hitMemory: {}
    });
  }
}

function spawnBurst(state: BattleState, weaponId: string, level: number): void {
  const config = getWeaponConfig(weaponId);
  const levelConfig = config.levels[level];
  const count = levelConfig.count ?? 6;
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    spawnProjectile(state, {
      weaponId,
      attackKind: config.attackKind,
      radius: levelConfig.radius ?? 8,
      damage: levelConfig.damage * (1 + state.passives.damageBonus),
      color: config.color,
      vx: Math.cos(angle) * (levelConfig.speed ?? 240),
      vy: Math.sin(angle) * (levelConfig.speed ?? 240),
      life: 1.15,
      maxLife: 1.15,
      pierce: levelConfig.pierce ?? 0,
      persistent: false,
      orbitRadius: 0,
      orbitSpeed: 0,
      slotIndex: 0,
      slotCount: 1,
      angle,
      hitMemory: {}
    });
  }
}

function spawnSweep(state: BattleState, weaponId: string, level: number): void {
  const config = getWeaponConfig(weaponId);
  const levelConfig = config.levels[level];
  const count = levelConfig.count ?? 1;
  const nearest = findNearestEnemy(state);
  const baseAngle = nearest
    ? Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x)
    : Math.random() * Math.PI * 2;
  for (let index = 0; index < count; index += 1) {
    const direction = index % 2 === 0 ? 1 : -1;
    spawnProjectile(state, {
      weaponId,
      attackKind: config.attackKind,
      radius: levelConfig.radius ?? 18,
      damage: levelConfig.damage * (1 + state.passives.damageBonus),
      color: config.color,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      pierce: 999,
      persistent: true,
      orbitRadius: levelConfig.orbitRadius ?? 60,
      orbitSpeed: 10 * direction,
      slotIndex: 0,
      slotCount: 1,
      angle: baseAngle + (index - (count - 1) / 2) * 0.25,
      hitMemory: {}
    });
  }
}

function syncPersistentProjectiles(
  state: BattleState,
  weaponId: string,
  attackKind: ProjectileInstance["attackKind"],
  levelConfig: ReturnType<typeof getWeaponConfig>["levels"][number]
): void {
  const count = levelConfig.count ?? 1;
  const existing = state.projectiles.filter((projectile) => projectile.weaponId === weaponId && projectile.persistent);
  if (existing.length === count) {
    existing.forEach((projectile, index) => {
      projectile.slotIndex = index;
      projectile.slotCount = count;
      projectile.radius = levelConfig.radius ?? projectile.radius;
      projectile.damage = levelConfig.damage * (1 + state.passives.damageBonus);
      projectile.orbitRadius = levelConfig.orbitRadius ?? projectile.orbitRadius;
    });
    return;
  }
  state.projectiles = state.projectiles.filter((projectile) => !(projectile.weaponId === weaponId && projectile.persistent));
  for (let index = 0; index < count; index += 1) {
    spawnProjectile(state, {
      weaponId,
      attackKind,
      radius: levelConfig.radius ?? 14,
      damage: levelConfig.damage * (1 + state.passives.damageBonus),
      color: getWeaponConfig(weaponId).color,
      vx: 0,
      vy: 0,
      life: 9999,
      maxLife: 9999,
      pierce: 999,
      persistent: true,
      orbitRadius: levelConfig.orbitRadius ?? 60,
      orbitSpeed: attackKind === "shield" ? 1.4 : 1.8,
      slotIndex: index,
      slotCount: count,
      angle: Math.random() * Math.PI * 2,
      hitMemory: {}
    });
  }
}

function spawnProjectile(state: BattleState, projectile: Omit<ProjectileInstance, "id" | "x" | "y">): void {
  state.projectiles.push({
    id: nextEntityId(state),
    x: state.player.x,
    y: state.player.y,
    ...projectile
  });
}

function findNearestEnemy(state: BattleState): EnemyInstance | null {
  let best: EnemyInstance | null = null;
  let bestDistance = Infinity;
  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  return best;
}

function collideProjectile(state: BattleState, projectile: ProjectileInstance): void {
  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
    const cooldown = projectile.hitMemory[enemy.id] ?? 0;
    if (cooldown > 0) {
      continue;
    }
    if (distance > enemy.radius + projectile.radius) {
      continue;
    }
    applyDamageToEnemy(enemy, projectile.damage);
    spawnEffect(state, "hit", enemy.x, enemy.y, projectile.color, projectile.radius + 8, 0.18);
    triggerScreenShake(state, projectile.persistent ? 0.04 : 0.07, projectile.persistent ? 3 : 5);
    triggerHitstop(state, projectile.persistent ? 0.01 : 0.02);
    playSfx("hit");
    projectile.hitMemory[enemy.id] = projectile.persistent ? 0.28 : 999;
    if (!projectile.persistent) {
      projectile.pierce -= 1;
      if (projectile.pierce < 0) {
        projectile.life = 0;
        break;
      }
    }
  }
}

function updateHitMemory(projectile: ProjectileInstance, dt: number): void {
  for (const [enemyId, timer] of Object.entries(projectile.hitMemory)) {
    const next = timer - dt;
    if (next <= 0) {
      delete projectile.hitMemory[Number(enemyId)];
    } else {
      projectile.hitMemory[Number(enemyId)] = next;
    }
  }
}
