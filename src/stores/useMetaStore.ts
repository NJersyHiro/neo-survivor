import { create } from 'zustand';
import { SaveManager } from '../game/SaveManager';
import type { SaveData } from '../game/SaveManager';
import { UPGRADES, getUpgradeCost } from '../data/upgrades';
import { CHARACTERS, ALL_CHARACTER_IDS, MAX_CHARACTER_LEVEL, getCharacterUpgradeCost } from '../data/characters';
import { WEAPONS, BASE_WEAPON_IDS } from '../data/weapons';
import { ITEMS, ALL_ITEM_IDS } from '../data/items';
import { STAGES, ALL_STAGE_IDS } from '../data/stages';
import type { UnlockCondition } from '../types';

interface MetaStats {
  totalKills: number;
  totalRuns: number;
  totalTimePlayed: number;
  totalDamageTaken: number;
  totalBossKills: number;
  totalXPGemsCollected: number;
  bestTime: number;
  bestLevel: number;
  totalHPRecovered: number;
  bestCreditsInRun: number;
  hasEvolved: boolean;
  maxWeaponsHeld: number;
}

interface MetaState {
  credits: number;
  upgrades: Record<string, number>;
  stats: MetaStats;
  unlockedIds: string[];
  selectedCharacterId: string;
  characterLevels: Record<string, number>;
  unlockedWeaponIds: string[];
  unlockedItemIds: string[];
  unlockedStageIds: string[];
  hyperModeStageIds: string[];
  selectedStageId: string;
  perCharacterStats: Record<string, { bestTime: number }>;
  perWeaponStats: Record<string, { maxLevel: number }>;

  load: () => Promise<void>;
  addCredits: (amount: number) => void;
  purchaseUpgrade: (id: string) => boolean;
  recordRunStats: (kills: number, time: number, creditsEarned: number, extras: {
    damageTaken: number;
    bossKills: number;
    xpGemsCollected: number;
    playerLevel: number;
    hpRecovered: number;
    creditsEarned: number;
    maxWeaponsHeld: number;
    hasEvolved: boolean;
    characterId: string;
    weaponMaxLevels: Record<string, number>;
  }) => void;
  getUpgradeLevel: (id: string) => number;
  selectCharacter: (id: string) => void;
  unlockCharacter: (id: string) => boolean;
  upgradeCharacter: (id: string) => boolean;
  checkUnlocks: () => string[];
  checkAllUnlocks: () => string[];
  selectStage: (id: string) => void;
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
      totalHPRecovered: 0, bestCreditsInRun: 0, hasEvolved: false, maxWeaponsHeld: 0,
    } as MetaStats,
    unlockedIds: ['kai'],
    selectedCharacterId: 'kai',
    characterLevels: {} as Record<string, number>,
    unlockedWeaponIds: ['plasma_bolt'],
    unlockedItemIds: ['energy_cell', 'shield_matrix', 'magnet_implant'],
    unlockedStageIds: ['neon_district'],
    hyperModeStageIds: [] as string[],
    selectedStageId: 'neon_district',
    perCharacterStats: {} as Record<string, { bestTime: number }>,
    perWeaponStats: {} as Record<string, { maxLevel: number }>,
  };
}

function stateToSaveData(state: MetaState): SaveData {
  return {
    version: 3,
    credits: state.credits,
    upgrades: state.upgrades,
    stats: { ...state.stats },
    unlockedIds: [...state.unlockedIds],
    selectedCharacterId: state.selectedCharacterId,
    characterLevels: { ...state.characterLevels },
    unlockedWeaponIds: [...state.unlockedWeaponIds],
    unlockedItemIds: [...state.unlockedItemIds],
    unlockedStageIds: [...state.unlockedStageIds],
    hyperModeStageIds: [...state.hyperModeStageIds],
    selectedStageId: state.selectedStageId,
    perCharacterStats: { ...state.perCharacterStats },
    perWeaponStats: { ...state.perWeaponStats },
  };
}

function checkCondition(cond: UnlockCondition, state: MetaState): boolean {
  switch (cond.type) {
    case 'character_unlocked':
      return state.unlockedIds.includes(cond.characterId);
    case 'survive_time': {
      if (cond.characterId) {
        const cs = state.perCharacterStats[cond.characterId];
        return (cs?.bestTime ?? 0) >= cond.seconds;
      }
      return state.stats.bestTime >= cond.seconds;
    }
    case 'reach_level': {
      return state.stats.bestLevel >= cond.level;
    }
    case 'weapon_level': {
      const ws = state.perWeaponStats[cond.weaponId];
      return (ws?.maxLevel ?? 0) >= cond.level;
    }
    case 'total_kills':
      return state.stats.totalKills >= cond.count;
    case 'total_hp_recovered':
      return state.stats.totalHPRecovered >= cond.amount;
    case 'max_weapons_held':
      return (state.stats.maxWeaponsHeld ?? 0) >= cond.count;
    case 'any_weapon_max_level': {
      for (const ws of Object.values(state.perWeaponStats)) {
        if (ws.maxLevel >= 8) return true;
      }
      return false;
    }
    case 'any_weapon_evolved':
      return state.stats.hasEvolved;
    default:
      return false;
  }
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
        unlockedWeaponIds: data.unlockedWeaponIds ?? ['plasma_bolt'],
        unlockedItemIds: data.unlockedItemIds ?? ['energy_cell', 'shield_matrix', 'magnet_implant'],
        unlockedStageIds: data.unlockedStageIds ?? ['neon_district'],
        hyperModeStageIds: data.hyperModeStageIds ?? [],
        selectedStageId: data.selectedStageId ?? 'neon_district',
        perCharacterStats: data.perCharacterStats ?? {},
        perWeaponStats: data.perWeaponStats ?? {},
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
    set((state) => {
      const charStats = { ...state.perCharacterStats };
      const charEntry = charStats[extras.characterId] ?? { bestTime: 0 };
      charStats[extras.characterId] = { bestTime: Math.max(charEntry.bestTime, time) };

      const weaponStats = { ...state.perWeaponStats };
      for (const [wid, lvl] of Object.entries(extras.weaponMaxLevels)) {
        const cur = weaponStats[wid] ?? { maxLevel: 0 };
        weaponStats[wid] = { maxLevel: Math.max(cur.maxLevel, lvl) };
      }

      return {
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
          totalHPRecovered: state.stats.totalHPRecovered + extras.hpRecovered,
          bestCreditsInRun: Math.max(state.stats.bestCreditsInRun, extras.creditsEarned),
          hasEvolved: state.stats.hasEvolved || extras.hasEvolved,
          maxWeaponsHeld: Math.max(state.stats.maxWeaponsHeld ?? 0, extras.maxWeaponsHeld),
        },
        perCharacterStats: charStats,
        perWeaponStats: weaponStats,
      };
    });
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

  checkAllUnlocks: () => {
    const state = get();
    const newlyUnlocked: string[] = [];

    // Check character unlocks (existing logic)
    for (const id of ALL_CHARACTER_IDS) {
      if (state.unlockedIds.includes(id)) continue;
      const def = CHARACTERS[id];
      if (!def?.unlockCondition) continue;
      const statValue = state.stats[def.unlockCondition.stat as keyof MetaStats];
      if (typeof statValue === 'number' && statValue >= def.unlockCondition.threshold) {
        newlyUnlocked.push(id);
      }
    }

    // Check weapon unlocks
    const newWeapons: string[] = [];
    for (const id of BASE_WEAPON_IDS) {
      if (state.unlockedWeaponIds.includes(id)) continue;
      const def = WEAPONS[id];
      if (!def?.unlockCondition) { newWeapons.push(id); continue; }
      if (checkCondition(def.unlockCondition, state)) newWeapons.push(id);
    }

    // Check item unlocks
    const newItems: string[] = [];
    for (const id of ALL_ITEM_IDS) {
      if (state.unlockedItemIds.includes(id)) continue;
      const def = ITEMS[id];
      if (!def?.unlockCondition) { newItems.push(id); continue; }
      if (checkCondition(def.unlockCondition, state)) newItems.push(id);
    }

    // Check stage unlocks
    const newStages: string[] = [];
    for (const id of ALL_STAGE_IDS) {
      if (state.unlockedStageIds.includes(id)) continue;
      const def = STAGES[id];
      if (!def?.unlockCondition) { newStages.push(id); continue; }
      if (checkCondition(def.unlockCondition, state)) newStages.push(id);
    }

    // Apply unlocks
    const updatedCharIds = [...state.unlockedIds, ...newlyUnlocked];
    // Also auto-unlock weapons for newly unlocked characters
    for (const charId of newlyUnlocked) {
      const charDef = CHARACTERS[charId];
      if (charDef) {
        const wId = charDef.startingWeaponId;
        if (!state.unlockedWeaponIds.includes(wId) && !newWeapons.includes(wId)) {
          newWeapons.push(wId);
        }
      }
    }

    if (newlyUnlocked.length > 0 || newWeapons.length > 0 || newItems.length > 0 || newStages.length > 0) {
      set({
        unlockedIds: updatedCharIds,
        unlockedWeaponIds: [...state.unlockedWeaponIds, ...newWeapons],
        unlockedItemIds: [...state.unlockedItemIds, ...newItems],
        unlockedStageIds: [...state.unlockedStageIds, ...newStages],
      });
      void SaveManager.save(stateToSaveData(get()));
    }

    return [...newlyUnlocked, ...newWeapons, ...newItems, ...newStages];
  },

  selectStage: (id) => {
    set({ selectedStageId: id });
    void SaveManager.save(stateToSaveData(get()));
  },

  resetAll: () => {
    set(createDefaultState());
    void SaveManager.clear();
  },
}));
