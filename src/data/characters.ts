import type { StatKey } from '../types';

export const MAX_CHARACTER_LEVEL = 5;
export const CHARACTER_UPGRADE_COST_PER_LEVEL = 500;

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  startingWeaponId: string;
  baseStats: Partial<Record<StatKey, number>>;
  unlockCondition: {
    stat: string;
    threshold: number;
    description: string;
  } | null;
  creditCost: number;
}

export const CHARACTERS: Record<string, CharacterDefinition> = {
  kai: {
    id: 'kai',
    name: 'Kai',
    description: 'Balanced operative. No weaknesses, no extremes.',
    startingWeaponId: 'plasma_bolt',
    baseStats: { maxHp: 100 },
    unlockCondition: null,
    creditCost: 0,
  },
  vex: {
    id: 'vex',
    name: 'Vex',
    description: 'Lightning-fast melee specialist. Fragile but elusive.',
    startingWeaponId: 'neon_whip',
    baseStats: { maxHp: 85, moveSpeed: 20, luck: 10 },
    unlockCondition: { stat: 'bestTime', threshold: 300, description: 'Survive 5 minutes in a single run' },
    creditCost: 0,
  },
  rhea: {
    id: 'rhea',
    name: 'Rhea',
    description: 'Area denial expert. Wide attacks, slow movement.',
    startingWeaponId: 'cyber_shuriken',
    baseStats: { maxHp: 100, might: 10, area: 15, moveSpeed: -10 },
    unlockCondition: { stat: 'totalKills', threshold: 300, description: 'Kill 300 total enemies' },
    creditCost: 0,
  },
  zion: {
    id: 'zion',
    name: 'Zion',
    description: 'Precision marksman. Devastating damage, narrow focus.',
    startingWeaponId: 'pulse_rifle',
    baseStats: { maxHp: 90, might: 25, area: -20 },
    unlockCondition: { stat: 'bestLevel', threshold: 15, description: 'Reach level 15 in a single run' },
    creditCost: 0,
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    description: 'Drone commander. Faster cooldowns, reduced direct power.',
    startingWeaponId: 'blade_drone',
    baseStats: { maxHp: 100, cooldown: -20, might: -10, recovery: 0.2 },
    unlockCondition: { stat: 'totalRuns', threshold: 10, description: 'Complete 10 runs' },
    creditCost: 0,
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'Heavy assault unit. Absorbs punishment, slow and steady.',
    startingWeaponId: 'ion_orbit',
    baseStats: { maxHp: 130, armor: 2, recovery: 0.3, moveSpeed: -15, area: 10 },
    unlockCondition: { stat: 'totalDamageTaken', threshold: 1000, description: 'Take 1,000 total damage' },
    creditCost: 0,
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    description: 'Glass cannon. Extreme damage output, paper-thin defenses.',
    startingWeaponId: 'volt_chain',
    baseStats: { maxHp: 75, might: 30 },
    unlockCondition: { stat: 'totalBossKills', threshold: 1, description: 'Kill a boss enemy' },
    creditCost: 0,
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    description: 'Resource optimizer. Attracts more loot, grows faster.',
    startingWeaponId: 'gravity_bomb',
    baseStats: { maxHp: 95, magnet: 25, growth: 15, might: -10, luck: 10 },
    unlockCondition: { stat: 'totalXPGemsCollected', threshold: 500, description: 'Collect 500 total XP gems' },
    creditCost: 0,
  },
};

export const ALL_CHARACTER_IDS = Object.keys(CHARACTERS);

export function getCharacterUpgradeCost(level: number): number {
  return CHARACTER_UPGRADE_COST_PER_LEVEL * level;
}
