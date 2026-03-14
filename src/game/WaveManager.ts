import type { Vec3, SpawnPattern, WaveEntry } from '../types';
import { WAVE_SCHEDULES } from '../data/waveSchedules';

const STAGE_HALF = 24;
const MIN_SPAWN_DIST = 18;
const MAX_SPAWN_DIST = 23;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getWaveEntry(stageId: string, elapsedTime: number): WaveEntry {
  const schedule = WAVE_SCHEDULES[stageId] ?? WAVE_SCHEDULES['neon_district'];
  if (!schedule) {
    return {
      enemies: [{ id: 'nd_drone', weight: 1 }],
      spawnInterval: 2.0,
      maxSpawnCount: 3,
      hpMultiplier: 1.0,
      spawnPattern: 'ring',
    };
  }
  const minute = Math.min(Math.floor(elapsedTime / 60), schedule.waves.length - 1);
  return schedule.waves[minute]!;
}

export function getSpawnPositions(pattern: SpawnPattern, playerPos: Vec3, count: number): Vec3[] {
  const positions: Vec3[] = [];

  if (pattern === 'ring') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
      positions.push({
        x: clamp(playerPos.x + Math.cos(angle) * dist, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(playerPos.z + Math.sin(angle) * dist, -STAGE_HALF, STAGE_HALF),
      });
    }
  } else if (pattern === 'cluster') {
    const angle = Math.random() * Math.PI * 2;
    const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
    const centerX = playerPos.x + Math.cos(angle) * dist;
    const centerZ = playerPos.z + Math.sin(angle) * dist;
    for (let i = 0; i < count; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * 2;
      positions.push({
        x: clamp(centerX + Math.cos(offsetAngle) * offsetDist, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(centerZ + Math.sin(offsetAngle) * offsetDist, -STAGE_HALF, STAGE_HALF),
      });
    }
  } else {
    // line pattern
    const angle = Math.random() * Math.PI * 2;
    const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
    const centerX = playerPos.x + Math.cos(angle) * dist;
    const centerZ = playerPos.z + Math.sin(angle) * dist;
    const perpX = -Math.sin(angle);
    const perpZ = Math.cos(angle);
    const startOffset = -((count - 1) * 1.5) / 2;
    for (let i = 0; i < count; i++) {
      const offset = startOffset + i * 1.5;
      positions.push({
        x: clamp(centerX + perpX * offset, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(centerZ + perpZ * offset, -STAGE_HALF, STAGE_HALF),
      });
    }
  }

  return positions;
}
