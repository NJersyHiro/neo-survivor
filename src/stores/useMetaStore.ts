import { create } from 'zustand';
import { SaveManager } from '../game/SaveManager';
import type { SaveData } from '../game/SaveManager';
import { UPGRADES, getUpgradeCost } from '../data/upgrades';

interface MetaState {
  credits: number;
  upgrades: Record<string, number>;
  stats: {
    totalKills: number;
    totalRuns: number;
    totalTimePlayed: number;
  };
  unlockedIds: string[];

  load: () => Promise<void>;
  addCredits: (amount: number) => void;
  purchaseUpgrade: (id: string) => boolean;
  recordRunStats: (kills: number, time: number, creditsEarned: number) => void;
  getUpgradeLevel: (id: string) => number;
  resetAll: () => void;
}

function createDefaultState() {
  return {
    credits: 0,
    upgrades: {} as Record<string, number>,
    stats: { totalKills: 0, totalRuns: 0, totalTimePlayed: 0 },
    unlockedIds: [] as string[],
  };
}

function stateToSaveData(state: MetaState): SaveData {
  return {
    version: 1,
    credits: state.credits,
    upgrades: state.upgrades,
    stats: { ...state.stats },
    unlockedIds: [...state.unlockedIds],
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
        unlockedIds: data.unlockedIds,
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

  recordRunStats: (kills, time, creditsEarned) => {
    set((state) => ({
      credits: state.credits + creditsEarned,
      stats: {
        totalKills: state.stats.totalKills + kills,
        totalRuns: state.stats.totalRuns + 1,
        totalTimePlayed: state.stats.totalTimePlayed + time,
      },
    }));
    void SaveManager.save(stateToSaveData(get()));
  },

  getUpgradeLevel: (id) => get().upgrades[id] ?? 0,

  resetAll: () => {
    set(createDefaultState());
    void SaveManager.clear();
  },
}));
