import type { StatKey } from '../types';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  statKey: StatKey | null;
  bonusPerLevel: number;
  baseCost: number;
  maxLevel: number;
}

export const UPGRADES: Record<string, UpgradeDefinition> = {
  power_core: {
    id: 'power_core',
    name: 'Power Core',
    description: 'Permanently increases all damage dealt.',
    statKey: 'might',
    bonusPerLevel: 5,
    baseCost: 40,
    maxLevel: 5,
  },
  plating: {
    id: 'plating',
    name: 'Plating',
    description: 'Permanently reduces incoming damage.',
    statKey: 'armor',
    bonusPerLevel: 1,
    baseCost: 40,
    maxLevel: 5,
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    description: 'Permanently increases maximum health.',
    statKey: 'maxHp',
    bonusPerLevel: 8,
    baseCost: 50,
    maxLevel: 5,
  },
  regenerator: {
    id: 'regenerator',
    name: 'Regenerator',
    description: 'Permanently regenerates health each second.',
    statKey: 'recovery',
    bonusPerLevel: 0.2,
    baseCost: 50,
    maxLevel: 5,
  },
  thrusters: {
    id: 'thrusters',
    name: 'Thrusters',
    description: 'Permanently increases movement speed.',
    statKey: 'moveSpeed',
    bonusPerLevel: 5,
    baseCost: 30,
    maxLevel: 5,
  },
  overclocking: {
    id: 'overclocking',
    name: 'Overclocking',
    description: 'Permanently reduces weapon cooldowns.',
    statKey: 'cooldown',
    bonusPerLevel: -3,
    baseCost: 60,
    maxLevel: 5,
  },
  sensor_array: {
    id: 'sensor_array',
    name: 'Sensor Array',
    description: 'Permanently increases weapon area of effect.',
    statKey: 'area',
    bonusPerLevel: 5,
    baseCost: 40,
    maxLevel: 5,
  },
  tractor_beam: {
    id: 'tractor_beam',
    name: 'Tractor Beam',
    description: 'Permanently increases XP gem pickup range.',
    statKey: 'magnet',
    bonusPerLevel: 10,
    baseCost: 30,
    maxLevel: 5,
  },
  data_miner: {
    id: 'data_miner',
    name: 'Data Miner',
    description: 'Permanently increases XP gained.',
    statKey: 'growth',
    bonusPerLevel: 5,
    baseCost: 30,
    maxLevel: 5,
  },
  fortune_chip: {
    id: 'fortune_chip',
    name: 'Fortune Chip',
    description: 'Permanently increases luck.',
    statKey: 'luck',
    bonusPerLevel: 5,
    baseCost: 20,
    maxLevel: 5,
  },
  extra_reroll: {
    id: 'extra_reroll',
    name: 'Extra Reroll',
    description: 'Gain additional rerolls at the start of each run.',
    statKey: null,
    bonusPerLevel: 1,
    baseCost: 60,
    maxLevel: 5,
  },
  revival_kit: {
    id: 'revival_kit',
    name: 'Revival Kit',
    description: 'Revive once per run at 30% HP when killed.',
    statKey: null,
    bonusPerLevel: 1,
    baseCost: 80,
    maxLevel: 1,
  },
};

export const ALL_UPGRADE_IDS = Object.keys(UPGRADES);

export function getUpgradeCost(id: string, level: number): number {
  const def = UPGRADES[id];
  if (!def) return Infinity;
  return def.baseCost * level;
}
