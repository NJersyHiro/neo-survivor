import type { Vec3 } from '../types';

const BASE_SPAWN_COUNT = 3;
const MAX_SPAWN_COUNT = 15;
const SPAWN_DISTANCE = 18;
const STAGE_HALF = 24;

export function getSpawnCount(elapsedTime: number): number {
  const bonus = Math.floor(elapsedTime / 30);
  return Math.min(BASE_SPAWN_COUNT + bonus, MAX_SPAWN_COUNT);
}

export function getSpawnPosition(playerPos: Vec3): Vec3 {
  const angle = Math.random() * Math.PI * 2;
  const dist = SPAWN_DISTANCE + Math.random() * 5;
  let x = playerPos.x + Math.cos(angle) * dist;
  let z = playerPos.z + Math.sin(angle) * dist;
  x = Math.max(-STAGE_HALF, Math.min(STAGE_HALF, x));
  z = Math.max(-STAGE_HALF, Math.min(STAGE_HALF, z));
  return { x, y: 0, z };
}

export function getEnemyTypeForTime(elapsedTime: number): string {
  if (elapsedTime < 60) return 'drone';
  if (elapsedTime < 180) return Math.random() < 0.7 ? 'drone' : 'speeder';
  return Math.random() < 0.5 ? 'drone' : Math.random() < 0.5 ? 'speeder' : 'tank';
}

export const SPAWN_INTERVAL = 2.0;
