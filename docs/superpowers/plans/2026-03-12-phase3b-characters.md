# Phase 3B: Characters Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 playable characters with unique stats/starting weapons, achievement unlocks, credit purchase, and per-character upgrades.

**Architecture:** Character definitions in `src/data/characters.ts`. Meta store extended with character state. StatsEngine accepts character stats. SaveManager migrated to v2 with backwards compatibility.

**Tech Stack:** TypeScript, Zustand, Vitest

---

## Chunk 1: Data Layer

### Task 1: Character Definitions

**Files:**
- Create: `src/data/characters.ts`

- [ ] **Step 1: Create character definitions file**

```ts
// src/data/characters.ts
import type { StatKey } from '../types';

export const MAX_CHARACTER_LEVEL = 5;
export const CHARACTER_UPGRADE_COST_PER_LEVEL = 500;

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  startingWeaponId: string;
  baseStats: Partial<Record<StatKey, number>>;
  unlockCondition: {
    stat: string;
    threshold: number;
    description: string;
  } | null;
  creditCost: number;
}

export const CHARACTERS: Record<string, CharacterDefinition> = {
  kai: {
    id: 'kai',
    name: 'Kai',
    description: 'Balanced operative. No weaknesses, no extremes.',
    startingWeaponId: 'plasma_bolt',
    baseStats: { maxHp: 100 },
    unlockCondition: null,
    creditCost: 0,
  },
  vex: {
    id: 'vex',
    name: 'Vex',
    description: 'Lightning-fast melee specialist. Fragile but elusive.',
    startingWeaponId: 'neon_whip',
    baseStats: { maxHp: 85, moveSpeed: 20, luck: 10 },
    unlockCondition: { stat: 'bestTime', threshold: 300, description: 'Survive 5 minutes in a single run' },
    creditCost: 1500,
  },
  rhea: {
    id: 'rhea',
    name: 'Rhea',
    description: 'Area denial expert. Wide attacks, slow movement.',
    startingWeaponId: 'cyber_shuriken',
    baseStats: { maxHp: 100, might: 10, area: 15, moveSpeed: -10 },
    unlockCondition: { stat: 'totalKills', threshold: 300, description: 'Kill 300 total enemies' },
    creditCost: 1500,
  },
  zion: {
    id: 'zion',
    name: 'Zion',
    description: 'Precision marksman. Devastating damage, narrow focus.',
    startingWeaponId: 'pulse_rifle',
    baseStats: { maxHp: 90, might: 25, area: -20 },
    unlockCondition: { stat: 'bestLevel', threshold: 15, description: 'Reach level 15 in a single run' },
    creditCost: 2000,
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    description: 'Drone commander. Faster cooldowns, reduced direct power.',
    startingWeaponId: 'blade_drone',
    baseStats: { maxHp: 100, cooldown: -20, might: -10, recovery: 0.2 },
    unlockCondition: { stat: 'totalRuns', threshold: 10, description: 'Complete 10 runs' },
    creditCost: 2000,
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'Heavy assault unit. Absorbs punishment, slow and steady.',
    startingWeaponId: 'ion_orbit',
    baseStats: { maxHp: 130, armor: 2, recovery: 0.3, moveSpeed: -15, area: 10 },
    unlockCondition: { stat: 'totalDamageTaken', threshold: 1000, description: 'Take 1,000 total damage' },
    creditCost: 2500,
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    description: 'Glass cannon. Extreme damage output, paper-thin defenses.',
    startingWeaponId: 'volt_chain',
    baseStats: { maxHp: 75, might: 30 },
    unlockCondition: { stat: 'totalBossKills', threshold: 1, description: 'Kill a boss enemy' },
    creditCost: 2500,
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    description: 'Resource optimizer. Attracts more loot, grows faster.',
    startingWeaponId: 'gravity_bomb',
    baseStats: { maxHp: 95, magnet: 25, growth: 15, might: -10, luck: 10 },
    unlockCondition: { stat: 'totalXPGemsCollected', threshold: 500, description: 'Collect 500 total XP gems' },
    creditCost: 3000,
  },
};

export const ALL_CHARACTER_IDS = Object.keys(CHARACTERS);

export function getCharacterUpgradeCost(level: number): number {
  return CHARACTER_UPGRADE_COST_PER_LEVEL * level;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/characters.ts
git commit -m "Add 8 character definitions with stats and unlock conditions"
```

---

### Task 2: SaveManager v2 with Migration

**Files:**
- Modify: `src/game/SaveManager.ts`
- Create: `src/game/__tests__/SaveManager.test.ts`

- [ ] **Step 1: Write tests for SaveManager migration**

```ts
// src/game/__tests__/SaveManager.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/__tests__/SaveManager.test.ts`
Expected: Failures (v2 fields missing, migration not implemented)

- [ ] **Step 3: Update SaveManager implementation**

```ts
// src/game/SaveManager.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/__tests__/SaveManager.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/SaveManager.ts src/game/__tests__/SaveManager.test.ts
git commit -m "Add SaveData v2 with migration from v1"
```

---

### Task 3: StatsEngine — Character Stats Support

**Files:**
- Modify: `src/game/StatsEngine.ts`
- Modify: `src/game/__tests__/StatsEngine.test.ts`

- [ ] **Step 1: Add character stats tests**

Append to `src/game/__tests__/StatsEngine.test.ts`:

```ts
  it('applies character base stats', () => {
    const charStats = { might: 25, area: -20 };
    const stats = computePlayerStats([], undefined, charStats);
    expect(stats.might).toBe(25);
    expect(stats.area).toBe(-20);
  });

  it('applies character upgrade level bonuses', () => {
    const stats = computePlayerStats([], undefined, {}, 3);
    expect(stats.might).toBe(6);      // 3 * 2
    expect(stats.moveSpeed).toBe(6);  // 3 * 2
  });

  it('stacks character stats with items and shop upgrades', () => {
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 2 }]; // might +20
    const charStats = { might: 10 };
    const stats = computePlayerStats(items, { power_core: 1 }, charStats, 2);
    // char: 10 + upgrade: 4 + item: 20 + shop: 5 = 39
    expect(stats.might).toBe(39);
    // upgrade: 4
    expect(stats.moveSpeed).toBe(4);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/__tests__/StatsEngine.test.ts`
Expected: Failures (new parameters not accepted)

- [ ] **Step 3: Update StatsEngine to accept character stats**

Replace `src/game/StatsEngine.ts`:

```ts
import type { ItemInstance, StatKey } from '../types';
import { ITEMS } from '../data/items';
import { UPGRADES } from '../data/upgrades';

export interface ComputedStats {
  might: number;
  armor: number;
  maxHp: number;
  recovery: number;
  speed: number;
  area: number;
  cooldown: number;
  amount: number;
  moveSpeed: number;
  magnet: number;
  luck: number;
  growth: number;
}

const STAT_KEYS: StatKey[] = [
  'might', 'armor', 'maxHp', 'recovery',
  'speed', 'area', 'cooldown', 'amount',
  'moveSpeed', 'magnet', 'luck', 'growth',
];

export function computePlayerStats(
  items: ItemInstance[],
  shopUpgrades?: Record<string, number>,
  characterStats?: Partial<Record<StatKey, number>>,
  characterUpgradeLevel?: number,
): ComputedStats {
  const stats: ComputedStats = {
    might: 0, armor: 0, maxHp: 0, recovery: 0,
    speed: 0, area: 0, cooldown: 0, amount: 0,
    moveSpeed: 0, magnet: 0, luck: 0, growth: 0,
  };

  // 1. Character base stats
  if (characterStats) {
    for (const key of STAT_KEYS) {
      const bonus = characterStats[key];
      if (bonus !== undefined) {
        stats[key] += bonus;
      }
    }
  }

  // 2. Character upgrade bonuses
  if (characterUpgradeLevel) {
    stats.might += characterUpgradeLevel * 2;
    stats.moveSpeed += characterUpgradeLevel * 2;
  }

  // 3. Passive items
  for (const item of items) {
    const def = ITEMS[item.definitionId];
    if (!def) continue;
    for (const key of STAT_KEYS) {
      const bonus = def.stats[key];
      if (bonus !== undefined) {
        stats[key] += bonus * item.level;
      }
    }
  }

  // 4. Shop upgrades
  if (shopUpgrades) {
    for (const [id, level] of Object.entries(shopUpgrades)) {
      const def = UPGRADES[id];
      if (!def || def.statKey === null) continue;
      stats[def.statKey] += def.bonusPerLevel * level;
    }
  }

  return stats;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/__tests__/StatsEngine.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/StatsEngine.ts src/game/__tests__/StatsEngine.test.ts
git commit -m "Add character stats and upgrade level to StatsEngine"
```

---

## Chunk 2: Store Integration

### Task 4: useMetaStore — Character State & Actions

**Files:**
- Modify: `src/stores/useMetaStore.ts`
- Create: `src/stores/__tests__/useMetaStore.test.ts`

- [ ] **Step 1: Write tests for useMetaStore character features**

```ts
// src/stores/__tests__/useMetaStore.test.ts
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

  it('unlockCharacter deducts credits and adds to unlockedIds', () => {
    useMetaStore.setState({ credits: 2000 });
    const result = useMetaStore.getState().unlockCharacter('vex');
    expect(result).toBe(true);
    expect(useMetaStore.getState().unlockedIds).toContain('vex');
    expect(useMetaStore.getState().credits).toBe(500); // 2000 - 1500
  });

  it('unlockCharacter fails with insufficient credits', () => {
    useMetaStore.setState({ credits: 100 });
    const result = useMetaStore.getState().unlockCharacter('vex');
    expect(result).toBe(false);
    expect(useMetaStore.getState().unlockedIds).not.toContain('vex');
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
    expect(useMetaStore.getState().credits).toBe(500); // 1000 - 500*1
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
    });
    useMetaStore.getState().recordRunStats(10, 200, 50, {
      damageTaken: 0, bossKills: 0, xpGemsCollected: 0, playerLevel: 5,
    });
    expect(useMetaStore.getState().stats.bestTime).toBe(600);
    expect(useMetaStore.getState().stats.bestLevel).toBe(20);
  });

  it('checkUnlocks returns newly unlocked character IDs', () => {
    useMetaStore.setState({
      stats: {
        totalKills: 500, totalRuns: 15, totalTimePlayed: 5000,
        totalDamageTaken: 2000, totalBossKills: 3, totalXPGemsCollected: 600,
        bestTime: 600, bestLevel: 20,
      },
      unlockedIds: ['kai'],
    });
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    // All conditions met, should unlock all 7 non-default characters
    expect(newlyUnlocked).toHaveLength(7);
    expect(useMetaStore.getState().unlockedIds).toHaveLength(8);
  });

  it('checkUnlocks returns empty array when nothing new to unlock', () => {
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    expect(newlyUnlocked).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/useMetaStore.test.ts`
Expected: Failures

- [ ] **Step 3: Update useMetaStore implementation**

Replace `src/stores/useMetaStore.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/useMetaStore.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/useMetaStore.ts src/stores/__tests__/useMetaStore.test.ts
git commit -m "Add character unlock, upgrade, and selection to useMetaStore"
```

---

### Task 5: useGameStore — Per-Run Counters & Character-Based startRun

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/stores/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Add tests for new per-run counters and character-based startRun**

Append to `src/stores/__tests__/useGameStore.test.ts`:

```ts
  it('startRun uses selected character starting weapon', () => {
    // Set meta store to select vex (neon_whip)
    const { useMetaStore } = require('../../stores/useMetaStore');
    useMetaStore.setState({
      selectedCharacterId: 'vex',
      unlockedIds: ['kai', 'vex'],
      characterLevels: {},
    });
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.weapons[0]?.definitionId).toBe('neon_whip');
  });

  it('startRun applies character maxHp', () => {
    const { useMetaStore } = require('../../stores/useMetaStore');
    useMetaStore.setState({
      selectedCharacterId: 'tank',
      unlockedIds: ['kai', 'tank'],
      characterLevels: { tank: 2 },
    });
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    // Tank baseStats.maxHp = 130, upgrade level 2 = +4 → 134
    expect(state.player.maxHp).toBe(134);
    expect(state.player.hp).toBe(134);
  });

  it('startRun initializes per-run counters', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.damageTaken).toBe(0);
    expect(state.bossKills).toBe(0);
    expect(state.xpGemsCollected).toBe(0);
  });

  it('takeDamage increments damageTaken counter', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(25);
    expect(useGameStore.getState().damageTaken).toBe(25);
  });

  it('damageEnemy increments bossKills on boss death', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: 'b1', definitionId: 'sentinel',
      position: { x: 0, y: 0, z: 0 }, hp: 10, maxHp: 10,
    });
    useGameStore.getState().damageEnemy('b1', 20);
    expect(useGameStore.getState().bossKills).toBe(1);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/useGameStore.test.ts`
Expected: Failures (new fields don't exist)

- [ ] **Step 3: Update useGameStore**

Add to `GameState` interface (after `reviveCount: number;`):
```ts
  damageTaken: number;
  bossKills: number;
  xpGemsCollected: number;
```

Add to initial state and `reset()`:
```ts
  damageTaken: 0,
  bossKills: 0,
  xpGemsCollected: 0,
```

Add import at top:
```ts
import { CHARACTERS } from '../data/characters';
```

Replace `startRun`:
```ts
  startRun: () => {
    const meta = useMetaStore.getState();
    const extraRerolls = meta.getUpgradeLevel('extra_reroll');
    const revives = meta.getUpgradeLevel('revival_kit');
    const characterId = meta.selectedCharacterId;
    const characterDef = CHARACTERS[characterId];
    const characterLevel = meta.characterLevels[characterId] ?? 0;
    const baseMaxHp = (characterDef?.baseStats.maxHp ?? 100) + characterLevel * 2;
    const startingWeaponId = characterDef?.startingWeaponId ?? STARTING_WEAPON_ID;

    set({
      phase: 'playing',
      elapsedTime: 0,
      killCount: 0,
      player: {
        ...createInitialPlayer(),
        hp: baseMaxHp,
        maxHp: baseMaxHp,
      },
      weapons: [{ definitionId: startingWeaponId, level: 1 }],
      items: [],
      enemies: [],
      projectiles: [],
      xpGems: [],
      chests: [],
      levelUpOptions: [],
      rerollCount: 3 + extraRerolls,
      skipCount: 3,
      banishCount: 3,
      banishedIds: [],
      creditsEarned: 0,
      reviveCount: revives,
      damageTaken: 0,
      bossKills: 0,
      xpGemsCollected: 0,
    });
  },
```

Update `takeDamage` to track damage — add before the return statements:
```ts
  takeDamage: (amount) =>
    set((state) => {
      const player = { ...state.player };
      const effectiveDamage = Math.max(0, amount - player.armor);
      player.hp -= effectiveDamage;

      if (player.hp <= 0) {
        if (state.reviveCount > 0) {
          const shopUpgrades = useMetaStore.getState().upgrades;
          const stats = computePlayerStats(state.items, shopUpgrades);
          const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
          player.hp = Math.floor(effectiveMaxHp * 0.3);
          return { player, reviveCount: state.reviveCount - 1, damageTaken: state.damageTaken + effectiveDamage };
        }
        player.hp = 0;
        return { player, phase: 'gameover', damageTaken: state.damageTaken + effectiveDamage };
      }

      return { player, damageTaken: state.damageTaken + effectiveDamage };
    }),
```

Update `damageEnemy` to track boss kills — in the dead loop, after creditGain:
```ts
  damageEnemy: (id, damage) =>
    set((state) => {
      const enemies = state.enemies.map((e) =>
        e.id === id ? { ...e, hp: e.hp - damage } : e
      );
      const dead = enemies.filter((e) => e.hp <= 0);
      const alive = enemies.filter((e) => e.hp > 0);

      let creditGain = 0;
      let newBossKills = 0;
      for (const d of dead) {
        const def = ENEMIES[d.definitionId];
        if (def?.isBoss) {
          creditGain += 25 + Math.floor(Math.random() * 26);
          newBossKills += 1;
        } else {
          creditGain += 1 + Math.floor(Math.random() * 3);
        }
      }

      return {
        enemies: alive,
        killCount: state.killCount + dead.length,
        creditsEarned: state.creditsEarned + creditGain,
        bossKills: state.bossKills + newBossKills,
      };
    }),
```

- [ ] **Step 4: Run all tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/useGameStore.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/useGameStore.ts src/stores/__tests__/useGameStore.test.ts
git commit -m "Add per-run counters and character-based startRun to useGameStore"
```

---

### Task 6: useComputedStats & XPGems Counter

**Files:**
- Modify: `src/hooks/useComputedStats.ts`
- Modify: `src/components/XPGems.tsx`

- [ ] **Step 1: Update useComputedStats to pass character data**

Replace `src/hooks/useComputedStats.ts`:

```ts
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { computePlayerStats } from '../game/StatsEngine';
import { CHARACTERS } from '../data/characters';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  const meta = useMetaStore.getState();
  const shopUpgrades = meta.upgrades;
  const characterId = meta.selectedCharacterId;
  const characterDef = CHARACTERS[characterId];
  const characterLevel = meta.characterLevels[characterId] ?? 0;

  return computePlayerStats(
    items,
    shopUpgrades,
    characterDef?.baseStats,
    characterLevel,
  );
}
```

- [ ] **Step 2: Update XPGems to increment xpGemsCollected**

In `src/components/XPGems.tsx`, after `collectedIds.push(gem.id);` (around line 51), the count of collected gems needs to be tracked. After the collection loop, before `if (totalXP > 0)`, add:

```ts
    if (collectedIds.length > 0) {
      useGameStore.setState((s) => ({
        xpGemsCollected: s.xpGemsCollected + collectedIds.length,
      }));
    }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useComputedStats.ts src/components/XPGems.tsx
git commit -m "Pass character stats to StatsEngine, track XP gem collection"
```

---

## Chunk 3: UI & Integration

### Task 7: Results Screen — Pass Extras to recordRunStats & Unlock Banner

**Files:**
- Modify: `src/ui/ResultsScreen.tsx`

- [ ] **Step 1: Update ResultsScreen**

Update the `handleEnd` function and add unlock banner. Replace the full file:

```ts
import { useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { WEAPONS } from '../data/weapons';
import { CHARACTERS } from '../data/characters';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ResultsScreen() {
  const phase = useGameStore((s) => s.phase);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const killCount = useGameStore((s) => s.killCount);
  const level = useGameStore((s) => s.player.level);
  const weapons = useGameStore((s) => s.weapons);
  const creditsEarned = useGameStore((s) => s.creditsEarned);
  const damageTaken = useGameStore((s) => s.damageTaken);
  const bossKills = useGameStore((s) => s.bossKills);
  const xpGemsCollected = useGameStore((s) => s.xpGemsCollected);
  const [unlockedNames, setUnlockedNames] = useState<string[]>([]);

  if (phase !== 'gameover') return null;

  const survived = elapsedTime >= 900;
  const titleText = survived ? 'SYSTEM SURVIVED' : 'SYSTEM TERMINATED';
  const titleColor = survived ? '#00ff88' : '#ff3366';
  const runEndBonus = Math.floor(50 + killCount * 0.5 + elapsedTime * 0.2);
  const totalCredits = creditsEarned + runEndBonus;

  const handleEnd = (action: 'retry' | 'menu') => {
    useMetaStore.getState().recordRunStats(killCount, elapsedTime, totalCredits, {
      damageTaken,
      bossKills,
      xpGemsCollected,
      playerLevel: level,
    });
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map((id) => CHARACTERS[id]?.name ?? id);
      setUnlockedNames(names);
      setTimeout(() => {
        setUnlockedNames([]);
        if (action === 'retry') {
          useGameStore.getState().startRun();
        } else {
          useGameStore.getState().reset();
        }
      }, 2000);
      return;
    }
    if (action === 'retry') {
      useGameStore.getState().startRun();
    } else {
      useGameStore.getState().reset();
    }
  };

  if (unlockedNames.length > 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(0, 0, 0, 0.95)',
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{
          color: '#ffff00', fontSize: 28, fontWeight: 'bold', marginBottom: 16,
          textShadow: '0 0 20px #ffff00, 0 0 40px #ffff00',
        }}>
          CHARACTER UNLOCKED!
        </div>
        {unlockedNames.map((name) => (
          <div key={name} style={{
            color: '#00ffff', fontSize: 36, fontWeight: 'bold',
            textShadow: '0 0 20px #00ffff',
          }}>
            {name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(0, 0, 0, 0.85)',
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        color: titleColor, fontSize: 40, fontWeight: 'bold', marginBottom: 16,
        textShadow: `0 0 20px ${titleColor}, 0 0 40px ${titleColor}`,
      }}>
        {titleText}
      </div>

      <div style={{ color: '#00ffff', fontSize: 22, marginBottom: 32 }}>
        Time: {formatTime(elapsedTime)}
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #ffff00',
          borderRadius: 8, padding: '16px 32px', textAlign: 'center',
        }}>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>KILLS</div>
          <div style={{ color: '#ffff00', fontSize: 36, fontWeight: 'bold' }}>{killCount}</div>
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88',
          borderRadius: 8, padding: '16px 32px', textAlign: 'center',
        }}>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>LEVEL</div>
          <div style={{ color: '#00ff88', fontSize: 36, fontWeight: 'bold' }}>{level}</div>
        </div>
      </div>

      {/* Credits earned */}
      <div style={{
        color: '#ffff00', fontSize: 18, marginBottom: 32,
        textShadow: '0 0 10px #ffff00',
      }}>
        +{totalCredits} CR (drops: {creditsEarned} + bonus: {runEndBonus})
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {weapons.map((w) => {
          const def = WEAPONS[w.definitionId];
          return (
            <div key={w.definitionId} style={{
              background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ffff',
              borderRadius: 4, padding: '8px 12px', textAlign: 'center',
              color: '#fff', fontSize: 13,
            }}>
              <div>{def?.name ?? w.definitionId}</div>
              <div style={{ color: '#00ff88', fontSize: 11, marginTop: 4 }}>Lv {w.level}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={() => handleEnd('retry')} style={{
          background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
          padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
          boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
        }}>
          RETRY
        </button>
        <button onClick={() => handleEnd('menu')} style={{
          background: 'transparent', color: '#00ffff',
          border: '2px solid #00ffff', borderRadius: 8,
          padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
        }}>
          MENU
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/ResultsScreen.tsx
git commit -m "Add unlock banner and per-run stats to ResultsScreen"
```

---

### Task 8: MainMenu — Character Selection

**Files:**
- Modify: `src/ui/MainMenu.tsx`

- [ ] **Step 1: Update MainMenu with character selection row**

Replace `src/ui/MainMenu.tsx`:

```ts
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { CHARACTERS, ALL_CHARACTER_IDS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import ShopScreen from './ShopScreen';
import { SoundManager } from '../game/SoundManager';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const credits = useMetaStore((s) => s.credits);
  const stats = useMetaStore((s) => s.stats);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const selectedCharacterId = useMetaStore((s) => s.selectedCharacterId);
  const [tab, setTab] = useState<'play' | 'shop'>('play');

  useEffect(() => {
    void useMetaStore.getState().load();
  }, []);

  if (phase !== 'menu') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.95)', fontFamily: "'Courier New', monospace",
      overflow: 'auto',
    }}>
      {/* Credits */}
      <div style={{
        position: 'absolute', top: 'calc(var(--sat) + 16px)', right: 24, color: '#ffff00',
        fontSize: 18, fontWeight: 'bold', textShadow: '0 0 10px #ffff00',
      }}>
        {credits} CR
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 'calc(var(--sat) + 16px)' }}>
        {(['play', 'shop'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid #00ffff' : '2px solid transparent',
            color: tab === t ? '#00ffff' : '#666',
            fontSize: 18, fontWeight: 'bold', fontFamily: "'Courier New', monospace",
            padding: '12px 32px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'play' ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 24, width: '100%', padding: '0 16px',
        }}>
          <div style={{
            color: '#00ffff', fontSize: 48, fontWeight: 'bold',
            textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
            letterSpacing: 4, textAlign: 'center',
          }}>
            NEO SURVIVOR
          </div>
          <button onClick={() => { SoundManager.unlock(); SoundManager.buttonClick(); useGameStore.getState().startRun(); }} style={{
            background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
            padding: '16px 64px', fontSize: 24, fontWeight: 'bold',
            fontFamily: "'Courier New', monospace", cursor: 'pointer',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff', marginTop: 16,
          }}>
            START RUN
          </button>

          {/* Character Selection */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
            padding: '8px 0', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {ALL_CHARACTER_IDS.map((id) => {
              const def = CHARACTERS[id]!;
              const isUnlocked = unlockedIds.includes(id);
              const isSelected = selectedCharacterId === id;
              const weaponName = WEAPONS[def.startingWeaponId]?.name ?? def.startingWeaponId;

              return (
                <div
                  key={id}
                  onClick={() => {
                    if (isUnlocked) {
                      SoundManager.buttonClick();
                      useMetaStore.getState().selectCharacter(id);
                    }
                  }}
                  style={{
                    background: isUnlocked ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${isSelected ? '#00ffff' : isUnlocked ? '#444' : '#222'}`,
                    borderRadius: 8, padding: '10px 12px', width: 100, textAlign: 'center',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.5,
                    boxShadow: isSelected ? '0 0 15px #00ffff' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    color: isUnlocked ? '#fff' : '#666', fontSize: 13, fontWeight: 'bold',
                    marginBottom: 4,
                  }}>
                    {def.name}
                  </div>
                  <div style={{ color: '#00ffff', fontSize: 10, marginBottom: 4 }}>
                    {weaponName}
                  </div>
                  {!isUnlocked && (
                    <>
                      <div style={{ color: '#888', fontSize: 9, marginBottom: 4 }}>
                        {def.unlockCondition?.description ?? ''}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          SoundManager.buttonClick();
                          useMetaStore.getState().unlockCharacter(id);
                        }}
                        disabled={credits < def.creditCost}
                        style={{
                          background: credits >= def.creditCost ? '#ffff00' : 'transparent',
                          color: credits >= def.creditCost ? '#000' : '#ff4444',
                          border: `1px solid ${credits >= def.creditCost ? '#ffff00' : '#ff4444'}`,
                          borderRadius: 4, padding: '2px 8px', fontSize: 10,
                          fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                          cursor: credits >= def.creditCost ? 'pointer' : 'default',
                          opacity: credits >= def.creditCost ? 1 : 0.5,
                        }}
                      >
                        {def.creditCost} CR
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 16, color: '#888', fontSize: 14 }}>
            <span>Runs: {stats.totalRuns}</span>
            <span>Kills: {stats.totalKills}</span>
            <span>Time: {formatTime(stats.totalTimePlayed)}</span>
          </div>
        </div>
      ) : (
        <ShopScreen />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/MainMenu.tsx
git commit -m "Add character selection row to MainMenu"
```

---

### Task 9: ShopScreen — Character Upgrades Section

**Files:**
- Modify: `src/ui/ShopScreen.tsx`

- [ ] **Step 1: Add character upgrade section to ShopScreen**

Replace `src/ui/ShopScreen.tsx`:

```ts
import { useMetaStore } from '../stores/useMetaStore';
import { UPGRADES, ALL_UPGRADE_IDS, getUpgradeCost } from '../data/upgrades';
import { CHARACTERS, ALL_CHARACTER_IDS, MAX_CHARACTER_LEVEL, getCharacterUpgradeCost } from '../data/characters';
import { SoundManager } from '../game/SoundManager';

export default function ShopScreen() {
  const credits = useMetaStore((s) => s.credits);
  const upgrades = useMetaStore((s) => s.upgrades);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const characterLevels = useMetaStore((s) => s.characterLevels);

  return (
    <div style={{
      flex: 1, padding: '24px 16px', width: '100%', maxWidth: 600, overflow: 'auto',
    }}>
      {/* Stat Upgrades */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {ALL_UPGRADE_IDS.map((id) => {
          const def = UPGRADES[id]!;
          const level = upgrades[id] ?? 0;
          const isMaxed = level >= def.maxLevel;
          const cost = isMaxed ? 0 : getUpgradeCost(id, level + 1);
          const canAfford = credits >= cost;

          return (
            <div key={id} style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${isMaxed ? '#00ff88' : '#00ffff'}`,
              borderRadius: 8, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {def.name}
              </div>
              <div style={{ color: '#888', fontSize: 11, flex: 1 }}>
                {def.description}
              </div>
              <div style={{ color: '#00ff88', fontSize: 12 }}>
                Lv {level}/{def.maxLevel}
              </div>
              {isMaxed ? (
                <div style={{
                  color: '#00ff88', fontSize: 14, fontWeight: 'bold',
                  textAlign: 'center', padding: '6px 0',
                }}>
                  MAX
                </div>
              ) : (
                <button
                  onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().purchaseUpgrade(id); }}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#00ffff' : 'transparent',
                    color: canAfford ? '#000' : '#ff4444',
                    border: `1px solid ${canAfford ? '#00ffff' : '#ff4444'}`,
                    borderRadius: 4, padding: '6px 0', fontSize: 13,
                    fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                    cursor: canAfford ? 'pointer' : 'default',
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  {cost} CR
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Character Upgrades */}
      <div style={{
        color: '#ff88ff', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12,
        textShadow: '0 0 10px #ff88ff',
      }}>
        CHARACTERS
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {ALL_CHARACTER_IDS.filter((id) => unlockedIds.includes(id)).map((id) => {
          const def = CHARACTERS[id]!;
          const level = characterLevels[id] ?? 0;
          const isMaxed = level >= MAX_CHARACTER_LEVEL;
          const cost = isMaxed ? 0 : getCharacterUpgradeCost(level + 1);
          const canAfford = credits >= cost;

          return (
            <div key={id} style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${isMaxed ? '#00ff88' : '#ff88ff'}`,
              borderRadius: 8, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {def.name}
              </div>
              <div style={{ color: '#888', fontSize: 11, flex: 1 }}>
                {def.description}
              </div>
              <div style={{ color: '#00ff88', fontSize: 12 }}>
                Lv {level}/{MAX_CHARACTER_LEVEL}
              </div>
              {isMaxed ? (
                <div style={{
                  color: '#00ff88', fontSize: 14, fontWeight: 'bold',
                  textAlign: 'center', padding: '6px 0',
                }}>
                  MAX
                </div>
              ) : (
                <button
                  onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().upgradeCharacter(id); }}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#ff88ff' : 'transparent',
                    color: canAfford ? '#000' : '#ff4444',
                    border: `1px solid ${canAfford ? '#ff88ff' : '#ff4444'}`,
                    borderRadius: 4, padding: '6px 0', fontSize: 13,
                    fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                    cursor: canAfford ? 'pointer' : 'default',
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  {cost} CR
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/ShopScreen.tsx
git commit -m "Add character upgrade section to ShopScreen"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Build for production**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Sync to iOS**

Run: `npx cap sync ios`
Expected: Sync succeeds

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "Complete Phase 3B: 8 playable characters with unlocks and upgrades"
```
