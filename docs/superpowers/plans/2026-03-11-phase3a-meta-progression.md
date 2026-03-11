# Phase 3A: Meta-Progression Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent between-run progression with credits, a shop of permanent upgrades, save system, and a main menu — so players want to do "one more run."

**Architecture:** New `useMetaStore` (Zustand) manages between-run state (credits, upgrades, lifetime stats). `SaveManager` abstracts localStorage persistence (async interface for future Capacitor swap). `StatsEngine` gains a second parameter for shop upgrade bonuses. `useGameStore` gains `creditsEarned` and `reviveCount` fields, with credit accumulation in `damageEnemy`. Main menu replaces auto-start with PLAY/SHOP tabs.

**Tech Stack:** TypeScript, React, Zustand, localStorage

---

## Chunk 1: Data Layer and Persistence

### Task 1: Upgrade Definitions Data

**Files:**
- Create: `src/data/upgrades.ts`

- [ ] **Step 1: Create upgrades.ts with 12 upgrade definitions**

```ts
import type { StatKey } from '../types';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  statKey: StatKey | null;
  bonusPerLevel: number;
  baseCost: number;
  maxLevel: number;
}

export const UPGRADES: Record<string, UpgradeDefinition> = {
  power_core: {
    id: 'power_core',
    name: 'Power Core',
    description: 'Permanently increases all damage dealt.',
    statKey: 'might',
    bonusPerLevel: 5,
    baseCost: 40,
    maxLevel: 5,
  },
  plating: {
    id: 'plating',
    name: 'Plating',
    description: 'Permanently reduces incoming damage.',
    statKey: 'armor',
    bonusPerLevel: 1,
    baseCost: 40,
    maxLevel: 5,
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    description: 'Permanently increases maximum health.',
    statKey: 'maxHp',
    bonusPerLevel: 8,
    baseCost: 50,
    maxLevel: 5,
  },
  regenerator: {
    id: 'regenerator',
    name: 'Regenerator',
    description: 'Permanently regenerates health each second.',
    statKey: 'recovery',
    bonusPerLevel: 0.2,
    baseCost: 50,
    maxLevel: 5,
  },
  thrusters: {
    id: 'thrusters',
    name: 'Thrusters',
    description: 'Permanently increases movement speed.',
    statKey: 'moveSpeed',
    bonusPerLevel: 5,
    baseCost: 30,
    maxLevel: 5,
  },
  overclocking: {
    id: 'overclocking',
    name: 'Overclocking',
    description: 'Permanently reduces weapon cooldowns.',
    statKey: 'cooldown',
    bonusPerLevel: -3,
    baseCost: 60,
    maxLevel: 5,
  },
  sensor_array: {
    id: 'sensor_array',
    name: 'Sensor Array',
    description: 'Permanently increases weapon area of effect.',
    statKey: 'area',
    bonusPerLevel: 5,
    baseCost: 40,
    maxLevel: 5,
  },
  tractor_beam: {
    id: 'tractor_beam',
    name: 'Tractor Beam',
    description: 'Permanently increases XP gem pickup range.',
    statKey: 'magnet',
    bonusPerLevel: 10,
    baseCost: 30,
    maxLevel: 5,
  },
  data_miner: {
    id: 'data_miner',
    name: 'Data Miner',
    description: 'Permanently increases XP gained.',
    statKey: 'growth',
    bonusPerLevel: 5,
    baseCost: 30,
    maxLevel: 5,
  },
  fortune_chip: {
    id: 'fortune_chip',
    name: 'Fortune Chip',
    description: 'Permanently increases luck.',
    statKey: 'luck',
    bonusPerLevel: 5,
    baseCost: 20,
    maxLevel: 5,
  },
  extra_reroll: {
    id: 'extra_reroll',
    name: 'Extra Reroll',
    description: 'Gain additional rerolls at the start of each run.',
    statKey: null,
    bonusPerLevel: 1,
    baseCost: 60,
    maxLevel: 5,
  },
  revival_kit: {
    id: 'revival_kit',
    name: 'Revival Kit',
    description: 'Revive once per run at 30% HP when killed.',
    statKey: null,
    bonusPerLevel: 1,
    baseCost: 80,
    maxLevel: 1,
  },
};

export const ALL_UPGRADE_IDS = Object.keys(UPGRADES);

export function getUpgradeCost(id: string, level: number): number {
  const def = UPGRADES[id];
  if (!def) return Infinity;
  return def.baseCost * level;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/data/upgrades.ts
git commit -m "Add upgrade definitions data for 12 permanent shop upgrades"
```

---

### Task 2: SaveManager

**Files:**
- Create: `src/game/SaveManager.ts`
- Create: `src/game/__tests__/SaveManager.test.ts`

- [ ] **Step 1: Write SaveManager tests**

```ts
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
      version: 1,
      credits: 500,
      upgrades: { power_core: 3 },
      stats: { totalKills: 100, totalRuns: 5, totalTimePlayed: 3000 },
      unlockedIds: [],
    };
    await SaveManager.save(saveData);
    const loaded = await SaveManager.load();
    expect(loaded).toEqual(saveData);
  });

  it('clear removes save data', async () => {
    await SaveManager.save({
      version: 1,
      credits: 100,
      upgrades: {},
      stats: { totalKills: 0, totalRuns: 0, totalTimePlayed: 0 },
      unlockedIds: [],
    });
    await SaveManager.clear();
    const loaded = await SaveManager.load();
    expect(loaded).toBeNull();
  });

  it('returns null for corrupted data', async () => {
    localStorage.setItem('neo_survivor_save', 'not-json');
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });

  it('returns null for wrong version', async () => {
    localStorage.setItem('neo_survivor_save', JSON.stringify({ version: 999 }));
    const data = await SaveManager.load();
    expect(data).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/__tests__/SaveManager.test.ts
```

- [ ] **Step 3: Implement SaveManager**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/game/__tests__/SaveManager.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/SaveManager.ts src/game/__tests__/SaveManager.test.ts
git commit -m "Add SaveManager with async interface and localStorage backend"
```

---

### Task 3: useMetaStore

**Files:**
- Create: `src/stores/useMetaStore.ts`
- Create: `src/stores/__tests__/useMetaStore.test.ts`

- [ ] **Step 1: Write useMetaStore tests**

```ts
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
    // Cost was baseCost * 1 = 40
    expect(useMetaStore.getState().credits).toBe(960);
  });

  it('purchaseUpgrade fails with insufficient credits', () => {
    useMetaStore.getState().addCredits(10);
    const success = useMetaStore.getState().purchaseUpgrade('power_core');
    expect(success).toBe(false);
    expect(useMetaStore.getState().getUpgradeLevel('power_core')).toBe(0);
  });

  it('purchaseUpgrade fails when maxed', () => {
    useMetaStore.getState().addCredits(100000);
    // revival_kit maxLevel is 1
    useMetaStore.getState().purchaseUpgrade('revival_kit');
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
    // Save directly to localStorage
    localStorage.setItem('neo_survivor_save', JSON.stringify({
      version: 1,
      credits: 500,
      upgrades: { power_core: 2 },
      stats: { totalKills: 200, totalRuns: 10, totalTimePlayed: 6000 },
      unlockedIds: [],
    }));
    await useMetaStore.getState().load();
    expect(useMetaStore.getState().credits).toBe(500);
    expect(useMetaStore.getState().getUpgradeLevel('power_core')).toBe(2);
    expect(useMetaStore.getState().stats.totalRuns).toBe(10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/stores/__tests__/useMetaStore.test.ts
```

- [ ] **Step 3: Implement useMetaStore**

```ts
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

  getUpgradeLevel: (id) => {
    return get().upgrades[id] ?? 0;
  },

  resetAll: () => {
    set(createDefaultState());
    void SaveManager.clear();
  },
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/stores/__tests__/useMetaStore.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/useMetaStore.ts src/stores/__tests__/useMetaStore.test.ts
git commit -m "Add useMetaStore for between-run progression state"
```

---

## Chunk 2: StatsEngine and GameStore Integration

### Task 4: Update StatsEngine to Accept Shop Upgrades

**Files:**
- Modify: `src/game/StatsEngine.ts`
- Modify: `src/game/__tests__/StatsEngine.test.ts`

- [ ] **Step 1: Add tests for shop upgrade stacking**

Add to `src/game/__tests__/StatsEngine.test.ts`:

```ts
it('applies shop upgrades with no items', () => {
  const stats = computePlayerStats([], { power_core: 3 });
  expect(stats.might).toBe(15); // 5 * 3
});

it('stacks shop upgrades with item bonuses', () => {
  const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 2 }];
  const stats = computePlayerStats(items, { power_core: 2 });
  expect(stats.might).toBe(30); // item: 10*2=20, shop: 5*2=10
});

it('ignores special upgrades (null statKey)', () => {
  const stats = computePlayerStats([], { extra_reroll: 3, revival_kit: 1 });
  expect(stats.might).toBe(0);
  expect(stats.armor).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/__tests__/StatsEngine.test.ts
```

- [ ] **Step 3: Update computePlayerStats**

Modify `src/game/StatsEngine.ts`:
- Add second optional parameter `shopUpgrades?: Record<string, number>`
- Import `UPGRADES` from `../data/upgrades`
- After the item loop, add a shop upgrade loop:

```ts
import { UPGRADES } from '../data/upgrades';

export function computePlayerStats(
  items: ItemInstance[],
  shopUpgrades?: Record<string, number>
): ComputedStats {
  const stats: ComputedStats = { /* existing zero init */ };

  // Item bonuses (existing loop)
  for (const item of items) { /* unchanged */ }

  // Shop upgrade bonuses
  if (shopUpgrades) {
    for (const [id, level] of Object.entries(shopUpgrades)) {
      const def = UPGRADES[id];
      if (!def || !def.statKey || level <= 0) continue;
      stats[def.statKey] += def.bonusPerLevel * level;
    }
  }

  return stats;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/game/__tests__/StatsEngine.test.ts
```

- [ ] **Step 5: Update useComputedStats hook**

Modify `src/hooks/useComputedStats.ts` to pass shop upgrades:

```ts
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { computePlayerStats } from '../game/StatsEngine';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  const shopUpgrades = useMetaStore.getState().upgrades;
  return computePlayerStats(items, shopUpgrades);
}
```

- [ ] **Step 6: Update healPlayer in useGameStore to pass shop upgrades**

In `src/stores/useGameStore.ts`, the `healPlayer` action calls `computePlayerStats(state.items)`. Update it to also read shop upgrades:

```ts
import { useMetaStore } from './useMetaStore';

// Inside healPlayer:
healPlayer: (amount) =>
  set((state) => {
    const player = { ...state.player };
    const shopUpgrades = useMetaStore.getState().upgrades;
    const stats = computePlayerStats(state.items, shopUpgrades);
    const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
    player.hp = Math.min(player.hp + amount, effectiveMaxHp);
    return { player };
  }),
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add src/game/StatsEngine.ts src/game/__tests__/StatsEngine.test.ts src/hooks/useComputedStats.ts src/stores/useGameStore.ts
git commit -m "Update StatsEngine to stack shop upgrade bonuses with items"
```

---

### Task 5: Add Credits and Revival to GameStore

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/stores/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Add tests**

Add to `src/stores/__tests__/useGameStore.test.ts`:

```ts
it('startRun initializes creditsEarned and reviveCount', () => {
  useGameStore.getState().startRun();
  const state = useGameStore.getState();
  expect(state.creditsEarned).toBe(0);
  expect(state.reviveCount).toBe(0);
});

it('damageEnemy accumulates credits on kill', () => {
  useGameStore.getState().startRun();
  useGameStore.getState().spawnEnemy({
    id: '1', definitionId: 'drone',
    position: { x: 0, y: 0, z: 0 }, hp: 10, maxHp: 10,
  });
  useGameStore.getState().damageEnemy('1', 20);
  expect(useGameStore.getState().creditsEarned).toBeGreaterThan(0);
});

it('takeDamage triggers revival instead of gameover when reviveCount > 0', () => {
  useGameStore.getState().startRun();
  // Manually set reviveCount
  useGameStore.setState({ reviveCount: 1 });
  useGameStore.getState().takeDamage(200);
  const state = useGameStore.getState();
  expect(state.phase).toBe('playing');
  expect(state.player.hp).toBeGreaterThan(0);
  expect(state.reviveCount).toBe(0);
});

it('takeDamage triggers gameover when no revives left', () => {
  useGameStore.getState().startRun();
  useGameStore.getState().takeDamage(200);
  expect(useGameStore.getState().phase).toBe('gameover');
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
npx vitest run src/stores/__tests__/useGameStore.test.ts
```

- [ ] **Step 3: Add creditsEarned and reviveCount to GameState**

In `src/stores/useGameStore.ts`:

Add to interface:
```ts
creditsEarned: number;
reviveCount: number;
```

Add to initial state, `reset()`, and `startRun()`:
```ts
creditsEarned: 0,
reviveCount: 0,
```

In `startRun`, read from useMetaStore for rerollCount and reviveCount:
```ts
startRun: () => {
  const meta = useMetaStore.getState();
  const extraRerolls = meta.getUpgradeLevel('extra_reroll');
  const revives = meta.getUpgradeLevel('revival_kit');
  set({
    phase: 'playing',
    elapsedTime: 0,
    killCount: 0,
    player: createInitialPlayer(),
    weapons: [{ definitionId: STARTING_WEAPON_ID, level: 1 }],
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
  });
},
```

- [ ] **Step 4: Update damageEnemy to accumulate credits**

Import `ENEMIES` from `../data/enemies` in useGameStore.ts. Update `damageEnemy`:

```ts
damageEnemy: (id, damage) =>
  set((state) => {
    const enemies = state.enemies.map((e) =>
      e.id === id ? { ...e, hp: e.hp - damage } : e
    );
    const dead = enemies.filter((e) => e.hp <= 0);
    const alive = enemies.filter((e) => e.hp > 0);

    // Accumulate credits from kills
    let creditGain = 0;
    for (const d of dead) {
      const def = ENEMIES[d.definitionId];
      if (def?.isBoss) {
        creditGain += 25 + Math.floor(Math.random() * 26); // 25-50
      } else {
        creditGain += 1 + Math.floor(Math.random() * 3);   // 1-3
      }
    }

    return {
      enemies: alive,
      killCount: state.killCount + dead.length,
      creditsEarned: state.creditsEarned + creditGain,
    };
  }),
```

- [ ] **Step 5: Update takeDamage for revival**

```ts
takeDamage: (amount) =>
  set((state) => {
    const player = { ...state.player };
    const effectiveDamage = Math.max(0, amount - player.armor);
    player.hp -= effectiveDamage;

    if (player.hp <= 0) {
      if (state.reviveCount > 0) {
        // Revival: restore to 30% HP
        const shopUpgrades = useMetaStore.getState().upgrades;
        const stats = computePlayerStats(state.items, shopUpgrades);
        const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
        player.hp = Math.floor(effectiveMaxHp * 0.3);
        return { player, reviveCount: state.reviveCount - 1 };
      }
      player.hp = 0;
      return { player, phase: 'gameover' };
    }

    return { player };
  }),
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/stores/useGameStore.ts src/stores/__tests__/useGameStore.test.ts
git commit -m "Add credits accumulation and revival system to game store"
```

---

## Chunk 3: UI — Main Menu, Shop, Results Update

### Task 6: Main Menu Screen

**Files:**
- Create: `src/ui/MainMenu.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create MainMenu.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import ShopScreen from './ShopScreen';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const credits = useMetaStore((s) => s.credits);
  const stats = useMetaStore((s) => s.stats);
  const [tab, setTab] = useState<'play' | 'shop'>('play');

  // Load save data on mount
  useEffect(() => {
    void useMetaStore.getState().load();
  }, []);

  if (phase !== 'menu') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.95)',
        fontFamily: "'Courier New', monospace",
        overflow: 'auto',
      }}
    >
      {/* Credits */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 24,
          color: '#ffff00',
          fontSize: 18,
          fontWeight: 'bold',
          textShadow: '0 0 10px #ffff00',
        }}
      >
        {credits} CR
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
        {(['play', 'shop'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #00ffff' : '2px solid transparent',
              color: tab === t ? '#00ffff' : '#666',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
              padding: '12px 32px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'play' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {/* Title */}
          <div
            style={{
              color: '#00ffff',
              fontSize: 48,
              fontWeight: 'bold',
              textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
              letterSpacing: 4,
              textAlign: 'center',
            }}
          >
            NEO SURVIVOR
          </div>

          {/* Start button */}
          <button
            onClick={() => useGameStore.getState().startRun()}
            style={{
              background: '#00ffff',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '16px 64px',
              fontSize: 24,
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
              cursor: 'pointer',
              boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
              marginTop: 16,
            }}
          >
            START RUN
          </button>

          {/* Lifetime stats */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 32,
              color: '#888',
              fontSize: 14,
            }}
          >
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

- [ ] **Step 2: Update App.tsx — remove auto-start, add MainMenu**

Replace the auto-start useEffect and add MainMenu:

```tsx
import MainMenu from './ui/MainMenu';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <GameScene />
      </Canvas>
      <HUD />
      <LevelUpScreen />
      <ResultsScreen />
      <MainMenu />
    </div>
  );
}
```

Remove the `useEffect` that auto-starts the run.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/MainMenu.tsx src/App.tsx
git commit -m "Add main menu with PLAY/SHOP tabs, remove auto-start"
```

---

### Task 7: Shop Screen

**Files:**
- Create: `src/ui/ShopScreen.tsx`

- [ ] **Step 1: Create ShopScreen.tsx**

```tsx
import { useMetaStore } from '../stores/useMetaStore';
import { UPGRADES, ALL_UPGRADE_IDS, getUpgradeCost } from '../data/upgrades';

export default function ShopScreen() {
  const credits = useMetaStore((s) => s.credits);
  const upgrades = useMetaStore((s) => s.upgrades);

  return (
    <div
      style={{
        flex: 1,
        padding: '24px 16px',
        width: '100%',
        maxWidth: 600,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {ALL_UPGRADE_IDS.map((id) => {
          const def = UPGRADES[id]!;
          const level = upgrades[id] ?? 0;
          const isMaxed = level >= def.maxLevel;
          const cost = isMaxed ? 0 : getUpgradeCost(id, level + 1);
          const canAfford = credits >= cost;

          return (
            <div
              key={id}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: `1px solid ${isMaxed ? '#00ff88' : '#00ffff'}`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
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
                <div
                  style={{
                    color: '#00ff88',
                    fontSize: 14,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '6px 0',
                  }}
                >
                  MAX
                </div>
              ) : (
                <button
                  onClick={() => useMetaStore.getState().purchaseUpgrade(id)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#00ffff' : 'transparent',
                    color: canAfford ? '#000' : '#ff4444',
                    border: `1px solid ${canAfford ? '#00ffff' : '#ff4444'}`,
                    borderRadius: 4,
                    padding: '6px 0',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
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

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/ShopScreen.tsx
git commit -m "Add shop screen with upgrade cards and purchase flow"
```

---

### Task 8: Update Results Screen

**Files:**
- Modify: `src/ui/ResultsScreen.tsx`

- [ ] **Step 1: Update ResultsScreen with credits and MENU button**

Modify `src/ui/ResultsScreen.tsx`:
- Import `useMetaStore`
- Show `creditsEarned` from game store (plus run-end bonus)
- Add a MENU button alongside RETRY
- On both buttons, call `useMetaStore.getState().recordRunStats()` first
- Compute run-end bonus: `Math.floor(50 + killCount * 0.5 + elapsedTime * 0.2)`
- Update the survived check from `300` to `900`

```tsx
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { WEAPONS } from '../data/weapons';

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

  if (phase !== 'gameover') return null;

  const survived = elapsedTime >= 900;
  const titleText = survived ? 'SYSTEM SURVIVED' : 'SYSTEM TERMINATED';
  const titleColor = survived ? '#00ff88' : '#ff3366';
  const runEndBonus = Math.floor(50 + killCount * 0.5 + elapsedTime * 0.2);
  const totalCredits = creditsEarned + runEndBonus;

  const handleEnd = (action: 'retry' | 'menu') => {
    useMetaStore.getState().recordRunStats(killCount, elapsedTime, totalCredits);
    if (action === 'retry') {
      useGameStore.getState().startRun();
    } else {
      useGameStore.getState().reset();
    }
  };

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

      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
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
        <button
          onClick={() => handleEnd('retry')}
          style={{
            background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
            padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
            fontFamily: "'Courier New', monospace", cursor: 'pointer',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        >
          RETRY
        </button>
        <button
          onClick={() => handleEnd('menu')}
          style={{
            background: 'transparent', color: '#00ffff',
            border: '2px solid #00ffff', borderRadius: 8,
            padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
            fontFamily: "'Courier New', monospace", cursor: 'pointer',
          }}
        >
          MENU
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests and verify TypeScript**

```bash
npx vitest run && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/ResultsScreen.tsx
git commit -m "Update results screen with credits display and MENU button"
```

---

## Chunk 4: Final Assembly and Verification

### Task 9: Final Integration and Tests

**Files:**
- Verify all existing files

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (existing 48 + new SaveManager ~5 + new useMetaStore ~7 + new StatsEngine ~3 + new useGameStore ~4 = ~67 tests).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Production build**

```bash
npm run build
```

- [ ] **Step 4: Manual verification checklist**

Run `npm run dev` and verify:

1. App shows main menu with "NEO SURVIVOR" title and PLAY/SHOP tabs
2. SHOP tab shows 12 upgrade cards, all at Lv 0
3. Clicking START RUN begins the game
4. Enemies drop credits (counter visible on results screen)
5. Results screen shows credits earned with breakdown
6. MENU button returns to main menu
7. Credits persist after returning to menu
8. Shop purchases deduct credits and show level increase
9. Shop upgrades affect gameplay (buy Power Core, damage increases)
10. Revival Kit purchase allows one death save per run
11. Extra Reroll purchase gives more rerolls on level-up

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "Complete Phase 3A: meta-progression with save, shop, credits, and main menu"
git push origin main
```
