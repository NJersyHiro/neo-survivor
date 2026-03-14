export type FloorItemType = 'heal' | 'magnet' | 'xp_bomb' | 'nuke' | 'gold_bag';

export interface FloorItemDefinition {
  id: FloorItemType;
  name: string;
  color: string;
  emissive: string;
  dropWeight: number;
}

export const FLOOR_ITEMS: Record<FloorItemType, FloorItemDefinition> = {
  heal: {
    id: 'heal',
    name: 'Repair Kit',
    color: '#00ff44',
    emissive: '#00ff44',
    dropWeight: 35,
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet Pulse',
    color: '#4488ff',
    emissive: '#4488ff',
    dropWeight: 25,
  },
  xp_bomb: {
    id: 'xp_bomb',
    name: 'Data Core',
    color: '#00ff88',
    emissive: '#00ff88',
    dropWeight: 20,
  },
  gold_bag: {
    id: 'gold_bag',
    name: 'Credit Chip',
    color: '#ffdd00',
    emissive: '#ffdd00',
    dropWeight: 15,
  },
  nuke: {
    id: 'nuke',
    name: 'EMP Blast',
    color: '#ff4444',
    emissive: '#ff4444',
    dropWeight: 5,
  },
};

/** Base drop chance per enemy kill (percentage). Luck stat increases this. */
export const BASE_DROP_CHANCE = 1.5;

/** Boss guaranteed drop count */
export const BOSS_DROP_COUNT = 2;

export function rollFloorItemDrop(luck: number, isBoss: boolean, dropRateMultiplier = 1): FloorItemType | null {
  const chance = BASE_DROP_CHANCE * (1 + luck / 100) * dropRateMultiplier;
  if (!isBoss && Math.random() * 100 >= chance) return null;

  const entries = Object.values(FLOOR_ITEMS);
  const totalWeight = entries.reduce((sum, e) => sum + e.dropWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.dropWeight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]!.id;
}
