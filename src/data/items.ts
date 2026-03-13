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

  // --- Phase 4A items ---
  crit_module: {
    id: 'crit_module', name: 'Crit Module', description: 'Increases critical hit chance.',
    category: 'stat', maxLevel: 5, stats: { critChance: 8 },
  },
  reflux_core: {
    id: 'reflux_core', name: 'Reflux Core', description: 'Heals a portion of damage dealt.',
    category: 'stat', maxLevel: 5, stats: { lifesteal: 5 },
  },
  phase_cloak: {
    id: 'phase_cloak', name: 'Phase Cloak', description: 'Extends invincibility after taking damage.',
    category: 'utility', maxLevel: 5, stats: {},
  },
  ammo_belt: {
    id: 'ammo_belt', name: 'Ammo Belt', description: 'Increases projectile count for all weapons.',
    category: 'stat', maxLevel: 3, stats: { amount: 1 },
  },
  razor_wire: {
    id: 'razor_wire', name: 'Razor Wire', description: 'Damages enemies that touch the player.',
    category: 'utility', maxLevel: 5, stats: {},
  },
  quantum_lens: {
    id: 'quantum_lens', name: 'Quantum Lens', description: 'Increases projectile speed.',
    category: 'stat', maxLevel: 5, stats: { speed: 10 },
  },
  overclock_chip: {
    id: 'overclock_chip', name: 'Overclock Chip', description: 'Boosts area and reduces cooldowns.',
    category: 'stat', maxLevel: 3, stats: { area: 8, cooldown: -8 },
  },
};

export const ALL_ITEM_IDS = Object.keys(ITEMS);
