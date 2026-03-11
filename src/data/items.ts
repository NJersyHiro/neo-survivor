import type { ItemDefinition } from '../types';

export const ITEMS: Record<string, ItemDefinition> = {
  energy_cell: {
    id: 'energy_cell',
    name: 'Energy Cell',
    description: 'Increases might, boosting all damage dealt.',
    category: 'stat',
    maxLevel: 5,
    stats: { might: 10 },
  },
  shield_matrix: {
    id: 'shield_matrix',
    name: 'Shield Matrix',
    description: 'Increases armor, reducing incoming damage.',
    category: 'stat',
    maxLevel: 5,
    stats: { armor: 1 },
  },
  targeting_chip: {
    id: 'targeting_chip',
    name: 'Targeting Chip',
    description: 'Reduces weapon cooldowns for faster attacks.',
    category: 'stat',
    maxLevel: 5,
    stats: { cooldown: -5 },
  },
  nano_repair: {
    id: 'nano_repair',
    name: 'Nano Repair',
    description: 'Passively regenerates health over time.',
    category: 'healing',
    maxLevel: 5,
    stats: { recovery: 0.3 },
  },
  cyber_boots: {
    id: 'cyber_boots',
    name: 'Cyber Boots',
    description: 'Increases movement speed.',
    category: 'stat',
    maxLevel: 5,
    stats: { moveSpeed: 8 },
  },
  magnet_implant: {
    id: 'magnet_implant',
    name: 'Magnet Implant',
    description: 'Increases XP gem pickup range.',
    category: 'utility',
    maxLevel: 5,
    stats: { magnet: 20 },
  },
  growth_serum: {
    id: 'growth_serum',
    name: 'Growth Serum',
    description: 'Increases XP gained from all sources.',
    category: 'utility',
    maxLevel: 5,
    stats: { growth: 8 },
  },
  holo_armor: {
    id: 'holo_armor',
    name: 'Holo Armor',
    description: 'Increases maximum health.',
    category: 'healing',
    maxLevel: 5,
    stats: { maxHp: 15 },
  },
};

export const ALL_ITEM_IDS = Object.keys(ITEMS);
