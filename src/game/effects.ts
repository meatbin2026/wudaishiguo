import type { BattleState, EffectInstance } from "./state";
import { nextEntityId } from "./state";

export function spawnEffect(
  state: BattleState,
  kind: EffectInstance["kind"],
  x: number,
  y: number,
  color: string,
  radius = 16,
  life = 0.35
): void {
  state.effects.push({
    id: nextEntityId(state),
    kind,
    x,
    y,
    color,
    radius,
    life,
    maxLife: life
  });
}

export function updateEffects(state: BattleState, dt: number): void {
  state.effects = state.effects.filter((effect) => {
    effect.life -= dt;
    return effect.life > 0;
  });

  state.shakeTimer = Math.max(0, state.shakeTimer - dt);
  if (state.shakeTimer <= 0) {
    state.shakeMagnitude = 0;
  }
  state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
}
