const STORAGE_KEY = 'neo_survivor_save';
const CURRENT_VERSION = 1;

export interface SaveData {
  version: number;
  credits: number;
  upgrades: Record<string, number>;
  stats: {
    totalKills: number;
    totalRuns: number;
    totalTimePlayed: number;
  };
  unlockedIds: string[];
}

export const SaveManager = {
  async load(): Promise<SaveData | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== CURRENT_VERSION) return null;
      return data;
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
