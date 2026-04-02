import type { WeaponConfig } from "../core/types";

export const weaponConfigs: WeaponConfig[] = [
  {
    id: "paper-plane",
    name: "纸飞机齐射",
    description: "朝最近的敌人丢出纸飞机，升级后会分叉和穿透。",
    attackKind: "projectile",
    color: "#ffffff",
    levels: [
      { cooldown: 1.1, count: 1, damage: 20, speed: 360, radius: 10, pierce: 0 },
      { cooldown: 0.95, count: 2, damage: 24, speed: 390, radius: 10, pierce: 0 },
      { cooldown: 0.8, count: 2, damage: 30, speed: 420, radius: 11, pierce: 1 },
      { cooldown: 0.72, count: 3, damage: 36, speed: 440, radius: 11, pierce: 1 }
    ]
  },
  {
    id: "pencil",
    name: "铅笔穿刺",
    description: "笔尖直线突刺，适合清理成排敌人。",
    attackKind: "projectile",
    color: "#f7cf65",
    levels: [
      { cooldown: 1.9, count: 1, damage: 42, speed: 520, radius: 9, pierce: 2 },
      { cooldown: 1.6, count: 1, damage: 48, speed: 560, radius: 9, pierce: 3 },
      { cooldown: 1.35, count: 2, damage: 56, speed: 580, radius: 9, pierce: 3 }
    ]
  },
  {
    id: "chalk",
    name: "粉笔爆裂",
    description: "向周围弹出粉笔碎片，近身解围很强。",
    attackKind: "burst",
    color: "#fefefe",
    levels: [
      { cooldown: 2.8, count: 6, damage: 18, speed: 240, radius: 8, pierce: 0 },
      { cooldown: 2.4, count: 8, damage: 22, speed: 250, radius: 8, pierce: 0 },
      { cooldown: 2.0, count: 10, damage: 26, speed: 260, radius: 8, pierce: 1 }
    ]
  },
  {
    id: "textbook",
    name: "课本回旋",
    description: "围绕主角旋转的课本，能持续把怪物推开。",
    attackKind: "orbit",
    color: "#ff9f5b",
    levels: [
      { cooldown: 0.1, count: 1, damage: 18, radius: 16, orbitRadius: 64 },
      { cooldown: 0.1, count: 2, damage: 22, radius: 16, orbitRadius: 70 },
      { cooldown: 0.1, count: 3, damage: 26, radius: 16, orbitRadius: 78 }
    ]
  },
  {
    id: "eraser",
    name: "橡皮护盾",
    description: "生成会慢慢绕身的橡皮护盾，碰撞后造成额外击退。",
    attackKind: "shield",
    color: "#f5d7ef",
    levels: [
      { cooldown: 0.1, count: 2, damage: 14, radius: 14, orbitRadius: 42 },
      { cooldown: 0.1, count: 3, damage: 18, radius: 14, orbitRadius: 46 },
      { cooldown: 0.1, count: 4, damage: 22, radius: 14, orbitRadius: 50 }
    ]
  },
  {
    id: "ruler",
    name: "尺子横扫",
    description: "贴身挥出一圈尺子斩击，近战清场很强。",
    attackKind: "sweep",
    color: "#8ad0ff",
    levels: [
      { cooldown: 2.2, count: 1, damage: 28, radius: 18, orbitRadius: 58 },
      { cooldown: 1.85, count: 1, damage: 36, radius: 18, orbitRadius: 64 },
      { cooldown: 1.5, count: 2, damage: 42, radius: 18, orbitRadius: 68 }
    ]
  }
];

export function getWeaponConfig(id: string): WeaponConfig {
  const weapon = weaponConfigs.find((item) => item.id === id);
  if (!weapon) {
    throw new Error(`Unknown weapon: ${id}`);
  }
  return weapon;
}
