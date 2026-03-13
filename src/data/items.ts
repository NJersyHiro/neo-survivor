import type { ItemDefinition } from '../types';

export const ITEMS: Record<string, ItemDefinition> = {
  energy_cell: {
    id: 'energy_cell',
    name: 'Energy Cell',
    description: 'Increases might, boosting all damage dealt.',
    category: 'stat',
    maxLevel: 5,
    stats: { might: 10 },
    unlockCondition: null,
  },
  shield_matrix: {
    id: 'shield_matrix',
    name: 'Shield Matrix',
    description: 'Increases armor, reducing incoming damage.',
    category: 'stat',
    maxLevel: 5,
    stats: { armor: 1 },
    unlockCondition: null,
  },
  targeting_chip: {
    id: 'targeting_chip',
    name: 'Targeting Chip',
    description: 'Reduces weapon cooldowns for faster attacks.',
    category: 'stat',
    maxLevel: 5,
    stats: { cooldown: -5 },
    unlockCondition: { type: 'weapon_level', weaponId: 'pulse_rifle', level: 4, description: 'Get Pulse Rifle to Lv 4' },
  },
  nano_repair: {
    id: 'nano_repair',
    name: 'Nano Repair',
    description: 'Passively regenerates health over time.',
    category: 'healing',
    maxLevel: 5,
    stats: { recovery: 0.3 },
    unlockCondition: { type: 'survive_time', seconds: 60, description: 'Survive 1 minute' },
  },
  cyber_boots: {
    id: 'cyber_boots',
    name: 'Cyber Boots',
    description: 'Increases movement speed.',
    category: 'stat',
    maxLevel: 5,
    stats: { moveSpeed: 8 },
    unlockCondition: { type: 'reach_level', level: 5, description: 'Reach Level 5' },
  },
  magnet_implant: {
    id: 'magnet_implant',
    name: 'Magnet Implant',
    description: 'Increases XP gem pickup range.',
    category: 'utility',
    maxLevel: 5,
    stats: { magnet: 20 },
    unlockCondition: null,
  },
  growth_serum: {
    id: 'growth_serum',
    name: 'Growth Serum',
    description: 'Increases XP gained from all sources.',
    category: 'utility',
    maxLevel: 5,
    stats: { growth: 8 },
    unlockCondition: { type: 'reach_level', level: 10, description: 'Reach Level 10' },
  },
  holo_armor: {
    id: 'holo_armor',
    name: 'Holo Armor',
    description: 'Increases maximum health.',
    category: 'healing',
    maxLevel: 5,
    stats: { maxHp: 15 },
    unlockCondition: { type: 'survive_time', seconds: 300, characterId: 'tank', description: 'Survive 5 minutes as Tank' },
  },

  // --- Phase 4A items ---
  crit_module: {
    id: 'crit_module', name: 'Crit Module', description: 'Increases critical hit chance.',
    category: 'stat', maxLevel: 5, stats: { critChance: 8 },
    unlockCondition: { type: 'survive_time', seconds: 600, characterId: 'sage', description: 'Survive 10 minutes as Sage' },
  },
  reflux_core: {
    id: 'reflux_core', name: 'Reflux Core', description: 'Heals a portion of damage dealt.',
    category: 'stat', maxLevel: 5, stats: { lifesteal: 5 },
    unlockCondition: { type: 'total_hp_recovered', amount: 1000, description: 'Recover 1,000 HP total' },
  },
  phase_cloak: {
    id: 'phase_cloak', name: 'Phase Cloak', description: 'Extends invincibility after taking damage.',
    category: 'utility', maxLevel: 5, stats: {},
    unlockCondition: { type: 'survive_time', seconds: 900, description: 'Survive 15 minutes' },
  },
  ammo_belt: {
    id: 'ammo_belt', name: 'Ammo Belt', description: 'Increases projectile count for all weapons.',
    category: 'stat', maxLevel: 3, stats: { amount: 1 },
    unlockCondition: { type: 'max_weapons_held', count: 6, description: 'Hold 6 weapons at once' },
  },
  razor_wire: {
    id: 'razor_wire', name: 'Razor Wire', description: 'Damages enemies that touch the player.',
    category: 'utility', maxLevel: 5, stats: {},
    unlockCondition: { type: 'total_kills', count: 5000, description: 'Defeat 5,000 enemies total' },
  },
  quantum_lens: {
    id: 'quantum_lens', name: 'Quantum Lens', description: 'Increases projectile speed.',
    category: 'stat', maxLevel: 5, stats: { speed: 10 },
    unlockCondition: { type: 'any_weapon_max_level', description: 'Get any weapon to max level' },
  },
  overclock_chip: {
    id: 'overclock_chip', name: 'Overclock Chip', description: 'Boosts area and reduces cooldowns.',
    category: 'stat', maxLevel: 3, stats: { area: 8, cooldown: -8 },
    unlockCondition: { type: 'any_weapon_evolved', description: 'Evolve any weapon' },
  },
};

export const ALL_ITEM_IDS = Object.keys(ITEMS);
