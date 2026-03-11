import { describe, it, expect } from 'vitest';
import { shouldSpawnBoss, getBossSpawnMinutes } from '../BossManager';

describe('BossManager', () => {
  it('returns boss spawn minutes', () => {
    expect(getBossSpawnMinutes().length).toBeGreaterThan(0);
  });

  it('spawns boss at minute 2', () => {
    expect(shouldSpawnBoss(120, 119)).toBe(true);
  });

  it('does not spawn boss mid-minute', () => {
    expect(shouldSpawnBoss(90, 89)).toBe(false);
  });

  it('spawns boss at minute 4', () => {
    expect(shouldSpawnBoss(240, 239)).toBe(true);
  });

  it('does not re-trigger for same minute', () => {
    expect(shouldSpawnBoss(121, 120)).toBe(false);
  });
});
