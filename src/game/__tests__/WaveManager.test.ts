import { describe, it, expect } from 'vitest';
import { getWaveEntry, getSpawnPositions } from '../WaveManager';

describe('getWaveEntry', () => {
  it('returns minute 0 wave for time 0', () => {
    const entry = getWaveEntry('neon_district', 0);
    expect(entry.spawnInterval).toBe(2.0);
    expect(entry.maxSpawnCount).toBe(3);
    expect(entry.enemies[0]!.id).toBe('nd_drone');
  });

  it('returns minute 3 wave at 180s', () => {
    const entry = getWaveEntry('neon_district', 180);
    expect(entry.bossId).toBe('nd_boss');
  });

  it('clamps to minute 29 for times >= 1740', () => {
    const entry = getWaveEntry('neon_district', 1800);
    expect(entry.maxSpawnCount).toBe(20);
  });

  it('returns correct wave for data_mines stage', () => {
    const entry = getWaveEntry('data_mines', 0);
    expect(entry.enemies[0]!.id).toBe('dm_crawler');
  });

  it('falls back to neon_district for unknown stageId', () => {
    const entry = getWaveEntry('unknown_stage', 0);
    expect(entry.enemies[0]!.id).toBe('nd_drone');
  });
});

describe('getSpawnPositions', () => {
  const playerPos = { x: 0, y: 0, z: 0 };

  it('returns correct count of positions for ring', () => {
    const positions = getSpawnPositions('ring', playerPos, 5);
    expect(positions).toHaveLength(5);
  });

  it('ring positions are 18-23 units from player', () => {
    const positions = getSpawnPositions('ring', playerPos, 10);
    for (const p of positions) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z);
      expect(dist).toBeGreaterThanOrEqual(17);
      expect(dist).toBeLessThanOrEqual(25);
    }
  });

  it('cluster positions are within 2 units of each other', () => {
    const positions = getSpawnPositions('cluster', playerPos, 5);
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i]!.x - positions[0]!.x;
      const dz = positions[i]!.z - positions[0]!.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      expect(dist).toBeLessThanOrEqual(4);
    }
  });

  it('line positions are spaced 1.5 units apart', () => {
    const positions = getSpawnPositions('line', playerPos, 3);
    expect(positions).toHaveLength(3);
    const dx = positions[1]!.x - positions[0]!.x;
    const dz = positions[1]!.z - positions[0]!.z;
    const spacing = Math.sqrt(dx * dx + dz * dz);
    expect(spacing).toBeCloseTo(1.5, 0);
  });

  it('clamps positions to stage bounds', () => {
    const edgePos = { x: 22, y: 0, z: 22 };
    const positions = getSpawnPositions('ring', edgePos, 10);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(-24);
      expect(p.x).toBeLessThanOrEqual(24);
      expect(p.z).toBeGreaterThanOrEqual(-24);
      expect(p.z).toBeLessThanOrEqual(24);
    }
  });
});
