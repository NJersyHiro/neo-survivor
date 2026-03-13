const STORAGE_KEY = 'neo_survivor_save';
const CURRENT_VERSION = 3;

export interface SaveData {
  version: number;
  credits: number;
  upgrades: Record<string, number>;
  stats: {
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
  };
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
}

function migrateV1ToV2(data: Record<string, unknown>): SaveData {
  const stats = (data.stats ?? {}) as Record<string, number>;
  const unlockedIds = (data.unlockedIds ?? []) as string[];
  if (!unlockedIds.includes('kai')) {
    unlockedIds.push('kai');
  }
  return {
    version: 2,
    credits: (data.credits as number) ?? 0,
    upgrades: (data.upgrades as Record<string, number>) ?? {},
    stats: {
      totalKills: stats.totalKills ?? 0,
      totalRuns: stats.totalRuns ?? 0,
      totalTimePlayed: stats.totalTimePlayed ?? 0,
      totalDamageTaken: stats.totalDamageTaken ?? 0,
      totalBossKills: stats.totalBossKills ?? 0,
      totalXPGemsCollected: stats.totalXPGemsCollected ?? 0,
      bestTime: stats.bestTime ?? 0,
      bestLevel: stats.bestLevel ?? 0,
      totalHPRecovered: 0,
      bestCreditsInRun: 0,
      hasEvolved: false,
      maxWeaponsHeld: 0,
    },
    unlockedIds,
    selectedCharacterId: 'kai',
    characterLevels: {},
    unlockedWeaponIds: ['plasma_bolt'],
    unlockedItemIds: ['energy_cell', 'shield_matrix', 'magnet_implant'],
    unlockedStageIds: ['neon_district'],
    hyperModeStageIds: [],
    selectedStageId: 'neon_district',
    perCharacterStats: {},
    perWeaponStats: {},
  };
}

function migrateV2ToV3(data: SaveData): SaveData {
  const unlockedCharIds = data.unlockedIds ?? ['kai'];
  const characterWeaponMap: Record<string, string> = {
    kai: 'plasma_bolt', vex: 'neon_whip', rhea: 'cyber_shuriken',
    zion: 'pulse_rifle', nova: 'blade_drone', tank: 'ion_orbit',
    sage: 'volt_chain', flux: 'gravity_bomb',
  };
  const unlockedWeaponIds = ['plasma_bolt'];
  for (const charId of unlockedCharIds) {
    const weaponId = characterWeaponMap[charId];
    if (weaponId && !unlockedWeaponIds.includes(weaponId)) {
      unlockedWeaponIds.push(weaponId);
    }
  }
  const unlockedItemIds = ['energy_cell', 'shield_matrix', 'magnet_implant'];
  const statsAsUnknown = data.stats as unknown as Record<string, unknown>;
  if ((statsAsUnknown.bestTime as number) >= 60) unlockedItemIds.push('nano_repair');
  if ((statsAsUnknown.bestLevel as number) >= 5) unlockedItemIds.push('cyber_boots');
  if ((statsAsUnknown.bestLevel as number) >= 10) unlockedItemIds.push('growth_serum');

  return {
    ...data,
    version: 3,
    stats: {
      ...data.stats,
      totalHPRecovered: (data.stats as Record<string, unknown>).totalHPRecovered as number ?? 0,
      bestCreditsInRun: (data.stats as Record<string, unknown>).bestCreditsInRun as number ?? 0,
      hasEvolved: (data.stats as Record<string, unknown>).hasEvolved as boolean ?? false,
      maxWeaponsHeld: (data.stats as Record<string, unknown>).maxWeaponsHeld as number ?? 0,
    },
    unlockedWeaponIds,
    unlockedItemIds,
    unlockedStageIds: data.unlockedStageIds ?? ['neon_district'],
    hyperModeStageIds: data.hyperModeStageIds ?? [],
    selectedStageId: data.selectedStageId ?? 'neon_district',
    perCharacterStats: data.perCharacterStats ?? {},
    perWeaponStats: data.perWeaponStats ?? {},
  };
}

export const SaveManager = {
  async load(): Promise<SaveData | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as Record<string, unknown>;
      const version = data.version as number;

      if (version === 1) {
        const migratedV2 = migrateV1ToV2(data);
        const migratedV3 = migrateV2ToV3(migratedV2);
        await SaveManager.save(migratedV3);
        return migratedV3;
      }

      if (version === 2) {
        const migrated = migrateV2ToV3(data as unknown as SaveData);
        await SaveManager.save(migrated);
        return migrated;
      }

      if (version !== CURRENT_VERSION) return null;
      return data as unknown as SaveData;
    } catch {
      return null;
    }
  },

  async save(data: SaveData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  },
};
