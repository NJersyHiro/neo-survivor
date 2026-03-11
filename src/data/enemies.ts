import type { EnemyDefinition } from '../types';

export const ENEMIES: Record<string, EnemyDefinition> = {
  drone: {
    id: 'drone',
    name: 'Drone',
    hp: 20,
    damage: 5,
    speed: 2.5,
    xpValue: 1,
    color: '#ff3366',
    emissive: '#ff1144',
    scale: 0.5,
  },
};

export const SWARMER_ID = 'drone';
