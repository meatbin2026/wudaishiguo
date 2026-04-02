import type { Vector2 } from "../core/types";
import type { BattleState, EnemyInstance } from "./state";
import { normalize, subtract } from "../utils/math";
import { damagePlayer } from "./player";

export function updateEnemies(state: BattleState, dt: number): void {
  for (const enemy of state.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    updateEnemyMovement(enemy, state.player, dt);
    const distanceToPlayer = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distanceToPlayer <= enemy.radius + state.player.radius) {
      damagePlayer(state, enemy.config.damage);
    }
  }
}

export function applyDamageToEnemy(enemy: EnemyInstance, damage: number): void {
  enemy.hp -= damage;
  enemy.hitFlash = 1;
}

function updateEnemyMovement(enemy: EnemyInstance, player: Vector2, dt: number): void {
  const towardPlayer = normalize(subtract(player, enemy));
  switch (enemy.config.ai) {
    case "chase": {
      enemy.x += towardPlayer.x * enemy.config.speed * dt;
      enemy.y += towardPlayer.y * enemy.config.speed * dt;
      break;
    }
    case "dash": {
      enemy.dashTimer -= dt;
      if (enemy.dashTimer <= 0) {
        enemy.dashTimer = enemy.config.dashCooldown ?? 2.4;
        enemy.dashVector = towardPlayer;
      }
      const dashMultiplier = enemy.dashTimer > (enemy.config.dashCooldown ?? 2.4) - 0.35 ? 3.2 : 1;
      const dashVector = enemy.dashVector ?? towardPlayer;
      enemy.x += dashVector.x * enemy.config.speed * dashMultiplier * dt;
      enemy.y += dashVector.y * enemy.config.speed * dashMultiplier * dt;
      break;
    }
    case "orbit": {
      const orbitDistance = enemy.config.orbitDistance ?? 90;
      const offset = subtract(enemy, player);
      const currentDistance = Math.hypot(offset.x, offset.y);
      const tangent = normalize({ x: -towardPlayer.y, y: towardPlayer.x });
      const pull = currentDistance > orbitDistance ? towardPlayer : { x: -towardPlayer.x * 0.3, y: -towardPlayer.y * 0.3 };
      enemy.x += (tangent.x * enemy.config.speed + pull.x * enemy.config.speed * 0.75) * dt;
      enemy.y += (tangent.y * enemy.config.speed + pull.y * enemy.config.speed * 0.75) * dt;
      break;
    }
  }
}
