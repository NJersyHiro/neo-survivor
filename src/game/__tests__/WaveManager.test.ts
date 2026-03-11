import { describe, it, expect } from 'vitest';
import { getSpawnCount, getSpawnPosition } from '../WaveManager';

describe('WaveManager', () => {
  describe('getSpawnCount', () => {
    it('returns 3 at time 0', () => {
      expect(getSpawnCount(0)).toBe(3);
    });

    it('increases over time', () => {
      expect(getSpawnCount(120)).toBeGreaterThan(getSpawnCount(0));
    });

    it('caps at 15', () => {
      expect(getSpawnCount(600)).toBeLessThanOrEqual(15);
    });
  });

  describe('getSpawnPosition', () => {
    it('returns position at least 15 units from origin', () => {
      const pos = getSpawnPosition({ x: 0, y: 0, z: 0 });
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      // Spawn distance is 18-23, but clamping to ±24 could reduce it
      // At minimum the raw distance is 18, so from origin it should be >= 15
      expect(dist).toBeGreaterThanOrEqual(15);
    });

    it('stays within ±25', () => {
      for (let i = 0; i < 50; i++) {
        const pos = getSpawnPosition({ x: 0, y: 0, z: 0 });
        expect(pos.x).toBeGreaterThanOrEqual(-25);
        expect(pos.x).toBeLessThanOrEqual(25);
        expect(pos.z).toBeGreaterThanOrEqual(-25);
        expect(pos.z).toBeLessThanOrEqual(25);
      }
    });
  });
});
