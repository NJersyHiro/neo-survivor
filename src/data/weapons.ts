import type { WeaponDefinition } from '../types';

export const WEAPONS: Record<string, WeaponDefinition> = {
  plasma_bolt: {
    id: 'plasma_bolt',
    name: 'Plasma Bolt',
    description: 'A focused bolt of superheated plasma.',
    category: 'ranged',
    baseDamage: 10,
    cooldown: 1.0,
    projectileSpeed: 15,
    area: 0,
    pierce: 1,
    amount: 1,
    maxLevel: 8,
    damagePerLevel: 3,
  },
  neon_whip: {
    id: 'neon_whip',
    name: 'Neon Whip',
    description: 'A crackling whip of neon energy that slashes all nearby foes.',
    category: 'melee',
    baseDamage: 15,
    cooldown: 1.3,
    projectileSpeed: 0,
    area: 2.5,
    pierce: 999,
    amount: 1,
    maxLevel: 8,
    damagePerLevel: 4,
  },
  cyber_shuriken: {
    id: 'cyber_shuriken',
    name: 'Cyber Shuriken',
    description: 'Throwing stars that pierce through multiple targets.',
    category: 'multishot',
    baseDamage: 8,
    cooldown: 1.5,
    projectileSpeed: 10,
    area: 0,
    pierce: 3,
    amount: 2,
    maxLevel: 8,
    damagePerLevel: 2,
  },
};

export const STARTING_WEAPON_ID = 'plasma_bolt';
export const ALL_WEAPON_IDS = Object.keys(WEAPONS);
