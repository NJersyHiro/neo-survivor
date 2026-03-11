import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../SaveManager';
import type { SaveData } from '../SaveManager';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no save exists', async () => {
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });

  it('saves and loads data correctly', async () => {
    const saveData: SaveData = {
      version: 1, credits: 500, upgrades: { power_core: 3 },
      stats: { totalKills: 100, totalRuns: 5, totalTimePlayed: 3000 },
      unlockedIds: [],
    };
    await SaveManager.save(saveData);
    const loaded = await SaveManager.load();
    expect(loaded).toEqual(saveData);
  });

  it('clear removes save data', async () => {
    await SaveManager.save({
      version: 1, credits: 100, upgrades: {},
      stats: { totalKills: 0, totalRuns: 0, totalTimePlayed: 0 },
      unlockedIds: [],
    });
    await SaveManager.clear();
    expect(await SaveManager.load()).toBeNull();
  });

  it('returns null for corrupted data', async () => {
    localStorage.setItem('neo_survivor_save', 'not-json');
    expect(await SaveManager.load()).toBeNull();
  });

  it('returns null for wrong version', async () => {
    localStorage.setItem('neo_survivor_save', JSON.stringify({ version: 999 }));
    expect(await SaveManager.load()).toBeNull();
  });
});
