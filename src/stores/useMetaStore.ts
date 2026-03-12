import { create } from 'zustand';
import { SaveManager } from '../game/SaveManager';
import type { SaveData } from '../game/SaveManager';
import { UPGRADES, getUpgradeCost } from '../data/upgrades';
import { CHARACTERS, ALL_CHARACTER_IDS, MAX_CHARACTER_LEVEL, getCharacterUpgradeCost } from '../data/characters';

interface MetaStats {
  totalKills: number;
  totalRuns: number;
  totalTimePlayed: number;
  totalDamageTaken: number;
  totalBossKills: number;
  totalXPGemsCollected: number;
  bestTime: number;
  bestLevel: number;
}

interface MetaState {
  credits: number;
  upgrades: Record<string, number>;
  stats: MetaStats;
  unlockedIds: string[];
  selectedCharacterId: string;
  characterLevels: Record<string, number>;

  load: () => Promise<void>;
  addCredits: (amount: number) => void;
  purchaseUpgrade: (id: string) => boolean;
  recordRunStats: (kills: number, time: number, creditsEarned: number, extras: {
    damageTaken: number;
    bossKills: number;
    xpGemsCollected: number;
    playerLevel: number;
  }) => void;
  getUpgradeLevel: (id: string) => number;
  selectCharacter: (id: string) => void;
  unlockCharacter: (id: string) => boolean;
  upgradeCharacter: (id: string) => boolean;
  checkUnlocks: () => string[];
  resetAll: () => void;
}

function createDefaultState() {
  return {
    credits: 0,
    upgrades: {} as Record<string, number>,
    stats: {
      totalKills: 0, totalRuns: 0, totalTimePlayed: 0,
      totalDamageTaken: 0, totalBossKills: 0, totalXPGemsCollected: 0,
      bestTime: 0, bestLevel: 0,
    } as MetaStats,
    unlockedIds: ['kai'],
    selectedCharacterId: 'kai',
    characterLevels: {} as Record<string, number>,
  };
}

function stateToSaveData(state: MetaState): SaveData {
  return {
    version: 2,
    credits: state.credits,
    upgrades: state.upgrades,
    stats: { ...state.stats },
    unlockedIds: [...state.unlockedIds],
    selectedCharacterId: state.selectedCharacterId,
    characterLevels: { ...state.characterLevels },
  };
}

export const useMetaStore = create<MetaState>()((set, get) => ({
  ...createDefaultState(),

  load: async () => {
    const data = await SaveManager.load();
    if (data) {
      set({
        credits: data.credits,
        upgrades: data.upgrades,
        stats: data.stats,
        unlockedIds: data.unlockedIds.length > 0 ? data.unlockedIds : ['kai'],
        selectedCharacterId: data.selectedCharacterId ?? 'kai',
        characterLevels: data.characterLevels ?? {},
      });
    }
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
    void SaveManager.save(stateToSaveData(get()));
  },

  purchaseUpgrade: (id) => {
    const state = get();
    const def = UPGRADES[id];
    if (!def) return false;
    const currentLevel = state.upgrades[id] ?? 0;
    if (currentLevel >= def.maxLevel) return false;
    const cost = getUpgradeCost(id, currentLevel + 1);
    if (state.credits < cost) return false;
    set({
      credits: state.credits - cost,
      upgrades: { ...state.upgrades, [id]: currentLevel + 1 },
    });
    void SaveManager.save(stateToSaveData(get()));
    return true;
  },

  recordRunStats: (kills, time, creditsEarned, extras) => {
    set((state) => ({
      credits: state.credits + creditsEarned,
      stats: {
        totalKills: state.stats.totalKills + kills,
        totalRuns: state.stats.totalRuns + 1,
        totalTimePlayed: state.stats.totalTimePlayed + time,
        totalDamageTaken: state.stats.totalDamageTaken + extras.damageTaken,
        totalBossKills: state.stats.totalBossKills + extras.bossKills,
        totalXPGemsCollected: state.stats.totalXPGemsCollected + extras.xpGemsCollected,
        bestTime: Math.max(state.stats.bestTime, time),
        bestLevel: Math.max(state.stats.bestLevel, extras.playerLevel),
      },
    }));
    void SaveManager.save(stateToSaveData(get()));
  },

  getUpgradeLevel: (id) => get().upgrades[id] ?? 0,

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
    void SaveManager.save(stateToSaveData(get()));
  },

  unlockCharacter: (id) => {
    const state = get();
    const def = CHARACTERS[id];
    if (!def) return false;
    if (state.unlockedIds.includes(id)) return false;
    if (state.credits < def.creditCost) return false;
    set({
      credits: state.credits - def.creditCost,
      unlockedIds: [...state.unlockedIds, id],
    });
    void SaveManager.save(stateToSaveData(get()));
    return true;
  },

  upgradeCharacter: (id) => {
    const state = get();
    if (!state.unlockedIds.includes(id)) return false;
    const currentLevel = state.characterLevels[id] ?? 0;
    if (currentLevel >= MAX_CHARACTER_LEVEL) return false;
    const cost = getCharacterUpgradeCost(currentLevel + 1);
    if (state.credits < cost) return false;
    set({
      credits: state.credits - cost,
      characterLevels: { ...state.characterLevels, [id]: currentLevel + 1 },
    });
    void SaveManager.save(stateToSaveData(get()));
    return true;
  },

  checkUnlocks: () => {
    const state = get();
    const newlyUnlocked: string[] = [];
    for (const id of ALL_CHARACTER_IDS) {
      if (state.unlockedIds.includes(id)) continue;
      const def = CHARACTERS[id];
      if (!def || !def.unlockCondition) continue;
      const statValue = state.stats[def.unlockCondition.stat as keyof MetaStats];
      if (typeof statValue === 'number' && statValue >= def.unlockCondition.threshold) {
        newlyUnlocked.push(id);
      }
    }
    if (newlyUnlocked.length > 0) {
      set({ unlockedIds: [...state.unlockedIds, ...newlyUnlocked] });
      void SaveManager.save(stateToSaveData(get()));
    }
    return newlyUnlocked;
  },

  resetAll: () => {
    set(createDefaultState());
    void SaveManager.clear();
  },
}));
