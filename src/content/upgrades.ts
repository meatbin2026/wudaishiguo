import type { UpgradeOption } from "../core/types";

export const passiveUpgrades: UpgradeOption[] = [
  {
    id: "move-speed-up",
    kind: "passive",
    label: "课间冲刺",
    description: "移动速度提升 12%。",
    value: 0.12
  },
  {
    id: "attack-rate-up",
    kind: "passive",
    label: "专注状态",
    description: "所有武器冷却降低 10%。",
    value: 0.1
  },
  {
    id: "damage-up",
    kind: "passive",
    label: "优等生火力",
    description: "所有武器伤害提高 14%。",
    value: 0.14
  },
  {
    id: "pickup-range-up",
    kind: "passive",
    label: "课代表磁场",
    description: "拾取范围提升 20%。",
    value: 0.2
  },
  {
    id: "max-hp-up",
    kind: "passive",
    label: "体育加分",
    description: "最大体力 +20，并立刻回复 20 体力。",
    value: 20
  },
  {
    id: "snack-break",
    kind: "passive",
    label: "课间补给",
    description: "立即回复 30 体力，并获得短暂缓冲。",
    value: 30
  }
];
