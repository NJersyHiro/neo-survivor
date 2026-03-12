# Phase 3B: Characters, Unlocks & Upgrades — Design Spec

## Goal

Add 8 playable characters with unique stats and starting weapons, an achievement-based unlock system with credit purchase alternative, and per-character upgrade levels. No special attacks.

## Architecture

- **Character definitions** in `src/data/characters.ts` — pure data, no React
- **useMetaStore** extended — selected character, unlock state, character levels, new lifetime stats
- **StatsEngine** extended — accepts character base stats + character upgrade bonuses
- **SaveData v2** — migration from v1, adds character fields

---

## Character Roster

8 characters. Kai is unlocked by default. Others unlocked via achievements or credit purchase.

Each character's starting weapon maps to an existing weapon in `src/data/weapons.ts`:

| # | ID | Name | Starting Weapon | Weapon Name | Archetype |
|---|-----|------|----------------|-------------|-----------|
| 1 | `kai` | Kai | `plasma_bolt` | Plasma Bolt | Balanced |
| 2 | `vex` | Vex | `neon_whip` | Neon Whip | Melee/Speed |
| 3 | `rhea` | Rhea | `cyber_shuriken` | Cyber Shuriken | Multishot |
| 4 | `zion` | Zion | `pulse_rifle` | Pulse Rifle | Sniper |
| 5 | `nova` | Nova | `blade_drone` | Blade Drone | Summoner |
| 6 | `tank` | Tank | `ion_orbit` | Ion Orbit | Tank |
| 7 | `sage` | Sage | `volt_chain` | Volt Chain | Glass Cannon |
| 8 | `flux` | Flux | `gravity_bomb` | Gravity Bomb | Utility |

### Base Stats

All values are modifiers applied on top of default player stats. `maxHp` is absolute (replaces default 100). `armor` and `recovery` are flat additions. All others are percentage modifiers added to the stat accumulator in `ComputedStats`.

| Stat | Kai | Vex | Rhea | Zion | Nova | Tank | Sage | Flux |
|------|-----|-----|------|------|------|------|------|------|
| maxHp | 100 | 85 | 100 | 90 | 100 | 130 | 75 | 95 |
| armor | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| recovery | 0 | 0 | 0 | 0 | 0.2 | 0.3 | 0 | 0 |
| might | 0 | 0 | 10 | 25 | -10 | 0 | 30 | -10 |
| moveSpeed | 0 | 20 | -10 | 0 | 0 | -15 | 0 | 0 |
| cooldown | 0 | 0 | 0 | 0 | -20 | 0 | 0 | 0 |
| area | 0 | 0 | 15 | -20 | 0 | 10 | 0 | 0 |
| magnet | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 25 |
| growth | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 15 |
| luck | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 10 |

Note: Nova's `cooldown: -20` means 20% faster cooldowns (matching the convention in `overclocking` shop upgrade where negative = faster).

### Character Definition Type

```ts
const MAX_CHARACTER_LEVEL = 5;

interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  startingWeaponId: string;  // must exist in WEAPONS
  baseStats: Partial<Record<StatKey, number>>;
  unlockCondition: {
    stat: string;       // key in lifetime stats to check
    threshold: number;  // value that must be reached
    description: string; // human-readable condition
  } | null;             // null = unlocked by default (Kai)
  creditCost: number;   // alternative unlock price, 0 for Kai
}
```

`MAX_CHARACTER_LEVEL` is a constant (5), not a per-character field since all characters share the same max.

---

## Character Unlock System

### Unlock Conditions

| Character | Condition | Stat Key | Threshold | Credit Cost |
|-----------|-----------|----------|-----------|-------------|
| Kai | Default | — | — | 0 |
| Vex | Survive 5 minutes in a single run | `bestTime` | 300 | 1,500 |
| Rhea | Kill 300 total enemies | `totalKills` | 300 | 1,500 |
| Zion | Reach player level 15 in a run | `bestLevel` | 15 | 2,000 |
| Nova | Complete 10 runs | `totalRuns` | 10 | 2,000 |
| Tank | Take 1,000 total damage | `totalDamageTaken` | 1000 | 2,500 |
| Sage | Kill a boss enemy | `totalBossKills` | 1 | 2,500 |
| Flux | Collect 500 total XP gems | `totalXPGemsCollected` | 500 | 3,000 |

### Unlock Flow

1. Run ends → `recordRunStats()` updates lifetime stats
2. `checkUnlocks()` called after `recordRunStats()`, returns array of newly unlocked character IDs
3. For each locked character, compare `stats[condition.stat] >= condition.threshold`
4. Auto-unlock any characters whose conditions are met (add to `unlockedIds`)
5. Auto-save after unlocking
6. Results screen shows "CHARACTER UNLOCKED: [Name]!" banner for newly unlocked characters

### Credit Purchase

Players can also unlock characters directly by spending credits from the Main Menu character selection UI.

```ts
unlockCharacter(id: string): boolean
```
- Checks character exists, is locked, and player can afford `creditCost`
- Deducts credits, adds id to `unlockedIds`, saves
- Returns false if can't afford or already unlocked

---

## Character Upgrade System

After unlocking, characters can be upgraded 5 times with credits.

### Per-Level Bonus

Each upgrade level grants:
- +2 Max HP (flat)
- +2% Might
- +2% Move Speed

### Cost Formula

`cost(level) = 500 * level`

- Level 1: 500, Level 2: 1000, Level 3: 1500, Level 4: 2000, Level 5: 2500
- Total per character: 7,500 credits

### Action

```ts
upgradeCharacter(id: string): boolean
```
- Checks character is unlocked, not max level, and player can afford cost
- Deducts credits, increments `characterLevels[id]`, saves
- Returns false if can't afford or already maxed

### Storage

`characterLevels: Record<string, number>` in `useMetaStore` and `SaveData`.

---

## New Lifetime Stats

### Added to useMetaStore.stats

```ts
stats: {
  totalKills: number;           // existing
  totalRuns: number;            // existing
  totalTimePlayed: number;      // existing
  totalDamageTaken: number;     // NEW
  totalBossKills: number;       // NEW
  totalXPGemsCollected: number; // NEW
  bestTime: number;             // NEW — longest single run in seconds
  bestLevel: number;            // NEW — highest level reached in a single run
}
```

### Per-Run Counters (useGameStore)

New fields in `GameState`, reset each run in `startRun()` and `reset()`:

```ts
damageTaken: number;       // incremented in takeDamage()
bossKills: number;         // incremented in damageEnemy() when boss dies
xpGemsCollected: number;   // incremented when XP gem is collected
```

These are passed to `recordRunStats()` at run end alongside existing `killCount`, `elapsedTime`, `creditsEarned`.

### Updated recordRunStats Signature

```ts
recordRunStats(kills: number, time: number, creditsEarned: number, extras: {
  damageTaken: number;
  bossKills: number;
  xpGemsCollected: number;
  playerLevel: number;
}): void
```

Implementation:
- Adds `extras.damageTaken` to `totalDamageTaken`
- Adds `extras.bossKills` to `totalBossKills`
- Adds `extras.xpGemsCollected` to `totalXPGemsCollected`
- Updates `bestTime = Math.max(state.stats.bestTime, time)`
- Updates `bestLevel = Math.max(state.stats.bestLevel, extras.playerLevel)`

---

## StatsEngine Update

### New Signature

```ts
computePlayerStats(
  items: ItemInstance[],
  shopUpgrades?: Record<string, number>,
  characterStats?: Partial<Record<StatKey, number>>,
  characterUpgradeLevel?: number
): ComputedStats
```

### Application Order

1. Start with base stats (all zeros for percentage stats)
2. Add character base stat modifiers (percentage stats added to accumulator)
3. Add character upgrade bonuses (+2 might per level, +2 moveSpeed per level)
4. Add passive item bonuses
5. Add shop upgrade bonuses

All percentage stats stack additively. Character `maxHp` replaces default 100 in the player state, not in ComputedStats. `armor` and `recovery` from character stats are flat additions to ComputedStats.

### Character Upgrade Bonuses

```ts
if (characterUpgradeLevel) {
  stats.might += characterUpgradeLevel * 2;
  stats.moveSpeed += characterUpgradeLevel * 2;
}
```

MaxHp from character upgrades: `characterDef.baseStats.maxHp + (2 * characterUpgradeLevel)` — applied in `startRun()` when setting `player.maxHp` and `player.hp`.

---

## useMetaStore Changes

### New State Fields

```ts
interface MetaState {
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
  selectedCharacterId: string;      // NEW — default 'kai'
  characterLevels: Record<string, number>; // NEW — characterId → level
  // ... actions
}
```

### New Actions

```ts
selectCharacter(id: string): void      // sets selectedCharacterId, saves
unlockCharacter(id: string): boolean   // deducts credits, adds to unlockedIds, saves
upgradeCharacter(id: string): boolean  // deducts credits, increments level, saves
checkUnlocks(): string[]               // returns newly unlocked character IDs
```

### Updated createDefaultState

```ts
function createDefaultState() {
  return {
    credits: 0,
    upgrades: {} as Record<string, number>,
    stats: {
      totalKills: 0, totalRuns: 0, totalTimePlayed: 0,
      totalDamageTaken: 0, totalBossKills: 0, totalXPGemsCollected: 0,
      bestTime: 0, bestLevel: 0,
    },
    unlockedIds: ['kai'],
    selectedCharacterId: 'kai',
    characterLevels: {} as Record<string, number>,
  };
}
```

### Updated stateToSaveData

Must include all new fields and output `version: 2`:

```ts
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
```

---

## SaveData v2

### Updated Shape

```ts
interface SaveData {
  version: 1 | 2;  // union type to support migration
  credits: number;
  upgrades: Record<string, number>;
  stats: {
    totalKills: number;
    totalRuns: number;
    totalTimePlayed: number;
    totalDamageTaken?: number;      // optional for v1 compat
    totalBossKills?: number;
    totalXPGemsCollected?: number;
    bestTime?: number;
    bestLevel?: number;
  };
  unlockedIds: string[];
  selectedCharacterId?: string;     // optional for v1 compat
  characterLevels?: Record<string, number>;
}
```

### Migration

The current `load()` returns `null` when version doesn't match. This must be replaced with a migration pipeline:

```ts
async load(): Promise<SaveData | null> {
  // ... parse from localStorage ...
  if (!data) return null;

  // Migrate v1 → v2
  if (data.version === 1) {
    data.version = 2;
    data.stats.totalDamageTaken = data.stats.totalDamageTaken ?? 0;
    data.stats.totalBossKills = data.stats.totalBossKills ?? 0;
    data.stats.totalXPGemsCollected = data.stats.totalXPGemsCollected ?? 0;
    data.stats.bestTime = data.stats.bestTime ?? 0;
    data.stats.bestLevel = data.stats.bestLevel ?? 0;
    data.selectedCharacterId = 'kai';
    data.characterLevels = {};
    if (!data.unlockedIds.includes('kai')) {
      data.unlockedIds.push('kai');
    }
    await this.save(data);  // persist migration
  }

  // Unknown future version → return null
  if (data.version !== 2) return null;

  return data;
}
```

---

## startRun() Changes

`useGameStore.startRun()` must read the selected character from `useMetaStore`:

```ts
startRun: () => {
  const meta = useMetaStore.getState();
  const characterId = meta.selectedCharacterId;
  const characterDef = CHARACTERS[characterId];
  const characterLevel = meta.characterLevels[characterId] ?? 0;
  const baseMaxHp = (characterDef?.baseStats.maxHp ?? 100) + characterLevel * 2;
  const startingWeaponId = characterDef?.startingWeaponId ?? 'plasma_bolt';

  set({
    phase: 'playing',
    player: {
      position: { x: 0, y: 0, z: 0 },
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      level: 1,
      xp: 0,
      speed: 5,
      might: 0,
    },
    weapons: [{ definitionId: startingWeaponId, level: 1 }],
    // ... reset all other fields including new per-run counters
    damageTaken: 0,
    bossKills: 0,
    xpGemsCollected: 0,
    creditsEarned: 0,
    reviveCount: meta.upgrades.revival_kit ?? 0,
    rerollCount: 3 + (meta.upgrades.extra_reroll ?? 0),
    // ...
  });
}
```

---

## useComputedStats Update

```ts
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

---

## UI Changes

### Main Menu — PLAY Tab

- Below START RUN button: horizontal scrollable row of character cards
- Each card: character name, starting weapon name, 2-3 key stat highlights
- Locked cards: dimmed, show unlock condition + "BUY [cost]" button
- Selected card: cyan border glow
- Tapping an unlocked card selects it and calls `useMetaStore.selectCharacter(id)`

### Main Menu — SHOP Tab

- Below existing upgrade grid: "CHARACTERS" section header
- Shows unlocked characters as cards with current level (e.g., "Lv 2/5")
- "UPGRADE [cost]" button on each card
- Maxed characters (level 5) show "MAX" badge, disabled button

### Results Screen

- `handleEnd()` calls `recordRunStats()` then `checkUnlocks()`
- If `checkUnlocks()` returns non-empty array, show "CHARACTER UNLOCKED: [Name]!" banner
- Banner appears briefly before credits breakdown

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/data/characters.ts` | Create | 8 character definitions with `CHARACTERS` record |
| `src/stores/useMetaStore.ts` | Modify | Add selectedCharacterId, characterLevels, new stats, selectCharacter(), unlockCharacter(), upgradeCharacter(), checkUnlocks(), update stateToSaveData(), createDefaultState(), recordRunStats() |
| `src/stores/useGameStore.ts` | Modify | Add per-run counters (damageTaken, bossKills, xpGemsCollected), startRun() reads character and sets startingWeaponId + baseMaxHp, increment counters in takeDamage()/damageEnemy() |
| `src/game/StatsEngine.ts` | Modify | Accept characterStats + characterUpgradeLevel parameters |
| `src/game/SaveManager.ts` | Modify | SaveData v2 type with optional fields, migration pipeline in load() |
| `src/hooks/useComputedStats.ts` | Modify | Pass character stats and level to StatsEngine |
| `src/ui/MainMenu.tsx` | Modify | Character selection row on PLAY tab |
| `src/ui/ShopScreen.tsx` | Modify | Character upgrade section |
| `src/ui/ResultsScreen.tsx` | Modify | Unlock banner, pass extras to recordRunStats() |
| `src/components/XPGems.tsx` | Modify | Increment xpGemsCollected counter on gem pickup |
| `src/game/__tests__/StatsEngine.test.ts` | Modify | Test character stat stacking |
| `src/stores/__tests__/useGameStore.test.ts` | Modify | Test per-run counters, character-based startRun |
| `src/stores/__tests__/useMetaStore.test.ts` | Create | Test unlock, upgrade, migration, checkUnlocks |

---

## Out of Scope

- Special attacks / ultimate abilities (removed per user request)
- Character 3D models (Phase 5 — use colored capsule placeholders)
- Character-specific passive skills
- Gacha / random pulls (characters are deterministic unlock or purchase)
