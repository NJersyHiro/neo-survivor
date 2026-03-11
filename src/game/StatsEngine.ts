import type { ItemInstance, StatKey } from '../types';
import { ITEMS } from '../data/items';
import { UPGRADES } from '../data/upgrades';

export interface ComputedStats {
  might: number;
  armor: number;
  maxHp: number;
  recovery: number;
  speed: number;
  area: number;
  cooldown: number;
  amount: number;
  moveSpeed: number;
  magnet: number;
  luck: number;
  growth: number;
}

const STAT_KEYS: StatKey[] = [
  'might', 'armor', 'maxHp', 'recovery',
  'speed', 'area', 'cooldown', 'amount',
  'moveSpeed', 'magnet', 'luck', 'growth',
];

export function computePlayerStats(items: ItemInstance[], shopUpgrades?: Record<string, number>): ComputedStats {
  const stats: ComputedStats = {
    might: 0,
    armor: 0,
    maxHp: 0,
    recovery: 0,
    speed: 0,
    area: 0,
    cooldown: 0,
    amount: 0,
    moveSpeed: 0,
    magnet: 0,
    luck: 0,
    growth: 0,
  };

  for (const item of items) {
    const def = ITEMS[item.definitionId];
    if (!def) continue;

    for (const key of STAT_KEYS) {
      const bonus = def.stats[key];
      if (bonus !== undefined) {
        stats[key] += bonus * item.level;
      }
    }
  }

  if (shopUpgrades) {
    for (const [id, level] of Object.entries(shopUpgrades)) {
      const def = UPGRADES[id];
      if (!def || def.statKey === null) continue;
      stats[def.statKey] += def.bonusPerLevel * level;
    }
  }

  return stats;
}
