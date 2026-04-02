import { passiveUpgrades } from "../content/upgrades";
import { weaponConfigs } from "../content/weapons";
import { pickRandom, shuffle } from "../core/random";
import type { UpgradeOption } from "../core/types";
import type { BattleState } from "./state";

export function rollUpgradeChoices(state: BattleState, count: number): UpgradeOption[] {
  const weaponOptions: UpgradeOption[] = [];
  const passiveOptions: UpgradeOption[] = [];

  for (const weapon of weaponConfigs) {
    const currentLevel = state.activeWeapons[weapon.id];
    if (currentLevel === undefined) {
      weaponOptions.push({
        id: `unlock:${weapon.id}`,
        kind: "weapon",
        label: `解锁 ${weapon.name}`,
        description: weapon.description,
        weaponId: weapon.id
      });
      continue;
    }
    if (currentLevel < weapon.levels.length - 1) {
      weaponOptions.push({
        id: `upgrade:${weapon.id}:${currentLevel + 1}`,
        kind: "weapon",
        label: `${weapon.name} Lv.${currentLevel + 2}`,
        description: weapon.description,
        weaponId: weapon.id
      });
    }
  }

  const hpRatio = state.player.hp / state.player.maxHp;
  for (const passive of passiveUpgrades) {
    if (passive.id === "snack-break" && hpRatio > 0.68) {
      continue;
    }
    passiveOptions.push(passive);
  }

  const choices: UpgradeOption[] = [];
  const activeWeaponCount = Object.keys(state.activeWeapons).length;
  const prioritizeWeapons = activeWeaponCount < 3 || state.player.level <= 4;

  if (prioritizeWeapons && weaponOptions.length > 0) {
    choices.push(pickDistinctOption(weaponOptions, choices));
  }

  if (passiveOptions.length > 0) {
    choices.push(pickDistinctOption(passiveOptions, choices));
  }

  const remainingPool = shuffle([...weaponOptions, ...passiveOptions]).filter(
    (option) => !choices.some((choice) => choice.id === option.id)
  );

  while (choices.length < count && remainingPool.length > 0) {
    const next = remainingPool.shift();
    if (next) {
      choices.push(next);
    }
  }

  return choices;
}

export function applyUpgrade(state: BattleState, option: UpgradeOption): void {
  if (option.weaponId) {
    const currentLevel = state.activeWeapons[option.weaponId];
    if (currentLevel === undefined) {
      state.activeWeapons[option.weaponId] = 0;
      state.weaponCooldowns[option.weaponId] = 0;
      return;
    }
    state.activeWeapons[option.weaponId] += 1;
    state.weaponCooldowns[option.weaponId] = 0;
    return;
  }

  switch (option.id) {
    case "move-speed-up":
      state.passives.moveSpeedBonus += option.value ?? 0;
      break;
    case "attack-rate-up":
      state.passives.attackRateBonus += option.value ?? 0;
      break;
    case "pickup-range-up":
      state.passives.pickupRangeBonus += option.value ?? 0;
      break;
    case "damage-up":
      state.passives.damageBonus += option.value ?? 0;
      break;
    case "max-hp-up":
      state.player.maxHp += option.value ?? 0;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + (option.value ?? 0));
      break;
    case "snack-break":
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + (option.value ?? 0));
      state.player.hurtTimer = Math.max(state.player.hurtTimer, 1.1);
      break;
    default:
      break;
  }
}

function pickDistinctOption(options: UpgradeOption[], selected: UpgradeOption[]): UpgradeOption {
  const available = options.filter((option) => !selected.some((choice) => choice.id === option.id));
  return pickRandom(available.length > 0 ? available : options);
}
