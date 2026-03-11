# Phase 2: Build Crafting Depth — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full weapon + passive item system with evolution, bosses, treasure chests, and level-up tools (reroll/skip/banish). Players can craft diverse builds each run.

**Architecture:** Extend existing Zustand game store with passive items and evolution state. Add 5 new weapons and 8 passive items to data layer. Boss enemies spawn at minute marks and drop chests that trigger evolutions. Level-up screen gains item options and utility buttons.

**Tech Stack:** TypeScript, React, Three.js/R3F, Zustand (existing stack)

---

## Chunk 1: Expanded Weapons and Passive Items Data

### Task 1: Add 5 New Weapons to Data Layer

**Files:**
- Modify: `src/data/weapons.ts`
- Modify: `src/types.ts` (add evolution fields to WeaponDefinition)

- [ ] **Step 1: Add evolution fields to WeaponDefinition**

In `src/types.ts`, add to `WeaponDefinition`:

```ts
export interface WeaponDefinition {
  // ... existing fields ...
  evolutionItemId?: string;    // passive item needed to evolve
  evolvesInto?: string;        // evolved weapon ID
}
```

- [ ] **Step 2: Add 5 new base weapons + 3 evolved weapons to weapons.ts**

Add to `src/data/weapons.ts`:

```ts
// New base weapons
ion_orbit: {
  id: 'ion_orbit',
  name: 'Ion Orbit',
  description: 'Energy orbs orbit the character.',
  category: 'melee',
  baseDamage: 12,
  cooldown: 2.0,
  projectileSpeed: 0,
  area: 3.0,
  pierce: 999,
  amount: 2,
  maxLevel: 7,
  damagePerLevel: 3,
  evolutionItemId: 'shield_matrix',
  evolvesInto: 'singularity_core',
},
pulse_rifle: {
  id: 'pulse_rifle',
  name: 'Pulse Rifle',
  description: 'Rapid-fire energy bolts in a straight line.',
  category: 'ranged',
  baseDamage: 6,
  cooldown: 0.4,
  projectileSpeed: 20,
  area: 0.2,
  pierce: 1,
  amount: 1,
  maxLevel: 7,
  damagePerLevel: 2,
  evolutionItemId: 'targeting_chip',
  evolvesInto: 'death_ray',
},
gravity_bomb: {
  id: 'gravity_bomb',
  name: 'Gravity Bomb',
  description: 'Throws bombs that create damaging zones.',
  category: 'ranged',
  baseDamage: 25,
  cooldown: 3.0,
  projectileSpeed: 8,
  area: 2.0,
  pierce: 999,
  amount: 1,
  maxLevel: 7,
  damagePerLevel: 8,
},
volt_chain: {
  id: 'volt_chain',
  name: 'Volt Chain',
  description: 'Lightning arcs between nearby enemies.',
  category: 'multishot',
  baseDamage: 7,
  cooldown: 1.8,
  projectileSpeed: 25,
  area: 0.3,
  pierce: 5,
  amount: 1,
  maxLevel: 7,
  damagePerLevel: 3,
},
blade_drone: {
  id: 'blade_drone',
  name: 'Blade Drone',
  description: 'Deploys a drone that slashes nearby enemies.',
  category: 'melee',
  baseDamage: 10,
  cooldown: 1.0,
  projectileSpeed: 0,
  area: 2.0,
  pierce: 999,
  amount: 1,
  maxLevel: 7,
  damagePerLevel: 4,
},
// Evolved weapons (cannot be selected at level-up, only via evolution)
singularity_core: {
  id: 'singularity_core',
  name: 'Singularity Core',
  description: 'A black hole orbits the character, pulling and crushing enemies.',
  category: 'melee',
  baseDamage: 40,
  cooldown: 1.5,
  projectileSpeed: 0,
  area: 5.0,
  pierce: 999,
  amount: 3,
  maxLevel: 7,
  damagePerLevel: 10,
},
death_ray: {
  id: 'death_ray',
  name: 'Death Ray',
  description: 'A continuous beam that vaporizes everything in its path.',
  category: 'ranged',
  baseDamage: 20,
  cooldown: 0.2,
  projectileSpeed: 30,
  area: 0.5,
  pierce: 999,
  amount: 1,
  maxLevel: 7,
  damagePerLevel: 6,
},
plasma_storm: {
  id: 'plasma_storm',
  name: 'Plasma Storm',
  description: 'An evolved plasma bolt that fires in all directions.',
  category: 'multishot',
  baseDamage: 18,
  cooldown: 0.8,
  projectileSpeed: 12,
  area: 0.5,
  pierce: 3,
  amount: 6,
  maxLevel: 7,
  damagePerLevel: 5,
},
```

Also add evolution fields to existing weapons:
- `plasma_bolt`: `evolutionItemId: 'energy_cell'`, `evolvesInto: 'plasma_storm'`

Add a new export:
```ts
export const EVOLVED_WEAPON_IDS = ['singularity_core', 'death_ray', 'plasma_storm'];
export const BASE_WEAPON_IDS = ALL_WEAPON_IDS.filter(id => !EVOLVED_WEAPON_IDS.includes(id));
```

- [ ] **Step 3: Update generateLevelUpOptions to use BASE_WEAPON_IDS**

In `src/stores/useGameStore.ts`, import `BASE_WEAPON_IDS` instead of `ALL_WEAPON_IDS` and use it in `generateLevelUpOptions` so evolved weapons never appear as level-up options.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/data/weapons.ts src/stores/useGameStore.ts
git commit -m "Add 5 new weapons, 3 evolved weapons, and evolution fields"
```

---

### Task 2: Passive Item System — Types and Data

**Files:**
- Modify: `src/types.ts`
- Create: `src/data/items.ts`
- Test: `src/game/__tests__/StatsEngine.test.ts`
- Create: `src/game/StatsEngine.ts`

- [ ] **Step 1: Add passive item types to types.ts**

```ts
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: 'healing' | 'stat' | 'utility';
  maxLevel: number;
  stats: Partial<Record<StatKey, number>>;  // bonus per level
}

export interface ItemInstance {
  definitionId: string;
  level: number;
}

export type StatKey =
  | 'might' | 'armor' | 'maxHp' | 'recovery'
  | 'speed' | 'area' | 'cooldown' | 'amount'
  | 'moveSpeed' | 'magnet' | 'luck' | 'growth';
```

Update `LevelUpOption`:
```ts
export interface LevelUpOption {
  type: 'new_weapon' | 'upgrade_weapon' | 'new_item' | 'upgrade_item';
  weaponId?: string;
  itemId?: string;
  level: number;
}
```

- [ ] **Step 2: Create items.ts with 8 passive items**

Create `src/data/items.ts`:

```ts
import type { ItemDefinition } from '../types';

export const ITEMS: Record<string, ItemDefinition> = {
  energy_cell: {
    id: 'energy_cell',
    name: 'Energy Cell',
    description: 'Increases damage output.',
    category: 'stat',
    maxLevel: 5,
    stats: { might: 10 },  // +10% per level
  },
  shield_matrix: {
    id: 'shield_matrix',
    name: 'Shield Matrix',
    description: 'Reduces incoming damage.',
    category: 'stat',
    maxLevel: 5,
    stats: { armor: 1 },
  },
  targeting_chip: {
    id: 'targeting_chip',
    name: 'Targeting Chip',
    description: 'Increases attack speed.',
    category: 'stat',
    maxLevel: 5,
    stats: { cooldown: -5 },  // -5% cooldown per level
  },
  nano_repair: {
    id: 'nano_repair',
    name: 'Nano Repair',
    description: 'Slowly regenerates health.',
    category: 'healing',
    maxLevel: 5,
    stats: { recovery: 0.3 },  // +0.3 HP/sec per level
  },
  cyber_boots: {
    id: 'cyber_boots',
    name: 'Cyber Boots',
    description: 'Move faster.',
    category: 'stat',
    maxLevel: 5,
    stats: { moveSpeed: 8 },  // +8% per level
  },
  magnet_implant: {
    id: 'magnet_implant',
    name: 'Magnet Implant',
    description: 'Increases pickup range.',
    category: 'utility',
    maxLevel: 5,
    stats: { magnet: 20 },  // +20% per level
  },
  growth_serum: {
    id: 'growth_serum',
    name: 'Growth Serum',
    description: 'Gain more XP from gems.',
    category: 'utility',
    maxLevel: 5,
    stats: { growth: 8 },  // +8% per level
  },
  holo_armor: {
    id: 'holo_armor',
    name: 'Holo Armor',
    description: 'Increases maximum HP.',
    category: 'healing',
    maxLevel: 5,
    stats: { maxHp: 15 },  // +15% per level
  },
};

export const ALL_ITEM_IDS = Object.keys(ITEMS);
```

- [ ] **Step 3: Write StatsEngine tests**

Create `src/game/__tests__/StatsEngine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computePlayerStats } from '../StatsEngine';
import type { ItemInstance } from '../../types';

describe('computePlayerStats', () => {
  it('returns base stats with no items', () => {
    const stats = computePlayerStats([]);
    expect(stats.might).toBe(0);
    expect(stats.armor).toBe(0);
    expect(stats.recovery).toBe(0);
  });

  it('applies single item bonuses', () => {
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const stats = computePlayerStats(items);
    expect(stats.might).toBe(30);  // 10 * 3
  });

  it('stacks multiple items', () => {
    const items: ItemInstance[] = [
      { definitionId: 'energy_cell', level: 2 },
      { definitionId: 'shield_matrix', level: 3 },
    ];
    const stats = computePlayerStats(items);
    expect(stats.might).toBe(20);
    expect(stats.armor).toBe(3);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npx vitest run src/game/__tests__/StatsEngine.test.ts
```

- [ ] **Step 5: Implement StatsEngine**

Create `src/game/StatsEngine.ts`:

```ts
import type { ItemInstance, StatKey } from '../types';
import { ITEMS } from '../data/items';

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

const ZERO_STATS: ComputedStats = {
  might: 0, armor: 0, maxHp: 0, recovery: 0,
  speed: 0, area: 0, cooldown: 0, amount: 0,
  moveSpeed: 0, magnet: 0, luck: 0, growth: 0,
};

export function computePlayerStats(items: ItemInstance[]): ComputedStats {
  const stats = { ...ZERO_STATS };

  for (const item of items) {
    const def = ITEMS[item.definitionId];
    if (!def) continue;

    for (const [key, value] of Object.entries(def.stats)) {
      if (value !== undefined && key in stats) {
        stats[key as keyof ComputedStats] += value * item.level;
      }
    }
  }

  return stats;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/game/__tests__/StatsEngine.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/data/items.ts src/game/StatsEngine.ts src/game/__tests__/StatsEngine.test.ts
git commit -m "Add passive item system with 8 items and stats engine"
```

---

## Chunk 2: Store Integration and Level-Up Expansion

### Task 3: Integrate Items into Game Store

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/stores/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Add items state and actions to store**

Add to `GameState` interface:
```ts
items: ItemInstance[];
rerollCount: number;
skipCount: number;
banishCount: number;
banishedIds: string[];  // weapon/item IDs permanently removed from pool
```

Add actions:
```ts
addItem: (item: ItemInstance) => void;
upgradeItem: (id: string) => void;
reroll: () => void;
skip: () => void;
banish: (id: string) => void;
```

- [ ] **Step 2: Update startRun to initialize items and tool counts**

```ts
startRun: () => set({
  // ...existing...
  items: [],
  rerollCount: 3,
  skipCount: 3,
  banishCount: 3,
  banishedIds: [],
}),
```

Also update `reset()` similarly.

- [ ] **Step 3: Update generateLevelUpOptions to include items**

Import `ITEMS`, `ALL_ITEM_IDS` from data/items. The function should:
- Offer weapon upgrades (existing)
- Offer new weapons if weapon slots < 6 (existing, use BASE_WEAPON_IDS, filter banished)
- Offer item upgrades for owned items below max level
- Offer new items if item slots < 6 (filter banished)
- Shuffle all options and pick 3

- [ ] **Step 4: Implement selectLevelUpOption for items**

Handle `new_item` and `upgrade_item` option types.

- [ ] **Step 5: Implement reroll, skip, banish actions**

```ts
reroll: () => set((state) => {
  if (state.rerollCount <= 0) return {};
  const options = generateLevelUpOptions(state.weapons, state.items, state.banishedIds);
  return { levelUpOptions: options, rerollCount: state.rerollCount - 1 };
}),
skip: () => set((state) => {
  if (state.skipCount <= 0) return {};
  return { phase: 'playing', levelUpOptions: [], skipCount: state.skipCount - 1 };
}),
banish: (id) => set((state) => {
  if (state.banishCount <= 0) return {};
  return {
    banishedIds: [...state.banishedIds, id],
    banishCount: state.banishCount - 1,
  };
}),
```

- [ ] **Step 6: Write tests for new store features**

Add to `src/stores/__tests__/useGameStore.test.ts`:

```ts
it('selectLevelUpOption adds new item', () => {
  useGameStore.getState().startRun();
  useGameStore.getState().selectLevelUpOption({
    type: 'new_item', itemId: 'energy_cell', level: 1,
  });
  expect(useGameStore.getState().items).toHaveLength(1);
});

it('reroll generates new options and decrements count', () => {
  useGameStore.getState().startRun();
  // Trigger level up
  useGameStore.getState().addXP(100);
  const beforeCount = useGameStore.getState().rerollCount;
  useGameStore.getState().reroll();
  expect(useGameStore.getState().rerollCount).toBe(beforeCount - 1);
});

it('skip resumes playing and decrements count', () => {
  useGameStore.getState().startRun();
  useGameStore.getState().addXP(100);
  useGameStore.getState().skip();
  expect(useGameStore.getState().phase).toBe('playing');
});
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add src/stores/useGameStore.ts src/stores/__tests__/useGameStore.test.ts
git commit -m "Integrate passive items, reroll, skip, banish into game store"
```

---

### Task 4: Apply Item Stats to Gameplay

**Files:**
- Modify: `src/components/Projectiles.tsx` (use might, cooldown, area from items)
- Modify: `src/components/XPGems.tsx` (use magnet, growth from items)
- Modify: `src/components/Enemies.tsx` (use recovery for HP regen)
- Modify: `src/components/Player.tsx` (use moveSpeed from items)

- [ ] **Step 1: Create a hook to get computed stats**

Create `src/hooks/useComputedStats.ts`:

```ts
import { useGameStore } from '../stores/useGameStore';
import { computePlayerStats } from '../game/StatsEngine';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  return computePlayerStats(items);
}
```

- [ ] **Step 2: Apply stats in Projectiles.tsx**

In the weapon fire logic:
- Multiply `getWeaponDamage()` might parameter by `(player.might + stats.might)`
- Multiply cooldown by `(1 + stats.cooldown / 100)` (negative cooldown = faster)
- Multiply area by `(1 + stats.area / 100)`

- [ ] **Step 3: Apply magnet and growth in XPGems.tsx**

- `MAGNET_RADIUS` becomes `MAGNET_RADIUS * (1 + stats.magnet / 100)`
- XP gained becomes `gem.value * (1 + stats.growth / 100)`

- [ ] **Step 4: Apply moveSpeed in Player.tsx**

- Player speed becomes `player.speed * (1 + stats.moveSpeed / 100)`

- [ ] **Step 5: Apply recovery in GameLoop.tsx**

Add HP recovery per second: if `stats.recovery > 0`, heal player by `stats.recovery * delta` each frame, capped at maxHp.

- [ ] **Step 6: Apply maxHp bonus**

When computing effective maxHp: `player.maxHp * (1 + stats.maxHp / 100)`. Apply in store or as a derived value read by HUD.

- [ ] **Step 7: Verify the game works with items**

```bash
npx tsc --noEmit && npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useComputedStats.ts src/components/ src/stores/
git commit -m "Apply passive item stats to gameplay systems"
```

---

## Chunk 3: Level-Up UI and Boss System

### Task 5: Update Level-Up Screen with Items and Tools

**Files:**
- Modify: `src/ui/LevelUpScreen.tsx`
- Modify: `src/data/items.ts` (export for UI)

- [ ] **Step 1: Update OptionCard to handle item options**

The card should display item name, description, stat bonuses, and level. Color-code: weapons cyan, items magenta.

- [ ] **Step 2: Add reroll, skip, banish buttons**

Below the cards, add a row of 3 buttons:
- REROLL (remaining: N) — calls `reroll()`
- SKIP (remaining: N) — calls `skip()`
- BANISH — enters banish mode where clicking a card banishes that weapon/item ID

Style: small text buttons with counts, disabled (opacity 0.3) when count = 0.

- [ ] **Step 3: Verify on mobile**

Test that all buttons are tappable and the UI doesn't overflow on small screens.

- [ ] **Step 4: Commit**

```bash
git add src/ui/LevelUpScreen.tsx
git commit -m "Add items and reroll/skip/banish to level-up screen"
```

---

### Task 6: Boss Enemies

**Files:**
- Modify: `src/data/enemies.ts`
- Create: `src/game/BossManager.ts`
- Test: `src/game/__tests__/BossManager.test.ts`
- Modify: `src/components/Enemies.tsx`

- [ ] **Step 1: Add boss enemy definitions**

Add to `src/data/enemies.ts`:

```ts
export interface EnemyDefinition {
  // Add to existing:
  isBoss?: boolean;
  bossScale?: number;  // visual size multiplier
}

sentinel: {
  id: 'sentinel',
  name: 'Sentinel',
  hp: 500,
  damage: 15,
  speed: 1.5,
  xpValue: 20,
  color: '#ff8800',
  emissive: '#ff6600',
  scale: 1.2,
  isBoss: true,
  bossScale: 2.5,
},
```

- [ ] **Step 2: Write BossManager tests**

Create `src/game/__tests__/BossManager.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldSpawnBoss, getBossSpawnMinutes } from '../BossManager';

describe('shouldSpawnBoss', () => {
  it('spawns boss at minute 2', () => {
    expect(shouldSpawnBoss(120, 119)).toBe(true);
  });
  it('does not spawn boss mid-minute', () => {
    expect(shouldSpawnBoss(90, 89)).toBe(false);
  });
  it('spawns boss at minute 4', () => {
    expect(shouldSpawnBoss(240, 239)).toBe(true);
  });
});
```

- [ ] **Step 3: Implement BossManager**

Create `src/game/BossManager.ts`:

```ts
// Bosses spawn at minutes 2, 4, 6, 8 (every 2 minutes for 5-min run, adjust later)
const BOSS_SPAWN_MINUTES = [2, 4];

export function getBossSpawnMinutes(): number[] {
  return BOSS_SPAWN_MINUTES;
}

export function shouldSpawnBoss(currentTime: number, previousTime: number): boolean {
  for (const minute of BOSS_SPAWN_MINUTES) {
    const threshold = minute * 60;
    if (previousTime < threshold && currentTime >= threshold) {
      return true;
    }
  }
  return false;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/__tests__/BossManager.test.ts
```

- [ ] **Step 5: Integrate boss spawning into Enemies.tsx**

In the useFrame loop, after regular spawning:
- Track `previousTime` in a ref
- Call `shouldSpawnBoss(elapsedTime, previousTime)`
- If true, spawn a sentinel boss at a random edge position
- Bosses use the `isBoss` flag — render with `bossScale` size and different color

- [ ] **Step 6: Commit**

```bash
git add src/data/enemies.ts src/game/BossManager.ts src/game/__tests__/BossManager.test.ts src/components/Enemies.tsx
git commit -m "Add boss enemy spawning at timed intervals"
```

---

### Task 7: Treasure Chests and Weapon Evolution

**Files:**
- Modify: `src/types.ts` (add ChestInstance)
- Create: `src/game/EvolutionSystem.ts`
- Test: `src/game/__tests__/EvolutionSystem.test.ts`
- Create: `src/components/Chests.tsx`
- Modify: `src/stores/useGameStore.ts` (chest state, evolution action)
- Modify: `src/components/Projectiles.tsx` (bosses drop chests on death)
- Modify: `src/App.tsx`

- [ ] **Step 1: Add chest types**

In `src/types.ts`:

```ts
export type ChestType = 'bronze' | 'silver';

export interface ChestInstance {
  id: string;
  position: Vec3;
  type: ChestType;
}
```

- [ ] **Step 2: Write EvolutionSystem tests**

Create `src/game/__tests__/EvolutionSystem.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { checkEvolution } from '../EvolutionSystem';
import type { WeaponInstance, ItemInstance } from '../../types';

describe('checkEvolution', () => {
  it('returns evolution when weapon is max level and has matching item', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 7 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).not.toBeNull();
    expect(result!.evolvedWeaponId).toBe('plasma_storm');
  });

  it('returns null for bronze chest', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 7 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'bronze');
    expect(result).toBeNull();
  });

  it('returns null when weapon not max level', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 5 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).toBeNull();
  });

  it('returns null when matching item not owned', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 7 }];
    const items: ItemInstance[] = [];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: Implement EvolutionSystem**

Create `src/game/EvolutionSystem.ts`:

```ts
import type { WeaponInstance, ItemInstance, ChestType } from '../types';
import { WEAPONS } from '../data/weapons';

export interface EvolutionResult {
  baseWeaponId: string;
  evolvedWeaponId: string;
  consumedItemId: string;
}

export function checkEvolution(
  weapons: WeaponInstance[],
  items: ItemInstance[],
  chestType: ChestType
): EvolutionResult | null {
  if (chestType !== 'silver') return null;

  const itemIds = new Set(items.map(i => i.definitionId));

  for (const weapon of weapons) {
    const def = WEAPONS[weapon.definitionId];
    if (!def?.evolvesInto || !def.evolutionItemId) continue;
    if (weapon.level < def.maxLevel) continue;
    if (!itemIds.has(def.evolutionItemId)) continue;

    return {
      baseWeaponId: weapon.definitionId,
      evolvedWeaponId: def.evolvesInto,
      consumedItemId: def.evolutionItemId,
    };
  }

  return null;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/__tests__/EvolutionSystem.test.ts
```

- [ ] **Step 5: Add chest state and evolveWeapon action to store**

Add to store state:
```ts
chests: ChestInstance[];
addChest: (chest: ChestInstance) => void;
removeChest: (id: string) => void;
collectChest: (id: string) => void;  // triggers evolution check or random level-up
```

`collectChest` should:
1. Get chest type
2. Call `checkEvolution(weapons, items, chestType)`
3. If evolution found: replace base weapon with evolved weapon, remove consumed item
4. If no evolution: level up a random owned weapon or item by 1

- [ ] **Step 6: Create Chests.tsx component**

Create `src/components/Chests.tsx`:
- InstancedMesh with box geometry
- Bronze = orange emissive, Silver = white/silver emissive
- Player picks up chest when within distance 1.5
- On pickup, call `collectChest(id)`

- [ ] **Step 7: Update Projectiles.tsx — bosses drop chests on death**

When an enemy dies and `ENEMIES[enemy.definitionId]?.isBoss`, add a chest:
- If `elapsedTime < 120` → bronze chest
- If `elapsedTime >= 120` → silver chest

- [ ] **Step 8: Add Chests to App.tsx**

Import and add `<Chests />` to GameScene.

- [ ] **Step 9: Run all tests and verify**

```bash
npx vitest run && npx tsc --noEmit
```

- [ ] **Step 10: Commit**

```bash
git add src/types.ts src/game/EvolutionSystem.ts src/game/__tests__/EvolutionSystem.test.ts src/components/Chests.tsx src/stores/useGameStore.ts src/components/Projectiles.tsx src/App.tsx
git commit -m "Add treasure chests, weapon evolution system, and boss chest drops"
```

---

## Chunk 4: HUD Updates and Timer Extension

### Task 8: Update HUD with Items Display

**Files:**
- Modify: `src/ui/HUD.tsx`

- [ ] **Step 1: Add items display to HUD**

Add a second row at the bottom showing equipped passive items with names and levels, similar to the weapons row but in magenta color.

- [ ] **Step 2: Show evolution notification**

When a weapon evolves (via chest), briefly flash a notification banner: "EVOLVED: [weapon name]!" in gold for 3 seconds. Track this in a local state or store field.

- [ ] **Step 3: Commit**

```bash
git add src/ui/HUD.tsx
git commit -m "Add passive items display and evolution notification to HUD"
```

---

### Task 9: Extend Timer and Add Multiple Enemy Types

**Files:**
- Modify: `src/data/enemies.ts`
- Modify: `src/game/WaveManager.ts`
- Modify: `src/stores/useGameStore.ts` (timer 300→900 for 15 min)
- Modify: `src/components/Enemies.tsx`

- [ ] **Step 1: Add 2 more enemy types**

Add to enemies.ts:
```ts
speeder: {
  id: 'speeder',
  name: 'Speeder',
  hp: 10,
  damage: 3,
  speed: 5.0,
  xpValue: 2,
  color: '#00ff88',
  emissive: '#00cc66',
  scale: 0.35,
},
tank: {
  id: 'tank',
  name: 'Tank',
  hp: 80,
  damage: 10,
  speed: 1.2,
  xpValue: 5,
  color: '#8844ff',
  emissive: '#6622cc',
  scale: 0.8,
},
```

- [ ] **Step 2: Update WaveManager to spawn different enemy types by minute**

```ts
export function getEnemyTypeForTime(elapsedTime: number): string {
  if (elapsedTime < 60) return 'drone';
  if (elapsedTime < 180) return Math.random() < 0.7 ? 'drone' : 'speeder';
  return Math.random() < 0.5 ? 'drone' : Math.random() < 0.5 ? 'speeder' : 'tank';
}
```

- [ ] **Step 3: Update Enemies.tsx to handle multiple enemy types**

Instead of hardcoding `drone`, look up the enemy definition by `definitionId` for speed and contact damage. Use different colors per type in the instanced mesh via `setColorAt`.

- [ ] **Step 4: Extend run timer to 15 minutes (900 seconds)**

In `useGameStore.ts`, change `300` to `900` in the `tick` action.

- [ ] **Step 5: Update boss spawn times**

In `BossManager.ts`, update spawn times for 15-minute run:
```ts
const BOSS_SPAWN_MINUTES = [3, 5, 7, 10, 13];
```

- [ ] **Step 6: Run all tests and verify**

```bash
npx vitest run && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/data/enemies.ts src/game/WaveManager.ts src/game/BossManager.ts src/stores/useGameStore.ts src/components/Enemies.tsx
git commit -m "Add speeder and tank enemies, extend run to 15 minutes"
```

---

### Task 10: Final Assembly and Push

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

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
1. 8 weapons appear in level-up options (no evolved weapons)
2. Passive items appear in level-up options
3. Reroll, skip, banish buttons work
4. Items affect gameplay (speed, damage, pickup radius, etc.)
5. Bosses spawn at minute marks
6. Bosses drop chests
7. Picking up silver chest with max weapon + matching item triggers evolution
8. HUD shows items row
9. Multiple enemy types appear over time
10. Run lasts 15 minutes

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "Complete Phase 2: build crafting with items, evolution, bosses, and chests"
git push origin main
```
