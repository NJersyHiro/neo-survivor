# Phase 3A: Meta-Progression — Save System, Currency, Shop, Main Menu

## Goal

Add permanent between-run progression so players want to do "one more run." Credits earned during runs are spent in a shop on permanent stat upgrades. Progress persists across sessions.

## Architecture

### Separation of Concerns

- **useGameStore** — in-run state only (unchanged)
- **useMetaStore** (new) — between-run state: credits, shop upgrades, lifetime stats
- **SaveManager** (new) — persistence abstraction over localStorage (swappable to Capacitor Preferences in Phase 6)
- **StatsEngine** (updated) — computes bonuses from both passive items AND shop upgrades

### Data Flow

```
App loads → SaveManager.load() → useMetaStore hydrates
Menu: PLAY → useGameStore.startRun() (shop stats applied via StatsEngine)
Menu: SHOP → spend credits → useMetaStore updates → SaveManager.save()
Run ends → credits earned → useMetaStore.addCredits() → SaveManager.save()
```

---

## Save System

### SaveManager (`src/game/SaveManager.ts`)

Interface-based abstraction with three methods:

- `load(): Promise<SaveData | null>` — reads and parses from storage, returns null if no save exists or data is corrupt
- `save(data: SaveData): Promise<void>` — serializes and writes to storage
- `clear(): Promise<void>` — deletes save data

All methods are async to support future Capacitor Preferences API (Phase 6). Current localStorage backend wraps sync calls in `Promise.resolve()`.

Current backend: `localStorage` under key `neo_survivor_save`.
Future backend (Phase 6): Capacitor Preferences API — async interface means zero changes to consumers.

**Error handling**: `load()` wraps `JSON.parse` in try/catch. On parse failure or version mismatch, returns `null` (treats as fresh start). Never throws.

### SaveData Shape

```ts
interface SaveData {
  version: 1;
  credits: number;
  upgrades: Record<string, number>;  // upgradeId → level (0-5)
  stats: {
    totalKills: number;
    totalRuns: number;
    totalTimePlayed: number;
  };
  unlockedIds: string[];  // placeholder for characters/achievements in Phase 3B
}
```

Version field enables future migration. On `load()`, if `version` does not match expected version, return `null` (reset to defaults). Migration functions can be added later if needed.

---

## Currency Economy

### Earning Credits

- **Enemy drops**: Regular enemies drop 1-3 credits on death. Bosses drop 25-50.
- **Run-end bonus**: `base(50) + kills * 0.5 + timeAlive * 0.2`
- A decent 10-minute run earns ~200 total credits.

### Credit Drop Implementation

Credits are NOT physical pickups like XP gems. They accumulate invisibly during the run (increment a counter on enemy kill) and are awarded all at once on the results screen. This keeps the game loop clean — no new pickup entity needed.

### Economy Target

- 10 stat upgrades × 5 levels + 1 reroll upgrade × 5 levels + 1 revival upgrade × 1 level = 56 total purchases
- Cost escalation: `baseCost * level` (linear, not quadratic)
- Full shop cost: ~8,400 credits. At ~200 credits/run, full completion takes ~40 runs (moderate grind)

---

## Shop Upgrades

### Data: `src/data/upgrades.ts`

12 permanent upgrades. Each has 5 levels.

| ID | Name | Stat Key | Bonus/Level | Base Cost |
|----|------|----------|-------------|-----------|
| `power_core` | Power Core | might | +5% | 40 |
| `plating` | Plating | armor | +1 | 40 |
| `vitality` | Vitality | maxHp | +8% | 50 |
| `regenerator` | Regenerator | recovery | +0.2 HP/s | 50 |
| `thrusters` | Thrusters | moveSpeed | +5% | 30 |
| `overclocking` | Overclocking | cooldown | -3% | 60 |
| `sensor_array` | Sensor Array | area | +5% | 40 |
| `tractor_beam` | Tractor Beam | magnet | +10% | 30 |
| `data_miner` | Data Miner | growth | +5% | 30 |
| `fortune_chip` | Fortune Chip | luck | +5% | 20 |
| `extra_reroll` | Extra Reroll | *special* | +1 reroll/run | 60 |
| `revival_kit` | Revival Kit | *special* | 1 revive/run | 80 |

### Upgrade Definition Type

```ts
interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  statKey: StatKey | null;  // null for special upgrades (rerolls, revives)
  bonusPerLevel: number;
  baseCost: number;
  maxLevel: number;         // 5 for most, 1 for revival_kit
}
```

`statKey: null` means the upgrade is handled as a special case — `StatsEngine` skips it, and the bonus is read directly in `startRun` or `takeDamage`.

### Upgrade Descriptions

| ID | Description |
|----|-------------|
| `power_core` | "Permanently increases all damage dealt." |
| `plating` | "Permanently reduces incoming damage." |
| `vitality` | "Permanently increases maximum health." |
| `regenerator` | "Permanently regenerates health each second." |
| `thrusters` | "Permanently increases movement speed." |
| `overclocking` | "Permanently reduces weapon cooldowns." |
| `sensor_array` | "Permanently increases weapon area of effect." |
| `tractor_beam` | "Permanently increases XP gem pickup range." |
| `data_miner` | "Permanently increases XP gained." |
| `fortune_chip` | "Permanently increases luck." |
| `extra_reroll` | "Gain additional rerolls at the start of each run." |
| `revival_kit` | "Revive once per run at 30% HP when killed." |

### Cost Formula

`cost(level) = baseCost * level`

Examples for Power Core (baseCost 40):
- Level 1: 40, Level 2: 80, Level 3: 120, Level 4: 160, Level 5: 200
- Total for one upgrade: 600 credits

### Special Upgrades

- **extra_reroll** (maxLevel: 5): Increases `rerollCount` at run start. Base is 3, each level adds 1.
- **revival_kit** (maxLevel: 1): On death, restore to 30% HP instead of game over. Max 1 revive per run. Single purchase only.

---

## StatsEngine Update

### Current Signature
```ts
computePlayerStats(items: ItemInstance[]): ComputedStats
```

### New Signature
```ts
computePlayerStats(items: ItemInstance[], shopUpgrades?: Record<string, number>): ComputedStats
```

Shop upgrades are converted to bonuses using `UpgradeDefinition.bonusPerLevel * level` and added to the same `ComputedStats` accumulator. Both sources stack additively.

Special upgrades (extra_reroll, revival_kit) are handled separately — they don't map to ComputedStats. They are read directly from `useMetaStore` at run start.

---

## useMetaStore (`src/stores/useMetaStore.ts`)

### State

```ts
interface MetaState {
  credits: number;
  upgrades: Record<string, number>;  // upgradeId → level
  stats: {
    totalKills: number;
    totalRuns: number;
    totalTimePlayed: number;
  };
  unlockedIds: string[];
}
```

### Actions

- `load(): void` — hydrate from SaveManager
- `addCredits(amount: number): void`
- `purchaseUpgrade(id: string): boolean` — checks cost and maxLevel, deducts credits, increments level, saves. Returns false if can't afford.
- `recordRunStats(kills: number, time: number, creditsEarned: number): void` — updates lifetime totals, adds credits, increments totalRuns, saves.
- `getUpgradeLevel(id: string): number` — returns 0 if not purchased
- `reset(): void` — clear all progress (with confirmation in UI)

Every mutating action calls `SaveManager.save()` after updating state.

---

## Main Menu (`src/ui/MainMenu.tsx`)

### Layout

Full-screen overlay displayed when `gamePhase === 'menu'`. Two modes/tabs:

**PLAY Tab (default)**
- Game title "NEO SURVIVOR" in large neon text
- "START RUN" button (large, cyan glow)
- Lifetime stats below: total kills, total runs, total time played
- Credits balance displayed in top-right

**SHOP Tab**
- Credits balance at top
- 4×3 grid of upgrade cards
- Each card shows: upgrade name, current level (pips or "Lv 3/5"), next level cost, BUY button
- Maxed upgrades show "MAX" badge, disabled buy button
- Insufficient credits: buy button disabled, cost shown in red

### Navigation

Two tab buttons at top: PLAY | SHOP. Active tab has neon underline.

---

## Run Integration Changes

### startRun Updates

When starting a run, `useGameStore.startRun()` imports and reads from `useMetaStore.getState()` directly (cross-store read is fine in Zustand since it's just a function call):
- Apply `extra_reroll` upgrade: `rerollCount = 3 + useMetaStore.getState().upgrades.extra_reroll ?? 0`
- Store `reviveCount` from `revival_kit` upgrade level: `reviveCount = useMetaStore.getState().upgrades.revival_kit ?? 0`

### New GameState Fields

Add to `GameState` interface:
```ts
creditsEarned: number;  // accumulated during run, initialized to 0
reviveCount: number;     // from revival_kit upgrade, initialized from useMetaStore
```

Both reset to their initial values in `reset()` and `startRun()`.

### Credits During Run

Credit accumulation happens inside `damageEnemy` in `useGameStore` (single source of truth, avoids duplicating logic across melee/ranged kill paths in Projectiles.tsx). When an enemy dies:
- Regular enemy: `creditsEarned += random(1, 3)`
- Boss enemy (`ENEMIES[id]?.isBoss`): `creditsEarned += random(25, 50)`

This requires importing `ENEMIES` in useGameStore.

### takeDamage Update (Revival)

When HP hits 0, check if `reviveCount > 0`:
- If yes: set HP to 30% of maxHp, decrement reviveCount, flash "REVIVED!" notification. Do NOT transition to gameover.
- If no: gameover as normal.

### Results Screen Update

Show credits earned during the run. Add a "MENU" button alongside existing "RETRY" button. On either button, call `useMetaStore.recordRunStats()` to persist. "MENU" sets phase to `'menu'`, "RETRY" calls `startRun()`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/game/SaveManager.ts` | Create | Persistence abstraction |
| `src/data/upgrades.ts` | Create | 12 upgrade definitions |
| `src/stores/useMetaStore.ts` | Create | Between-run state |
| `src/game/StatsEngine.ts` | Modify | Accept shop upgrades parameter |
| `src/game/__tests__/StatsEngine.test.ts` | Modify | Test shop upgrade stacking |
| `src/stores/useGameStore.ts` | Modify | Add creditsEarned, reviveCount, update startRun |
| `src/stores/__tests__/useGameStore.test.ts` | Modify | Test credits, revival |
| `src/ui/MainMenu.tsx` | Create | Menu with PLAY/SHOP tabs |
| `src/ui/ShopScreen.tsx` | Create | Upgrade purchase UI |
| `src/ui/ResultsScreen.tsx` | Modify | Show credits earned |
| `src/components/Player.tsx` | Modify | moveSpeed already applied via delta multiplier (verify) |
| `src/hooks/useComputedStats.ts` | Modify | Pass shop upgrades to StatsEngine |
| `src/App.tsx` | Modify | Show MainMenu, stop auto-starting run |

---

## Out of Scope (Phase 3B)

- Playable characters and character selection
- Character special attacks
- Gacha system
- Achievement system
- Character-specific starting weapons
