import type { BattleState, PickupOrb } from "./state";
import type { Vector2 } from "../core/types";
import { clamp, distance, normalize } from "../utils/math";
import { playSfx } from "../services/audio-service";
import { triggerHitstop, triggerScreenShake } from "./state";

export function updatePlayer(state: BattleState, move: Vector2, dt: number, width: number, height: number): void {
  const player = state.player;
  const velocity = normalize(move);
  const speed = player.speed * (1 + state.passives.moveSpeedBonus);
  player.x = clamp(player.x + velocity.x * speed * dt, 36, width - 36);
  player.y = clamp(player.y + velocity.y * speed * dt, 44, height - 36);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
}

export function updatePickupCollection(state: BattleState, dt: number): void {
  const pullRadius = state.player.pickupRadius * (1 + state.passives.pickupRangeBonus);
  const nextPickups: PickupOrb[] = [];
  for (const pickup of state.pickups) {
    pickup.life -= dt;
    const dist = distance(pickup, state.player);
    if (dist <= pullRadius) {
      const dir = normalize({ x: state.player.x - pickup.x, y: state.player.y - pickup.y });
      const pullSpeed = 180 + (pullRadius - dist) * 3;
      pickup.x += dir.x * pullSpeed * dt;
      pickup.y += dir.y * pullSpeed * dt;
    }
    if (dist <= state.player.radius + pickup.radius + 4) {
      grantXp(state, pickup.value);
      playSfx("pickup");
      continue;
    }
    if (pickup.life > 0) {
      nextPickups.push(pickup);
    }
  }
  state.pickups = nextPickups;
}

export function damagePlayer(state: BattleState, amount: number): void {
  const player = state.player;
  if (player.invincible || player.hurtTimer > 0) {
    return;
  }
  player.hp = Math.max(0, player.hp - amount);
  player.hurtTimer = 0.65;
  triggerScreenShake(state, 0.14, 8);
  triggerHitstop(state, 0.035);
  playSfx("hurt");
}

export function grantXp(state: BattleState, value: number): boolean {
  const player = state.player;
  player.xp += value;
  return player.xp >= player.xpToNext;
}
