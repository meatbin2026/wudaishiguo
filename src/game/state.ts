import type { EnemyConfig, Vector2, WeaponAttackKind } from "../core/types";

export interface PlayerState extends Vector2 {
  radius: number;
  maxHp: number;
  hp: number;
  speed: number;
  pickupRadius: number;
  xp: number;
  xpToNext: number;
  level: number;
  invincible: boolean;
  hurtTimer: number;
}

export interface EnemyInstance extends Vector2 {
  id: number;
  config: EnemyConfig;
  radius: number;
  hp: number;
  maxHp: number;
  dashTimer: number;
  dashVector: Vector2 | null;
  phaseIndex: number;
  hitFlash: number;
}

export interface ProjectileInstance extends Vector2 {
  id: number;
  weaponId: string;
  attackKind: WeaponAttackKind;
  radius: number;
  damage: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  pierce: number;
  persistent: boolean;
  orbitRadius: number;
  orbitSpeed: number;
  slotIndex: number;
  slotCount: number;
  angle: number;
  hitMemory: Record<number, number>;
}

export interface PickupOrb extends Vector2 {
  id: number;
  radius: number;
  value: number;
  life: number;
}

export interface EffectInstance extends Vector2 {
  id: number;
  kind: "hit" | "level-up" | "pickup" | "boss-warning";
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

export interface HazardInstance extends Vector2 {
  id: number;
  kind: "chalk-zone" | "shockwave";
  radius: number;
  targetRadius: number;
  life: number;
  maxLife: number;
  damage: number;
  triggered: boolean;
}

export interface PassiveState {
  moveSpeedBonus: number;
  attackRateBonus: number;
  pickupRangeBonus: number;
  damageBonus: number;
}

export interface BattleState {
  time: number;
  defeats: number;
  paused: boolean;
  completed: boolean;
  bossSpawned: boolean;
  bossDefeated: boolean;
  nextId: number;
  spawnTimer: number;
  eliteTimer: number;
  bossWarningTimer: number;
  bossAttackTimer: number;
  hitstopTimer: number;
  shakeTimer: number;
  shakeMagnitude: number;
  player: PlayerState;
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  pickups: PickupOrb[];
  effects: EffectInstance[];
  hazards: HazardInstance[];
  activeWeapons: Record<string, number>;
  weaponCooldowns: Record<string, number>;
  passives: PassiveState;
}

export function createInitialBattleState(viewport: Vector2): BattleState {
  return {
    time: 0,
    defeats: 0,
    paused: false,
    completed: false,
    bossSpawned: false,
    bossDefeated: false,
    nextId: 1,
    spawnTimer: 0,
    eliteTimer: 30,
    bossWarningTimer: 0,
    bossAttackTimer: 4.5,
    hitstopTimer: 0,
    shakeTimer: 0,
    shakeMagnitude: 0,
    player: {
      x: viewport.x / 2,
      y: viewport.y / 2,
      radius: 24,
      maxHp: 100,
      hp: 100,
      speed: 180,
      pickupRadius: 78,
      xp: 0,
      xpToNext: 28,
      level: 1,
      invincible: false,
      hurtTimer: 0
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    hazards: [],
    activeWeapons: {
      "paper-plane": 0
    },
    weaponCooldowns: {},
    passives: {
      moveSpeedBonus: 0,
      attackRateBonus: 0,
      pickupRangeBonus: 0,
      damageBonus: 0
    }
  };
}

export function nextEntityId(state: BattleState): number {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

export function triggerHitstop(state: BattleState, duration: number): void {
  state.hitstopTimer = Math.max(state.hitstopTimer, duration);
}

export function triggerScreenShake(state: BattleState, duration: number, magnitude: number): void {
  state.shakeTimer = Math.max(state.shakeTimer, duration);
  state.shakeMagnitude = Math.max(state.shakeMagnitude, magnitude);
}
