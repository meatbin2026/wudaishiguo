import type { EnemyConfig } from "../core/types";

export const normalEnemies: EnemyConfig[] = [
  {
    id: "worksheet",
    name: "作业本怪",
    ai: "chase",
    radius: 16,
    speed: 62,
    maxHp: 38,
    damage: 8,
    color: "#fff9dc",
    xp: 10
  },
  {
    id: "paper-ball",
    name: "试卷团怪",
    ai: "chase",
    radius: 12,
    speed: 94,
    maxHp: 22,
    damage: 6,
    color: "#e7f0ff",
    xp: 8
  },
  {
    id: "alarm-clock",
    name: "闹钟怪",
    ai: "dash",
    radius: 15,
    speed: 58,
    maxHp: 48,
    damage: 10,
    color: "#ffd45a",
    xp: 12,
    dashCooldown: 2.8
  },
  {
    id: "eraser-monster",
    name: "橡皮擦怪",
    ai: "orbit",
    radius: 14,
    speed: 74,
    maxHp: 42,
    damage: 8,
    color: "#f6b9dd",
    xp: 10,
    orbitDistance: 88
  }
];

export const eliteEnemy: EnemyConfig = {
  id: "pencil-elite",
  name: "铅笔刺球",
  ai: "dash",
  radius: 22,
  speed: 72,
  maxHp: 220,
  damage: 16,
  color: "#ff915b",
  xp: 72,
  elite: true,
  dashCooldown: 1.6
};

export const bossEnemy: EnemyConfig = {
  id: "blackboard-boss",
  name: "黑板 Boss",
  ai: "chase",
  radius: 54,
  speed: 48,
  maxHp: 1800,
  damage: 26,
  color: "#355b4d",
  xp: 360,
  boss: true,
  phases: [
    { hpRatio: 0.7, spawnBurst: 6 },
    { hpRatio: 0.35, spawnBurst: 10 }
  ]
};
