import { describe, it, expect, beforeEach } from 'vitest';
import { useMetaStore } from '../useMetaStore';

describe('useMetaStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMetaStore.getState().resetAll();
  });

  it('initializes with zero credits and empty upgrades', () => {
    const state = useMetaStore.getState();
    expect(state.credits).toBe(0);
    expect(state.upgrades).toEqual({});
    expect(state.stats.totalKills).toBe(0);
    expect(state.stats.totalRuns).toBe(0);
  });

  it('addCredits increases balance', () => {
    useMetaStore.getState().addCredits(100);
    expect(useMetaStore.getState().credits).toBe(100);
  });

  it('purchaseUpgrade deducts credits and increments level', () => {
    useMetaStore.getState().addCredits(1000);
    const success = useMetaStore.getState().purchaseUpgrade('power_core');
    expect(success).toBe(true);
    expect(useMetaStore.getState().getUpgradeLevel('power_core')).toBe(1);
    expect(useMetaStore.getState().credits).toBe(960); // 1000 - 40*1
  });

  it('purchaseUpgrade fails with insufficient credits', () => {
    useMetaStore.getState().addCredits(10);
    const success = useMetaStore.getState().purchaseUpgrade('power_core');
    expect(success).toBe(false);
    expect(useMetaStore.getState().getUpgradeLevel('power_core')).toBe(0);
  });

  it('purchaseUpgrade fails when maxed', () => {
    useMetaStore.getState().addCredits(100000);
    useMetaStore.getState().purchaseUpgrade('revival_kit'); // max 1
    const success = useMetaStore.getState().purchaseUpgrade('revival_kit');
    expect(success).toBe(false);
    expect(useMetaStore.getState().getUpgradeLevel('revival_kit')).toBe(1);
  });

  it('recordRunStats accumulates lifetime stats and credits', () => {
    useMetaStore.getState().recordRunStats(50, 300, 150);
    const state = useMetaStore.getState();
    expect(state.stats.totalKills).toBe(50);
    expect(state.stats.totalRuns).toBe(1);
    expect(state.stats.totalTimePlayed).toBe(300);
    expect(state.credits).toBe(150);
  });

  it('load hydrates from SaveManager', async () => {
    localStorage.setItem('neo_survivor_save', JSON.stringify({
      version: 1, credits: 500, upgrades: { power_core: 2 },
      stats: { totalKills: 200, totalRuns: 10, totalTimePlayed: 6000 },
      unlockedIds: [],
    }));
    await useMetaStore.getState().load();
    expect(useMetaStore.getState().credits).toBe(500);
    expect(useMetaStore.getState().getUpgradeLevel('power_core')).toBe(2);
    expect(useMetaStore.getState().stats.totalRuns).toBe(10);
  });
});
