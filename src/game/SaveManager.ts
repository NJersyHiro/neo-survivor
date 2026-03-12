const STORAGE_KEY = 'neo_survivor_save';
const CURRENT_VERSION = 2;

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
  };
  unlockedIds: string[];
  selectedCharacterId: string;
  characterLevels: Record<string, number>;
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
    },
    unlockedIds,
    selectedCharacterId: 'kai',
    characterLevels: {},
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
        const migrated = migrateV1ToV2(data);
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
