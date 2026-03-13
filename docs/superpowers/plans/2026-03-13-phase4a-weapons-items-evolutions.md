# Phase 4A: Weapons, Items & Evolutions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new weapons, 7 new items, 8 new evolution chains, crit/lifesteal stats, and a VS-style unlock system where all content is earned through gameplay.

**Architecture:** All new content is data-driven in `src/data/`. The unlock system gates which weapons/items appear in the level-up pool via `unlockedWeaponIds`/`unlockedItemIds` in `useMetaStore`. New stats (critChance, lifesteal) are added to `StatKey` and processed in `StatsEngine`/`damageEnemy`. Save data migrates v2→v3.

**Tech Stack:** TypeScript, React, Zustand, Vitest

**Spec:** `docs/superpowers/specs/2026-03-13-phase4a-weapons-items-evolutions-design.md`

---

## Chunk 1: Types, Stats & Data Foundation

### Task 1: Extend StatKey and ComputedStats with critChance and lifesteal

**Files:**
- Modify: `src/types.ts`
- Modify: `src/game/StatsEngine.ts`
- Test: `src/game/__tests__/StatsEngine.test.ts`

- [ ] **Step 1: Add critChance and lifesteal to StatKey**

In `src/types.ts`, extend the `StatKey` union:

```typescript
export type StatKey =
  | 'might' | 'armor' | 'maxHp' | 'recovery'
  | 'speed' | 'area' | 'cooldown' | 'amount'
  | 'moveSpeed' | 'magnet' | 'luck' | 'growth'
  | 'critChance' | 'lifesteal';
```

- [ ] **Step 2: Add critChance and lifesteal to ComputedStats**

In `src/game/StatsEngine.ts`, add to the `ComputedStats` interface:

```typescript
export interface ComputedStats {
  // ... existing 12 fields
  critChance: number;
  lifesteal: number;
}
```

Initialize both to 0 in `computePlayerStats`.

- [ ] **Step 3: Write test for new stats**

In `src/game/__tests__/StatsEngine.test.ts`:

```typescript
it('should compute critChance from items', () => {
  const items: ItemInstance[] = [{ definitionId: 'crit_module', level: 3 }];
  const stats = computePlayerStats(items);
  expect(stats.critChance).toBe(24); // 8 * 3
});

it('should compute lifesteal from items', () => {
  const items: ItemInstance[] = [{ definitionId: 'reflux_core', level: 2 }];
  const stats = computePlayerStats(items);
  expect(stats.lifesteal).toBe(10); // 5 * 2
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/game/__tests__/StatsEngine.test.ts`
Expected: Tests fail because crit_module and reflux_core items don't exist yet. That's OK — these tests validate the stats pipeline once items are added in Task 4.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/game/StatsEngine.ts src/game/__tests__/StatsEngine.test.ts
git commit -m "Add critChance and lifesteal to StatKey and ComputedStats"
```

---

### Task 2: Add UnlockCondition type

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add UnlockCondition type**

In `src/types.ts`, add:

```typescript
export type UnlockCondition =
  | { type: 'character_unlocked'; characterId: string; description: string }
  | { type: 'survive_time'; seconds: number; characterId?: string; description: string }
  | { type: 'reach_level'; level: number; stageId?: string; description: string }
  | { type: 'weapon_level'; weaponId: string; level: number; description: string }
  | { type: 'total_kills'; count: number; description: string }
  | { type: 'total_hp_recovered'; amount: number; description: string }
  | { type: 'max_weapons_held'; count: number; description: string }
  | { type: 'any_weapon_max_level'; description: string }
  | { type: 'any_weapon_evolved'; description: string };
```

- [ ] **Step 2: Add unlockCondition to WeaponDefinition**

```typescript
export interface WeaponDefinition {
  // ... existing fields
  unlockCondition?: UnlockCondition | null;
}
```

- [ ] **Step 3: Add unlockCondition to ItemDefinition**

```typescript
export interface ItemDefinition {
  // ... existing fields
  unlockCondition?: UnlockCondition | null;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "Add UnlockCondition type and unlock fields to weapon/item definitions"
```

---

### Task 3: Add 8 new base weapons to weapons.ts

**Files:**
- Modify: `src/data/weapons.ts`

- [ ] **Step 1: Add flame_thrower, cryo_spike, homing_missile, tesla_coil**

Add to the `WEAPONS` record in `src/data/weapons.ts`:

```typescript
flame_thrower: {
  id: 'flame_thrower', name: 'Flame Thrower', description: 'Continuous cone of fire. Rapid damage ticks.',
  category: 'melee', baseDamage: 3, cooldown: 0.15, projectileSpeed: 0, area: 2.0,
  pierce: 1, amount: 1, maxLevel: 8, damagePerLevel: 1,
},
cryo_spike: {
  id: 'cryo_spike', name: 'Cryo Spike', description: 'Ice spike explodes on hit, slowing enemies.',
  category: 'ranged', baseDamage: 12, cooldown: 1.6, projectileSpeed: 12, area: 1.5,
  pierce: 1, amount: 1, maxLevel: 8, damagePerLevel: 3,
},
homing_missile: {
  id: 'homing_missile', name: 'Homing Missile', description: 'Slow projectile that tracks the nearest enemy.',
  category: 'ranged', baseDamage: 20, cooldown: 2.0, projectileSpeed: 6, area: 1.0,
  pierce: 1, amount: 1, maxLevel: 8, damagePerLevel: 5,
},
tesla_coil: {
  id: 'tesla_coil', name: 'Tesla Coil', description: 'Static aura damages all nearby enemies.',
  category: 'melee', baseDamage: 8, cooldown: 0.8, projectileSpeed: 0, area: 2.5,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 2,
},
```

- [ ] **Step 2: Add ricochet_disc, photon_beam, scatter_mine, phase_blade**

```typescript
ricochet_disc: {
  id: 'ricochet_disc', name: 'Ricochet Disc', description: 'Disc bounces between enemies.',
  category: 'ranged', baseDamage: 10, cooldown: 1.4, projectileSpeed: 10, area: 0.5,
  pierce: 3, amount: 1, maxLevel: 8, damagePerLevel: 3,
},
photon_beam: {
  id: 'photon_beam', name: 'Photon Beam', description: 'Straight beam pierces all enemies.',
  category: 'ranged', baseDamage: 15, cooldown: 2.5, projectileSpeed: 20, area: 0.3,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 4,
},
scatter_mine: {
  id: 'scatter_mine', name: 'Scatter Mine', description: 'Drops mines behind player as they move.',
  category: 'ranged', baseDamage: 18, cooldown: 1.2, projectileSpeed: 0, area: 1.5,
  pierce: 1, amount: 1, maxLevel: 8, damagePerLevel: 4,
},
phase_blade: {
  id: 'phase_blade', name: 'Phase Blade', description: 'Sweeping arc slash passes through walls.',
  category: 'melee', baseDamage: 14, cooldown: 1.0, projectileSpeed: 0, area: 2.0,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 3,
},
```

- [ ] **Step 3: Verify EVOLVED_WEAPON_IDS excludes new weapons**

The existing `BASE_WEAPON_IDS` is computed by filtering out `EVOLVED_WEAPON_IDS`. Since new weapons are not in `EVOLVED_WEAPON_IDS`, they will automatically be in `BASE_WEAPON_IDS`. Verify this is correct.

- [ ] **Step 4: Commit**

```bash
git add src/data/weapons.ts
git commit -m "Add 8 new base weapons"
```

---

### Task 4: Add 7 new passive items to items.ts

**Files:**
- Modify: `src/data/items.ts`

- [ ] **Step 1: Add all 7 new items**

Add to the `ITEMS` record in `src/data/items.ts`:

```typescript
crit_module: {
  id: 'crit_module', name: 'Crit Module', description: 'Increases critical hit chance.',
  category: 'stat', maxLevel: 5, stats: { critChance: 8 },
},
reflux_core: {
  id: 'reflux_core', name: 'Reflux Core', description: 'Heals a portion of damage dealt.',
  category: 'stat', maxLevel: 5, stats: { lifesteal: 5 },
},
phase_cloak: {
  id: 'phase_cloak', name: 'Phase Cloak', description: 'Extends invincibility after taking damage.',
  category: 'utility', maxLevel: 5, stats: {},
},
ammo_belt: {
  id: 'ammo_belt', name: 'Ammo Belt', description: 'Increases projectile count for all weapons.',
  category: 'stat', maxLevel: 3, stats: { amount: 1 },
},
razor_wire: {
  id: 'razor_wire', name: 'Razor Wire', description: 'Damages enemies that touch the player.',
  category: 'utility', maxLevel: 5, stats: {},
},
quantum_lens: {
  id: 'quantum_lens', name: 'Quantum Lens', description: 'Increases projectile speed.',
  category: 'stat', maxLevel: 5, stats: { speed: 10 },
},
overclock_chip: {
  id: 'overclock_chip', name: 'Overclock Chip', description: 'Boosts area and reduces cooldowns.',
  category: 'stat', maxLevel: 3, stats: { area: 8, cooldown: -8 },
},
```

- [ ] **Step 2: Run StatsEngine tests from Task 1**

Run: `npx vitest run src/game/__tests__/StatsEngine.test.ts`
Expected: The critChance and lifesteal tests from Task 1 should now PASS.

- [ ] **Step 3: Commit**

```bash
git add src/data/items.ts
git commit -m "Add 7 new passive items including crit, lifesteal, and utility items"
```

---

### Task 5: Add 8 new evolved weapons and update evolution fields

**Files:**
- Modify: `src/data/weapons.ts`
- Modify: `src/game/EvolutionSystem.ts` (if needed)
- Test: `src/game/__tests__/EvolutionSystem.test.ts`

- [ ] **Step 1: Add evolution fields to 5 existing base weapons**

In `src/data/weapons.ts`, add `evolutionItemId` and `evolvesInto` to:

```typescript
// neon_whip: add these fields
evolutionItemId: 'cyber_boots', evolvesInto: 'storm_lash',

// cyber_shuriken: add these fields
evolutionItemId: 'ammo_belt', evolvesInto: 'shuriken_storm',

// volt_chain: add these fields
evolutionItemId: 'crit_module', evolvesInto: 'thunder_god',

// blade_drone: add these fields
evolutionItemId: 'overclock_chip', evolvesInto: 'drone_swarm',

// gravity_bomb: add these fields
evolutionItemId: 'magnet_implant', evolvesInto: 'black_hole',
```

- [ ] **Step 2: Add 8 new evolved weapon definitions**

```typescript
storm_lash: {
  id: 'storm_lash', name: 'Storm Lash', description: 'Full-screen whip that pulls enemies inward.',
  category: 'melee', baseDamage: 25, cooldown: 1.0, projectileSpeed: 0, area: 6.0,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 6,
},
shuriken_storm: {
  id: 'shuriken_storm', name: 'Shuriken Storm', description: 'Spiraling shurikens with infinite pierce.',
  category: 'multishot', baseDamage: 15, cooldown: 1.2, projectileSpeed: 8, area: 1.0,
  pierce: 99, amount: 8, maxLevel: 8, damagePerLevel: 4,
},
thunder_god: {
  id: 'thunder_god', name: 'Thunder God', description: 'Lightning chains to all nearby enemies. Always crits.',
  category: 'multishot', baseDamage: 12, cooldown: 1.5, projectileSpeed: 0, area: 20.0,
  pierce: 50, amount: 1, maxLevel: 8, damagePerLevel: 3,
},
drone_swarm: {
  id: 'drone_swarm', name: 'Drone Swarm', description: 'Four fast-orbiting drones with massive area.',
  category: 'melee', baseDamage: 18, cooldown: 0.6, projectileSpeed: 0, area: 4.0,
  pierce: 99, amount: 4, maxLevel: 8, damagePerLevel: 4,
},
black_hole: {
  id: 'black_hole', name: 'Black Hole', description: 'Creates a persistent vortex that pulls and damages enemies.',
  category: 'ranged', baseDamage: 35, cooldown: 4.0, projectileSpeed: 0, area: 4.0,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 8,
},
inferno: {
  id: 'inferno', name: 'Inferno', description: '360-degree flame aura. Heals on damage dealt.',
  category: 'melee', baseDamage: 6, cooldown: 0.1, projectileSpeed: 0, area: 3.0,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 2,
},
absolute_zero: {
  id: 'absolute_zero', name: 'Absolute Zero', description: 'Explosion freezes all enemies in blast area.',
  category: 'ranged', baseDamage: 20, cooldown: 2.0, projectileSpeed: 12, area: 3.5,
  pierce: 99, amount: 1, maxLevel: 8, damagePerLevel: 5,
},
swarm_rockets: {
  id: 'swarm_rockets', name: 'Swarm Rockets', description: 'Five homing missiles that leave damage trails.',
  category: 'ranged', baseDamage: 15, cooldown: 1.5, projectileSpeed: 8, area: 1.0,
  pierce: 1, amount: 5, maxLevel: 8, damagePerLevel: 4,
},
```

- [ ] **Step 3: Update EVOLVED_WEAPON_IDS**

```typescript
export const EVOLVED_WEAPON_IDS = [
  'singularity_core', 'death_ray', 'plasma_storm',
  'storm_lash', 'shuriken_storm', 'thunder_god', 'drone_swarm',
  'black_hole', 'inferno', 'absolute_zero', 'swarm_rockets',
];
```

- [ ] **Step 4: Write evolution tests**

In `src/game/__tests__/EvolutionSystem.test.ts`, add tests:

```typescript
it('should evolve neon_whip with cyber_boots into storm_lash', () => {
  const weapons: WeaponInstance[] = [{ definitionId: 'neon_whip', level: 8 }];
  const items: ItemInstance[] = [{ definitionId: 'cyber_boots', level: 1 }];
  const result = checkEvolution(weapons, items, 'silver');
  expect(result).toEqual({
    baseWeaponId: 'neon_whip',
    evolvedWeaponId: 'storm_lash',
    consumedItemId: 'cyber_boots',
  });
});

it('should evolve flame_thrower with reflux_core into inferno', () => {
  const weapons: WeaponInstance[] = [{ definitionId: 'flame_thrower', level: 8 }];
  const items: ItemInstance[] = [{ definitionId: 'reflux_core', level: 1 }];
  const result = checkEvolution(weapons, items, 'silver');
  expect(result).toEqual({
    baseWeaponId: 'flame_thrower',
    evolvedWeaponId: 'inferno',
    consumedItemId: 'reflux_core',
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/game/__tests__/EvolutionSystem.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/weapons.ts src/game/__tests__/EvolutionSystem.test.ts
git commit -m "Add 8 evolved weapons and evolution chains for all base weapons"
```

---

### Task 6: Add stages.ts data file

**Files:**
- Create: `src/data/stages.ts`

- [ ] **Step 1: Create stages.ts**

```typescript
import type { UnlockCondition } from '../types';

export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: UnlockCondition | null;
}

export const STAGES: Record<string, StageDefinition> = {
  neon_district: {
    id: 'neon_district', name: 'Neon District',
    description: 'City streets bathed in neon light.',
    unlockCondition: null,
  },
  data_mines: {
    id: 'data_mines', name: 'Data Mines',
    description: 'Underground server caves crackling with energy.',
    unlockCondition: { type: 'reach_level', level: 20, stageId: 'neon_district', description: 'Reach Level 20 in Neon District' },
  },
  orbital_station: {
    id: 'orbital_station', name: 'Orbital Station',
    description: 'Space station corridors with zero-gravity zones.',
    unlockCondition: { type: 'reach_level', level: 40, stageId: 'data_mines', description: 'Reach Level 40 in Data Mines' },
  },
  core_nexus: {
    id: 'core_nexus', name: 'Core Nexus',
    description: 'The digital void at the center of everything.',
    unlockCondition: { type: 'reach_level', level: 60, stageId: 'orbital_station', description: 'Reach Level 60 in Orbital Station' },
  },
};

export const ALL_STAGE_IDS = Object.keys(STAGES);
```

- [ ] **Step 2: Commit**

```bash
git add src/data/stages.ts
git commit -m "Add stage definitions with unlock conditions"
```

---

## Chunk 2: Unlock Conditions on All Content

### Task 7: Add unlock conditions to all weapons

**Files:**
- Modify: `src/data/weapons.ts`

- [ ] **Step 1: Add unlockCondition to all base weapons**

Add `unlockCondition` field to each weapon in `WEAPONS`. For existing weapons, add after the last existing field:

```typescript
// plasma_bolt: always available
unlockCondition: null,

// neon_whip: unlock Vex
unlockCondition: { type: 'character_unlocked', characterId: 'vex', description: 'Unlock Vex' },

// cyber_shuriken: unlock Rhea
unlockCondition: { type: 'character_unlocked', characterId: 'rhea', description: 'Unlock Rhea' },

// pulse_rifle: unlock Zion
unlockCondition: { type: 'character_unlocked', characterId: 'zion', description: 'Unlock Zion' },

// blade_drone: unlock Nova
unlockCondition: { type: 'character_unlocked', characterId: 'nova', description: 'Unlock Nova' },

// ion_orbit: unlock Tank
unlockCondition: { type: 'character_unlocked', characterId: 'tank', description: 'Unlock Tank' },

// volt_chain: unlock Sage
unlockCondition: { type: 'character_unlocked', characterId: 'sage', description: 'Unlock Sage' },

// gravity_bomb: unlock Flux
unlockCondition: { type: 'character_unlocked', characterId: 'flux', description: 'Unlock Flux' },

// flame_thrower: survive 5 min as Kai
unlockCondition: { type: 'survive_time', seconds: 300, characterId: 'kai', description: 'Survive 5 minutes as Kai' },

// cryo_spike: defeat 10000 enemies total
unlockCondition: { type: 'total_kills', count: 10000, description: 'Defeat 10,000 enemies total' },

// homing_missile: get Volt Chain to level 7
unlockCondition: { type: 'weapon_level', weaponId: 'volt_chain', level: 7, description: 'Get Volt Chain to Lv 7' },

// tesla_coil: get Blade Drone to level 7
unlockCondition: { type: 'weapon_level', weaponId: 'blade_drone', level: 7, description: 'Get Blade Drone to Lv 7' },

// ricochet_disc: survive 15 min as Tank
unlockCondition: { type: 'survive_time', seconds: 900, characterId: 'tank', description: 'Survive 15 minutes as Tank' },

// photon_beam: get Pulse Rifle to level 7
unlockCondition: { type: 'weapon_level', weaponId: 'pulse_rifle', level: 7, description: 'Get Pulse Rifle to Lv 7' },

// scatter_mine: survive 15 min as Rhea
unlockCondition: { type: 'survive_time', seconds: 900, characterId: 'rhea', description: 'Survive 15 minutes as Rhea' },

// phase_blade: survive 15 min as Vex
unlockCondition: { type: 'survive_time', seconds: 900, characterId: 'vex', description: 'Survive 15 minutes as Vex' },
```

- [ ] **Step 2: Commit**

```bash
git add src/data/weapons.ts
git commit -m "Add unlock conditions to all weapons"
```

---

### Task 8: Add unlock conditions to all items

**Files:**
- Modify: `src/data/items.ts`

- [ ] **Step 1: Add unlockCondition to all items**

```typescript
// energy_cell: default
unlockCondition: null,

// shield_matrix: default
unlockCondition: null,

// targeting_chip: get Pulse Rifle to level 4
unlockCondition: { type: 'weapon_level', weaponId: 'pulse_rifle', level: 4, description: 'Get Pulse Rifle to Lv 4' },

// nano_repair: survive 1 minute
unlockCondition: { type: 'survive_time', seconds: 60, description: 'Survive 1 minute' },

// cyber_boots: reach level 5
unlockCondition: { type: 'reach_level', level: 5, description: 'Reach Level 5' },

// magnet_implant: default
unlockCondition: null,

// growth_serum: reach level 10
unlockCondition: { type: 'reach_level', level: 10, description: 'Reach Level 10' },

// holo_armor: survive 5 min as Tank
unlockCondition: { type: 'survive_time', seconds: 300, characterId: 'tank', description: 'Survive 5 minutes as Tank' },

// crit_module: survive 10 min as Sage
unlockCondition: { type: 'survive_time', seconds: 600, characterId: 'sage', description: 'Survive 10 minutes as Sage' },

// reflux_core: recover 1000 HP total
unlockCondition: { type: 'total_hp_recovered', amount: 1000, description: 'Recover 1,000 HP total' },

// phase_cloak: survive 15 min
unlockCondition: { type: 'survive_time', seconds: 900, description: 'Survive 15 minutes' },

// ammo_belt: hold 6 weapons
unlockCondition: { type: 'max_weapons_held', count: 6, description: 'Hold 6 weapons at once' },

// razor_wire: defeat 5000 enemies
unlockCondition: { type: 'total_kills', count: 5000, description: 'Defeat 5,000 enemies total' },

// quantum_lens: max level any weapon
unlockCondition: { type: 'any_weapon_max_level', description: 'Get any weapon to max level' },

// overclock_chip: evolve any weapon
unlockCondition: { type: 'any_weapon_evolved', description: 'Evolve any weapon' },
```

- [ ] **Step 2: Commit**

```bash
git add src/data/items.ts
git commit -m "Add unlock conditions to all items"
```

---

### Task 9: Update characters — remove credit purchase, keep existing unlock conditions

**Files:**
- Modify: `src/data/characters.ts`

- [ ] **Step 1: Set creditCost to 0 for all characters**

In `src/data/characters.ts`, set `creditCost: 0` for all 8 characters. The existing `unlockCondition` fields remain unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/data/characters.ts
git commit -m "Remove credit purchase from character unlocks"
```

---

## Chunk 3: Meta Store, Save Migration & Game Logic

### Task 10: Extend MetaStore with unlock tracking and new stats

**Files:**
- Modify: `src/stores/useMetaStore.ts`
- Modify: `src/game/SaveManager.ts`
- Test: `src/stores/__tests__/useMetaStore.test.ts`
- Test: `src/game/__tests__/SaveManager.test.ts`

- [ ] **Step 1: Add new fields to MetaStats**

In `src/stores/useMetaStore.ts`, extend `MetaStats`:

```typescript
interface MetaStats {
  // ... existing 8 fields
  totalHPRecovered: number;
  bestCreditsInRun: number;
  hasEvolved: boolean;
}
```

- [ ] **Step 2: Add new fields to MetaState**

```typescript
interface MetaState {
  // ... existing fields
  unlockedWeaponIds: string[];
  unlockedItemIds: string[];
  unlockedStageIds: string[];
  hyperModeStageIds: string[];
  selectedStageId: string;
  perCharacterStats: Record<string, { bestTime: number }>;
  perWeaponStats: Record<string, { maxLevel: number }>;
  // ... existing actions
  checkAllUnlocks: () => string[];
}
```

- [ ] **Step 3: Update createDefaultState**

```typescript
function createDefaultState() {
  return {
    // ... existing defaults
    unlockedWeaponIds: ['plasma_bolt'],
    unlockedItemIds: ['energy_cell', 'shield_matrix', 'magnet_implant'],
    unlockedStageIds: ['neon_district'],
    hyperModeStageIds: [] as string[],
    selectedStageId: 'neon_district',
    perCharacterStats: {} as Record<string, { bestTime: number }>,
    perWeaponStats: {} as Record<string, { maxLevel: number }>,
    stats: {
      // ... existing defaults
      totalHPRecovered: 0,
      bestCreditsInRun: 0,
      hasEvolved: false,
    } as MetaStats,
  };
}
```

- [ ] **Step 4: Update stateToSaveData and SaveData type**

In `src/game/SaveManager.ts`, update `SaveData` to v3:

```typescript
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
```

Set `CURRENT_VERSION = 3`.

- [ ] **Step 5: Write migrateV2ToV3 function**

```typescript
function migrateV2ToV3(data: SaveData): SaveData {
  const unlockedCharIds = data.unlockedIds ?? ['kai'];
  // Auto-unlock starting weapons for already-unlocked characters
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

  // Default unlocked items
  const unlockedItemIds = ['energy_cell', 'shield_matrix', 'magnet_implant'];
  // Auto-unlock items whose conditions are met based on existing stats
  if (data.stats.bestTime >= 60) unlockedItemIds.push('nano_repair');
  if (data.stats.bestLevel >= 5) unlockedItemIds.push('cyber_boots');
  if (data.stats.bestLevel >= 10) unlockedItemIds.push('growth_serum');

  return {
    ...data,
    version: 3,
    stats: {
      ...data.stats,
      totalHPRecovered: data.stats.totalHPRecovered ?? 0,
      bestCreditsInRun: data.stats.bestCreditsInRun ?? 0,
      hasEvolved: data.stats.hasEvolved ?? false,
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
```

Update `load()` to run migration pipeline: v1→v2→v3.

- [ ] **Step 6: Update stateToSaveData in useMetaStore**

Include all new fields in the save output.

- [ ] **Step 7: Update load() in useMetaStore**

Read and apply all new fields from SaveData.

- [ ] **Step 8: Implement checkAllUnlocks**

This function checks ALL unlock conditions (characters, weapons, items, stages) against current stats and returns newly unlocked IDs. Import weapon/item/stage data and iterate through unlock conditions. For each condition type, check the relevant stat. Add newly unlocked IDs to the appropriate list.

- [ ] **Step 9: Update recordRunStats to accept new extras**

Expand `extras` parameter to include:
```typescript
extras: {
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
}
```

Update `recordRunStats` to:
- Update `totalHPRecovered += extras.hpRecovered`
- Update `bestCreditsInRun = Math.max(current, extras.creditsEarned)`
- Update `hasEvolved = current || extras.hasEvolved`
- Update `perCharacterStats[extras.characterId].bestTime`
- Merge `perWeaponStats` with `extras.weaponMaxLevels`

- [ ] **Step 10: Write SaveManager migration tests**

```typescript
it('should migrate v2 to v3 with auto-unlocked weapons', () => {
  const v2Data = { version: 2, credits: 100, upgrades: {}, stats: { ... }, unlockedIds: ['kai', 'vex'], ... };
  const result = migrateV2ToV3(v2Data);
  expect(result.version).toBe(3);
  expect(result.unlockedWeaponIds).toContain('plasma_bolt');
  expect(result.unlockedWeaponIds).toContain('neon_whip');
  expect(result.unlockedStageIds).toEqual(['neon_district']);
});
```

- [ ] **Step 11: Write useMetaStore tests for new unlock checking**

```typescript
it('should unlock weapon when character is unlocked', () => {
  // Set up state with vex unlocked
  // Call checkAllUnlocks
  // Verify neon_whip is in unlockedWeaponIds
});

it('should unlock item when survive_time condition met', () => {
  // Set perCharacterStats.tank.bestTime = 300
  // Call checkAllUnlocks
  // Verify holo_armor is in unlockedItemIds
});
```

- [ ] **Step 12: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 13: Commit**

```bash
git add src/stores/useMetaStore.ts src/game/SaveManager.ts src/stores/__tests__/useMetaStore.test.ts src/game/__tests__/SaveManager.test.ts
git commit -m "Add unlock tracking, new stats, and v2-to-v3 save migration"
```

---

### Task 11: Add crit, lifesteal, and razor wire to game logic

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/hooks/useComputedStats.ts`
- Test: `src/stores/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Add per-run tracking fields to game state**

In `useGameStore`, add to state:

```typescript
hpRecovered: number;        // total HP recovered this run
maxWeaponsHeld: number;     // max weapons held simultaneously
hasEvolvedThisRun: boolean; // did player evolve a weapon this run
weaponMaxLevels: Record<string, number>; // max level reached per weapon this run
razorWireTimer: number;     // countdown for razor wire ticks
```

Initialize all in `startRun()`.

- [ ] **Step 2: Implement critical hit in damageEnemy**

In `damageEnemy()`, before applying damage:

```typescript
const stats = getComputedStats();
let finalDamage = damage;
const isCrit = stats.critChance > 0 && Math.random() * 100 < stats.critChance;
if (isCrit) finalDamage *= 2;
```

Use `finalDamage` instead of `damage` for the HP reduction.

- [ ] **Step 3: Implement lifesteal in damageEnemy**

After applying damage, if enemy took damage:

```typescript
if (stats.lifesteal > 0) {
  const healAmount = finalDamage * stats.lifesteal / 100;
  // Heal player, cap at maxHp
}
```

- [ ] **Step 4: Track hpRecovered**

Whenever player is healed (recovery tick, lifesteal), increment `hpRecovered` by the actual amount healed (after capping at maxHp).

- [ ] **Step 5: Track maxWeaponsHeld**

After adding a weapon, update: `maxWeaponsHeld = Math.max(maxWeaponsHeld, weapons.length)`.

- [ ] **Step 6: Track weaponMaxLevels**

After leveling a weapon, update: `weaponMaxLevels[weaponId] = Math.max(current, newLevel)`.

- [ ] **Step 7: Track hasEvolvedThisRun**

In `collectChest()`, after a successful evolution, set `hasEvolvedThisRun = true`.

- [ ] **Step 8: Implement Phase Cloak (invincibility extension)**

In `takeDamage()`, the current i-frame duration is hardcoded. Change it to read the Phase Cloak item level:

```typescript
const phaseCloakLevel = items.find(i => i.definitionId === 'phase_cloak')?.level ?? 0;
const iFrameDuration = 0.5 + phaseCloakLevel * 0.3;
```

- [ ] **Step 9: Filter level-up pool by unlocked weapons/items**

In `generateLevelUpOptions()`:

```typescript
const meta = useMetaStore.getState();
const availableWeaponIds = BASE_WEAPON_IDS.filter(id => meta.unlockedWeaponIds.includes(id));
const availableItemIds = ALL_ITEM_IDS.filter(id => meta.unlockedItemIds.includes(id));
```

Use `availableWeaponIds` and `availableItemIds` instead of `BASE_WEAPON_IDS` and `ALL_ITEM_IDS` for offering new weapons/items.

- [ ] **Step 10: Write tests**

```typescript
it('should apply critical hit damage (2x)', () => {
  // Mock Math.random to return 0 (guaranteed crit)
  // Set up state with crit_module item
  // Call damageEnemy
  // Verify damage is doubled
});

it('should heal player via lifesteal', () => {
  // Set up state with reflux_core item, player at 50 HP
  // Call damageEnemy dealing 100 damage
  // Verify player healed by lifesteal percentage
});

it('should only offer unlocked weapons in level-up', () => {
  // Set useMetaStore unlockedWeaponIds to ['plasma_bolt']
  // Call generateLevelUpOptions
  // Verify no other weapons offered as "new"
});
```

- [ ] **Step 11: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 12: Commit**

```bash
git add src/stores/useGameStore.ts src/hooks/useComputedStats.ts src/stores/__tests__/useGameStore.test.ts
git commit -m "Add crit, lifesteal, phase cloak, razor wire, and level-up pool filtering"
```

---

### Task 12: Implement Razor Wire aura damage

**Files:**
- Modify: `src/components/Enemies.tsx` or wherever the game loop runs per-frame enemy logic

- [ ] **Step 1: Add razor wire tick logic**

In the game loop (useFrame), check if player has razor_wire item. If so, every 1 second:
- Find all enemies within 1.5 units of player position
- Deal `razorWireLevel * 5 * (1 + might/100)` damage to each
- Use existing `damageEnemy()` function

```typescript
// In useFrame callback:
if (razorWireLevel > 0) {
  razorWireTimer -= delta;
  if (razorWireTimer <= 0) {
    razorWireTimer = 1.0;
    const playerPos = player.position;
    for (const enemy of enemies) {
      const dist = distance(playerPos, enemy.position);
      if (dist < 1.5) {
        const dmg = razorWireLevel * 5 * (1 + stats.might / 100);
        damageEnemy(enemy.id, dmg);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Enemies.tsx
git commit -m "Add Razor Wire aura damage in game loop"
```

---

## Chunk 4: UI Updates

### Task 13: Add stage select to PLAY tab

**Files:**
- Modify: `src/ui/MainMenu.tsx`
- Modify: `src/stores/useMetaStore.ts` (selectStage action)

- [ ] **Step 1: Add selectStage action to useMetaStore**

```typescript
selectStage: (id: string) => {
  set({ selectedStageId: id });
  void SaveManager.save(stateToSaveData(get()));
},
```

- [ ] **Step 2: Add stage select row to PLAY tab**

Between character selection grid and START RUN button, add a stage select row:

```tsx
{/* Stage Select */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, width: '100%', maxWidth: 420 }}>
  {ALL_STAGE_IDS.map((id) => {
    const def = STAGES[id]!;
    const isUnlocked = unlockedStageIds.includes(id);
    const isSelected = selectedStageId === id;
    return (
      <div key={id} onClick={() => { if (isUnlocked) { SoundManager.buttonClick(); useMetaStore.getState().selectStage(id); } }}
        style={{
          background: isSelected ? '#112233' : '#111122',
          border: `2px solid ${isSelected ? '#00ffff' : isUnlocked ? '#444' : '#222'}`,
          borderRadius: 6, padding: '6px 4px', textAlign: 'center',
          cursor: isUnlocked ? 'pointer' : 'default',
          opacity: isUnlocked ? 1 : 0.4,
          boxShadow: isSelected ? '0 0 10px #00ffff' : 'none',
        }}>
        <div style={{ color: isUnlocked ? '#fff' : '#666', fontSize: 10, fontWeight: 'bold' }}>{def.name}</div>
        {!isUnlocked && def.unlockCondition && (
          <div style={{ color: '#888', fontSize: 8, marginTop: 2 }}>{def.unlockCondition.description}</div>
        )}
      </div>
    );
  })}
</div>
```

- [ ] **Step 3: Remove credit purchase buttons from character cards**

In the character selection grid, remove the `<button>` that calls `unlockCharacter(id)`. Show only the unlock condition text for locked characters.

- [ ] **Step 4: Commit**

```bash
git add src/ui/MainMenu.tsx src/stores/useMetaStore.ts
git commit -m "Add stage select UI and remove credit purchase from characters"
```

---

### Task 14: Expand ACHIEVEMENTS tab

**Files:**
- Modify: `src/ui/MainMenu.tsx`

- [ ] **Step 1: Add weapon, item, and stage unlock sections**

Expand the achievements tab to show 4 collapsible sections:

1. **CHARACTER UNLOCKS** — existing, keep as-is
2. **WEAPON UNLOCKS** — all weapons with unlock conditions, show locked/unlocked status
3. **ITEM UNLOCKS** — all items with unlock conditions
4. **STAGE UNLOCKS** — all stages with unlock conditions

Each entry shows name, condition description, and a green checkmark or orange lock icon.

Use the same card style as the existing character unlocks section. Import `WEAPONS`, `BASE_WEAPON_IDS`, `ITEMS`, `ALL_ITEM_IDS`, `STAGES`, `ALL_STAGE_IDS`.

- [ ] **Step 2: Add collapsible section component**

Create an inline collapsible section (useState toggle per section):

```tsx
const [openSections, setOpenSections] = useState<Record<string, boolean>>({
  characters: true, weapons: false, items: false, stages: false,
});
const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/MainMenu.tsx
git commit -m "Expand achievements tab with weapon, item, and stage unlock sections"
```

---

### Task 15: Show unlock banners on results screen

**Files:**
- Modify: `src/ui/ResultsScreen.tsx`

- [ ] **Step 1: Call checkAllUnlocks and show new unlocks**

After `recordRunStats`, call `checkAllUnlocks()` which returns all newly unlocked IDs. Show a banner for each category:

- New characters (existing behavior)
- New weapons: "WEAPON UNLOCKED! [name]"
- New items: "ITEM UNLOCKED! [name]"
- New stages: "STAGE UNLOCKED! [name]"

Use the same yellow/cyan banner pattern as the existing character unlock.

- [ ] **Step 2: Pass new per-run stats to recordRunStats**

Update the `handleEnd` function to pass all new tracking data:

```typescript
useMetaStore.getState().recordRunStats(killCount, elapsedTime, totalCredits, {
  damageTaken, bossKills, xpGemsCollected, playerLevel: level,
  hpRecovered: useGameStore.getState().hpRecovered,
  creditsEarned: totalCredits,
  maxWeaponsHeld: useGameStore.getState().maxWeaponsHeld,
  hasEvolved: useGameStore.getState().hasEvolvedThisRun,
  characterId: useMetaStore.getState().selectedCharacterId,
  weaponMaxLevels: useGameStore.getState().weaponMaxLevels,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/ResultsScreen.tsx
git commit -m "Show weapon, item, and stage unlock banners on results screen"
```

---

### Task 16: Final integration test and type check

**Files:**
- All modified files

- [ ] **Step 1: Run type checker**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Build for production**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Sync to iOS**

Run: `npx cap sync ios`
Expected: Sync succeeds.

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "Phase 4A: weapons, items, evolutions, and unlock system complete"
```
