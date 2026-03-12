import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../SaveManager';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no save exists', async () => {
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });

  it('loads v2 save data correctly', async () => {
    const saveData = {
      version: 2,
      credits: 500,
      upgrades: { power_core: 2 },
      stats: {
        totalKills: 100, totalRuns: 5, totalTimePlayed: 3000,
        totalDamageTaken: 200, totalBossKills: 2, totalXPGemsCollected: 150,
        bestTime: 600, bestLevel: 12,
      },
      unlockedIds: ['kai', 'vex'],
      selectedCharacterId: 'vex',
      characterLevels: { kai: 3, vex: 1 },
    };
    localStorage.setItem('neo_survivor_save', JSON.stringify(saveData));
    const data = await SaveManager.load();
    expect(data).not.toBeNull();
    expect(data!.version).toBe(2);
    expect(data!.selectedCharacterId).toBe('vex');
    expect(data!.characterLevels).toEqual({ kai: 3, vex: 1 });
  });

  it('migrates v1 save data to v2', async () => {
    const v1Data = {
      version: 1,
      credits: 300,
      upgrades: { power_core: 1 },
      stats: { totalKills: 50, totalRuns: 3, totalTimePlayed: 1500 },
      unlockedIds: [],
    };
    localStorage.setItem('neo_survivor_save', JSON.stringify(v1Data));
    const data = await SaveManager.load();
    expect(data).not.toBeNull();
    expect(data!.version).toBe(2);
    expect(data!.credits).toBe(300);
    expect(data!.stats.totalDamageTaken).toBe(0);
    expect(data!.stats.totalBossKills).toBe(0);
    expect(data!.stats.totalXPGemsCollected).toBe(0);
    expect(data!.stats.bestTime).toBe(0);
    expect(data!.stats.bestLevel).toBe(0);
    expect(data!.selectedCharacterId).toBe('kai');
    expect(data!.characterLevels).toEqual({});
    expect(data!.unlockedIds).toContain('kai');
  });

  it('returns null for unknown future version', async () => {
    const futureData = { version: 99, credits: 0 };
    localStorage.setItem('neo_survivor_save', JSON.stringify(futureData));
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });

  it('returns null for corrupted data', async () => {
    localStorage.setItem('neo_survivor_save', 'not json');
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });

  it('save and load roundtrip works', async () => {
    const saveData = {
      version: 2 as const,
      credits: 100,
      upgrades: {},
      stats: {
        totalKills: 0, totalRuns: 0, totalTimePlayed: 0,
        totalDamageTaken: 0, totalBossKills: 0, totalXPGemsCollected: 0,
        bestTime: 0, bestLevel: 0,
      },
      unlockedIds: ['kai'],
      selectedCharacterId: 'kai',
      characterLevels: {},
    };
    await SaveManager.save(saveData);
    const loaded = await SaveManager.load();
    expect(loaded).toEqual(saveData);
  });
});
