import { describe, it, expect, beforeEach } from 'vitest';
import { useMetaStore } from '../useMetaStore';

describe('useMetaStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMetaStore.getState().resetAll();
  });

  it('initializes with kai unlocked and selected', () => {
    const state = useMetaStore.getState();
    expect(state.unlockedIds).toContain('kai');
    expect(state.selectedCharacterId).toBe('kai');
    expect(state.characterLevels).toEqual({});
  });

  it('selectCharacter updates selectedCharacterId', () => {
    useMetaStore.setState({ unlockedIds: ['kai', 'vex'] });
    useMetaStore.getState().selectCharacter('vex');
    expect(useMetaStore.getState().selectedCharacterId).toBe('vex');
  });

  it('unlockCharacter adds to unlockedIds (all characters are free)', () => {
    useMetaStore.setState({ credits: 2000 });
    const result = useMetaStore.getState().unlockCharacter('vex');
    expect(result).toBe(true);
    expect(useMetaStore.getState().unlockedIds).toContain('vex');
    expect(useMetaStore.getState().credits).toBe(2000);
  });

  it('unlockCharacter fails if character does not exist', () => {
    useMetaStore.setState({ credits: 100 });
    const result = useMetaStore.getState().unlockCharacter('nonexistent_character');
    expect(result).toBe(false);
  });

  it('unlockCharacter fails if already unlocked', () => {
    useMetaStore.setState({ credits: 5000, unlockedIds: ['kai', 'vex'] });
    const result = useMetaStore.getState().unlockCharacter('vex');
    expect(result).toBe(false);
  });

  it('upgradeCharacter increments level and deducts credits', () => {
    useMetaStore.setState({ credits: 1000, unlockedIds: ['kai'] });
    const result = useMetaStore.getState().upgradeCharacter('kai');
    expect(result).toBe(true);
    expect(useMetaStore.getState().characterLevels.kai).toBe(1);
    expect(useMetaStore.getState().credits).toBe(500);
  });

  it('upgradeCharacter fails at max level', () => {
    useMetaStore.setState({
      credits: 10000, unlockedIds: ['kai'],
      characterLevels: { kai: 5 },
    });
    const result = useMetaStore.getState().upgradeCharacter('kai');
    expect(result).toBe(false);
  });

  it('upgradeCharacter fails if not unlocked', () => {
    useMetaStore.setState({ credits: 10000 });
    const result = useMetaStore.getState().upgradeCharacter('vex');
    expect(result).toBe(false);
  });

  it('recordRunStats updates new lifetime stats', () => {
    useMetaStore.getState().recordRunStats(10, 300, 50, {
      damageTaken: 100, bossKills: 1, xpGemsCollected: 50, playerLevel: 8,
      hpRecovered: 0, creditsEarned: 50, maxWeaponsHeld: 1,
      hasEvolved: false, characterId: 'kai', weaponMaxLevels: {},
    });
    const stats = useMetaStore.getState().stats;
    expect(stats.totalDamageTaken).toBe(100);
    expect(stats.totalBossKills).toBe(1);
    expect(stats.totalXPGemsCollected).toBe(50);
    expect(stats.bestTime).toBe(300);
    expect(stats.bestLevel).toBe(8);
  });

  it('recordRunStats keeps best values via Math.max', () => {
    useMetaStore.getState().recordRunStats(10, 600, 50, {
      damageTaken: 0, bossKills: 0, xpGemsCollected: 0, playerLevel: 20,
      hpRecovered: 0, creditsEarned: 50, maxWeaponsHeld: 1,
      hasEvolved: false, characterId: 'kai', weaponMaxLevels: {},
    });
    useMetaStore.getState().recordRunStats(10, 200, 50, {
      damageTaken: 0, bossKills: 0, xpGemsCollected: 0, playerLevel: 5,
      hpRecovered: 0, creditsEarned: 50, maxWeaponsHeld: 1,
      hasEvolved: false, characterId: 'kai', weaponMaxLevels: {},
    });
    expect(useMetaStore.getState().stats.bestTime).toBe(600);
    expect(useMetaStore.getState().stats.bestLevel).toBe(20);
  });

  it('recordRunStats updates new v3 stats', () => {
    useMetaStore.getState().recordRunStats(5, 120, 30, {
      damageTaken: 50, bossKills: 0, xpGemsCollected: 20, playerLevel: 3,
      hpRecovered: 75, creditsEarned: 30, maxWeaponsHeld: 2,
      hasEvolved: true, characterId: 'kai', weaponMaxLevels: { plasma_bolt: 4 },
    });
    const state = useMetaStore.getState();
    expect(state.stats.totalHPRecovered).toBe(75);
    expect(state.stats.bestCreditsInRun).toBe(30);
    expect(state.stats.hasEvolved).toBe(true);
    expect(state.stats.maxWeaponsHeld).toBe(2);
    expect(state.perCharacterStats['kai']?.bestTime).toBe(120);
    expect(state.perWeaponStats['plasma_bolt']?.maxLevel).toBe(4);
  });

  it('checkUnlocks returns newly unlocked character IDs', () => {
    useMetaStore.setState({
      stats: {
        totalKills: 500, totalRuns: 15, totalTimePlayed: 5000,
        totalDamageTaken: 2000, totalBossKills: 3, totalXPGemsCollected: 600,
        bestTime: 600, bestLevel: 20,
        totalHPRecovered: 0, bestCreditsInRun: 0, hasEvolved: false, maxWeaponsHeld: 1,
      },
      unlockedIds: ['kai'],
    });
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    expect(newlyUnlocked).toHaveLength(7);
    expect(useMetaStore.getState().unlockedIds).toHaveLength(8);
  });

  it('checkUnlocks returns empty array when nothing new to unlock', () => {
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    expect(newlyUnlocked).toEqual([]);
  });

  it('checkAllUnlocks unlocks weapons when character is unlocked', () => {
    useMetaStore.setState({
      stats: {
        totalKills: 500, totalRuns: 15, totalTimePlayed: 5000,
        totalDamageTaken: 2000, totalBossKills: 3, totalXPGemsCollected: 600,
        bestTime: 600, bestLevel: 20,
        totalHPRecovered: 0, bestCreditsInRun: 0, hasEvolved: false, maxWeaponsHeld: 1,
      },
      unlockedIds: ['kai'],
      unlockedWeaponIds: ['plasma_bolt'],
      unlockedItemIds: ['energy_cell', 'shield_matrix', 'magnet_implant'],
      unlockedStageIds: ['neon_district'],
    });
    const unlocked = useMetaStore.getState().checkAllUnlocks();
    // Characters should be unlocked, and their weapons too
    expect(useMetaStore.getState().unlockedIds.length).toBeGreaterThan(1);
    expect(unlocked.length).toBeGreaterThan(0);
  });
});
