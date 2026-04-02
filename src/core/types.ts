export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MoveInput {
  getVector(): Vector2;
  destroy(): void;
}

export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface SceneHost {
  setScene(scene: Scene): void;
}

export interface AppContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  overlayRoot: HTMLDivElement;
  hudRoot: HTMLDivElement;
  touchIndicator: HTMLDivElement;
  viewport: Vector2;
  getUiRects(): Rect[];
}

export type EnemyAi = "chase" | "dash" | "orbit";
export type WeaponAttackKind = "orbit" | "projectile" | "burst" | "shield" | "sweep";
export type UpgradeKind = "weapon" | "passive";

export interface WeaponLevelConfig {
  cooldown: number;
  count?: number;
  damage: number;
  speed?: number;
  radius?: number;
  pierce?: number;
  orbitRadius?: number;
  sweepArc?: number;
}

export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  attackKind: WeaponAttackKind;
  color: string;
  levels: WeaponLevelConfig[];
}

export interface CharacterConfig {
  id: string;
  name: string;
  bodyColor: string;
  accentColor: string;
  faceFrameColor: string;
  faceFrameShape: "circle";
}

export interface EnemyConfig {
  id: string;
  name: string;
  ai: EnemyAi;
  radius: number;
  speed: number;
  maxHp: number;
  damage: number;
  color: string;
  xp: number;
  elite?: boolean;
  boss?: boolean;
  dashCooldown?: number;
  orbitDistance?: number;
  phases?: Array<{ hpRatio: number; spawnBurst: number }>;
}

export interface MapConfig {
  id: string;
  name: string;
  skyColor: string;
  grassColor: string;
  trackColor: string;
  decorationColor: string;
}

export interface UpgradeOption {
  id: string;
  kind: UpgradeKind;
  label: string;
  description: string;
  value?: number;
  weaponId?: string;
}

export interface RunSummary {
  duration: number;
  defeats: number;
  level: number;
  victory: boolean;
  bestDuration: number;
}
