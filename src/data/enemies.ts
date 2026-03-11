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
  speeder: {
    id: 'speeder',
    name: 'Speeder',
    hp: 10,
    damage: 3,
    speed: 5.0,
    xpValue: 2,
    color: '#00ff88',
    emissive: '#00cc66',
    scale: 0.35,
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    hp: 80,
    damage: 10,
    speed: 1.2,
    xpValue: 5,
    color: '#8844ff',
    emissive: '#6622cc',
    scale: 0.8,
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    hp: 500,
    damage: 15,
    speed: 1.5,
    xpValue: 20,
    color: '#ff8800',
    emissive: '#ff6600',
    scale: 1.2,
    isBoss: true,
    bossScale: 2.5,
  },
};

export const SWARMER_ID = 'drone';
