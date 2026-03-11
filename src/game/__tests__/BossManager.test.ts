import { describe, it, expect } from 'vitest';
import { shouldSpawnBoss, getBossSpawnMinutes } from '../BossManager';

describe('BossManager', () => {
  it('returns boss spawn minutes', () => {
    expect(getBossSpawnMinutes().length).toBeGreaterThan(0);
  });

  it('spawns boss at minute 3', () => {
    expect(shouldSpawnBoss(180, 179)).toBe(true);
  });

  it('does not spawn boss mid-minute', () => {
    expect(shouldSpawnBoss(90, 89)).toBe(false);
  });

  it('spawns boss at minute 5', () => {
    expect(shouldSpawnBoss(300, 299)).toBe(true);
  });

  it('does not re-trigger for same minute', () => {
    expect(shouldSpawnBoss(181, 180)).toBe(false);
  });
});
