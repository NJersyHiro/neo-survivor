export interface AugmentDefinition {
  id: string;
  name: string;
  description: string;
}

export const AUGMENTS: Record<string, AugmentDefinition> = {
  nano_heal: {
    id: 'nano_heal',
    name: 'Nano Heal',
    description: 'Healing also damages nearby enemies for 50% of amount healed.',
  },
  data_surge: {
    id: 'data_surge',
    name: 'Data Surge',
    description: 'XP gems explode on pickup, dealing 20 damage to nearby enemies.',
  },
  ricochet_protocol: {
    id: 'ricochet_protocol',
    name: 'Ricochet Protocol',
    description: 'Ranged projectiles gain +2 pierce.',
  },
  critical_overload: {
    id: 'critical_overload',
    name: 'Critical Overload',
    description: 'Critical hits deal 3x damage instead of 2x.',
  },
  quantum_field: {
    id: 'quantum_field',
    name: 'Quantum Field',
    description: 'Weapon area increased by 30%.',
  },
  overclock_burst: {
    id: 'overclock_burst',
    name: 'Overclock Burst',
    description: 'All weapon cooldowns reduced by 15%.',
  },
  scavenger_core: {
    id: 'scavenger_core',
    name: 'Scavenger Core',
    description: 'Enemies drop 50% more credits.',
  },
  magnetic_storm: {
    id: 'magnetic_storm',
    name: 'Magnetic Storm',
    description: 'Magnet range doubled.',
  },
  adrenaline_rush: {
    id: 'adrenaline_rush',
    name: 'Adrenaline Rush',
    description: 'Move 20% faster when HP is below 50%.',
  },
  berserker_chip: {
    id: 'berserker_chip',
    name: 'Berserker Chip',
    description: 'Deal 30% more damage when HP is below 30%.',
  },
  shield_generator: {
    id: 'shield_generator',
    name: 'Shield Generator',
    description: 'Gain +3 armor.',
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: 'Multishot weapons fire +1 additional projectile.',
  },
  vampiric_edge: {
    id: 'vampiric_edge',
    name: 'Vampiric Edge',
    description: 'Gain 3% lifesteal on all damage dealt.',
  },
  xp_amplifier: {
    id: 'xp_amplifier',
    name: 'XP Amplifier',
    description: 'XP gained increased by 25%.',
  },
  lucky_star: {
    id: 'lucky_star',
    name: 'Lucky Star',
    description: 'Floor item drop rate doubled.',
  },
  second_wind: {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'Recover 1% max HP per second.',
  },
  glass_cannon: {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Deal 40% more damage but take 20% more damage.',
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'Melee kills have 25% chance to deal 50% damage to a nearby enemy.',
  },
  fortify: {
    id: 'fortify',
    name: 'Fortify',
    description: 'Max HP increased by 20%.',
  },
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Bosses drop 2 chests instead of 1.',
  },
};

export const ALL_AUGMENT_IDS = Object.keys(AUGMENTS);

/** Minutes at which augment selection is offered */
export const AUGMENT_OFFER_TIMES = [0, 11, 21];

/** Max augments per run */
export const MAX_AUGMENTS_PER_RUN = 3;
