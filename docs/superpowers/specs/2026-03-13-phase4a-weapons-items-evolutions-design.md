# Phase 4A: Weapons, Items & Evolutions — Design Spec

## Goal

Expand build-crafting depth by adding 8 new weapons, 7 new items, 8 new evolution chains, 2 new stats (crit/lifesteal), and a Vampire Survivors-style unlock system where all content is earned through gameplay milestones.

## Architecture

All new content is data-driven — new weapons, items, and evolutions are defined in `src/data/` files. The unlock system tracks player milestones in `useMetaStore` and gates which weapons/items appear in the level-up offer pool. No new rendering systems are needed; existing `WeaponSystem`, `StatsEngine`, and level-up UI handle everything.

## Current State

- 8 base weapons, 3 evolved weapons, 8 passive items
- 4 enemy types, 1 stage, 15-minute runs
- Characters unlock via achievements or credit purchase
- All weapons/items available in level-up pool from the start

---

## 1. New Weapons (8 new, 16 base total)

| ID | Name | Category | Mechanic | Base Dmg | Cooldown | Pierce | Projectiles |
|----|------|----------|----------|----------|----------|--------|-------------|
| flame_thrower | Flame Thrower | Melee | Continuous cone in front, rapid ticks | 3 | 0.15s | 1 | 1 |
| cryo_spike | Cryo Spike | Ranged | Spike explodes on hit, slows enemies | 12 | 1.6s | 1 | 1 |
| homing_missile | Homing Missile | Ranged | Slow projectile, tracks nearest enemy | 20 | 2.0s | 1 | 1 |
| tesla_coil | Tesla Coil | Melee | Static aura around player, damages nearby | 8 | 0.8s | 99 | 1 |
| ricochet_disc | Ricochet Disc | Ranged | Bounces between enemies (3 bounces) | 10 | 1.4s | 3 | 1 |
| photon_beam | Photon Beam | Ranged | Straight line beam, pierces all | 15 | 2.5s | 99 | 1 |
| scatter_mine | Scatter Mine | Ranged | Drops mines behind player as they move | 18 | 1.2s | 1 | 1 |
| phase_blade | Phase Blade | Melee | Sweeping arc slash, passes through walls | 14 | 1.0s | 99 | 1 |

Note: Ricochet Disc uses pierce=3 to represent 3 bounces. Category is Ranged (not Multishot) — it fires one disc that bounces, scaling adds projectile speed not extra discs.

### Weapon Scaling (per level, same as existing weapons)

Each level: +10% base damage, and category-specific bonuses:
- Melee: +5% area per level
- Ranged: +5% projectile speed per level
- Multishot: +1 projectile at levels 3 and 6

Max level: 8 (unchanged).

---

## 2. New Passive Items (7 new, 15 total)

| ID | Name | Effect per Level | Max Level |
|----|------|-----------------|-----------|
| crit_module | Crit Module | +8% critical hit chance | 5 |
| reflux_core | Reflux Core | +5% lifesteal on damage dealt | 5 |
| phase_cloak | Phase Cloak | +0.3s invincibility after taking damage | 5 |
| ammo_belt | Ammo Belt | +1 projectile Amount | 3 |
| razor_wire | Razor Wire | 5 damage/s to enemies touching player | 5 |
| quantum_lens | Quantum Lens | +10 projectile speed (`speed` stat) | 5 |
| overclock_chip | Overclock Chip | +8 area, -8 cooldown per level | 3 |

**Performance note:** Ammo Belt adds +1 projectile to ALL weapons per level (max +3). Combined with multishot weapons, this can significantly increase projectile count. The existing 200 projectile pool cap in the object pool provides a natural ceiling — excess projectiles beyond the pool size are simply not spawned.

### Item Stat Mapping

Items map to `StatKey` values via their `stats` field (same pattern as existing items):

| Item | stats Record |
|------|-------------|
| crit_module | `{ critChance: 8 }` |
| reflux_core | `{ lifesteal: 5 }` |
| phase_cloak | Special: handled outside stats system (see Section 3) |
| ammo_belt | `{ amount: 1 }` |
| razor_wire | Special: handled as aura effect (see Section 3) |
| quantum_lens | `{ speed: 10 }` |
| overclock_chip | `{ area: 8, cooldown: -8 }` (negative cooldown = faster) |

Phase Cloak and Razor Wire use category `'utility'` in their `ItemDefinition`. Their special effects are implemented outside the stats system but they still follow the standard item structure.

---

## 3. New Stats & Special Effects

### New StatKey additions

Add to `StatKey` type in `src/types.ts`:
- `critChance` — percentage (0-100)
- `lifesteal` — percentage (0-100)

Add to `ComputedStats` with defaults of 0.

### Critical Hit Chance (`critChance`)
- Default: 0% for all characters
- Source: Crit Module item (+8% per level)
- Mechanic: On each damage instance, `Math.random() < critChance / 100` → 2x damage
- Visual: Yellow damage number for crits (vs white for normal)
- Implementation: Check in `damageEnemy()` in `useGameStore`

### Lifesteal (`lifesteal`)
- Default: 0% for all characters
- Source: Reflux Core item (+5% per level)
- Mechanic: On damage dealt to enemies, heal player `damage * lifesteal / 100`
- Cap: Cannot heal above maxHp
- Implementation: After damage is applied in `damageEnemy()`, call heal logic

### Invincibility Frames (Phase Cloak)
- Current: 0.5s hardcoded post-hit i-frames (in `takeDamage()`)
- Phase Cloak adds +0.3s per level to this duration
- Implementation: Store `invincibilityDuration` in game state, default 0.5. Phase Cloak modifies it via a special check when items change (not via `ComputedStats`).
- Not a `StatKey` — Phase Cloak's level is read directly when computing i-frame duration.

### Contact Damage (Razor Wire)
- Not a `StatKey` — handled as a periodic aura effect
- Implementation: In the game loop (`useFrame`), if player has Razor Wire:
  - Every 1 second, find all enemies within 1.5 unit radius of player
  - Deal `razorWireLevel * 5 * mightMultiplier` damage to each
  - Reuse existing `damageEnemy()` function
- Visual: Small red pulse effect around player each tick

---

## 4. Evolution Trees (8 new, 11 total)

Evolution trigger: weapon at max level (8) + required item in inventory + open silver chest.

Existing evolutions are unchanged. New evolutions need `evolutionItemId` and `evolvesInto` fields added to the base weapon definitions in `weapons.ts`.

### Full Evolution Table

| Base Weapon | + Required Item | = Evolution | Stats |
|-------------|----------------|-------------|-------|
| Plasma Bolt | Energy Cell | Plasma Storm | (existing) dmg 18, cd 0.8s, projectiles 6, pierce 3 |
| Ion Orbit | Shield Matrix | Singularity Core | (existing) dmg 40, cd 1.5s, area 5.0, projectiles 3 |
| Pulse Rifle | Targeting Chip | Death Ray | (existing) dmg 20, cd 0.2s, pierce 99 |
| Neon Whip | Cyber Boots | **Storm Lash** | dmg 25, cd 1.0s, area 6.0, pierce 99, pulls enemies 3 units toward hit point |
| Cyber Shuriken | Ammo Belt | **Shuriken Storm** | dmg 15, cd 1.2s, projectiles 8, pierce 99, spiral pattern |
| Volt Chain | Crit Module | **Thunder God** | dmg 12, cd 1.5s, chains to up to 50 enemies on screen, 100% crit chance on this weapon |
| Blade Drone | Overclock Chip | **Drone Swarm** | dmg 18, cd 0.6s, projectiles 4, area 4.0, orbit speed 2x |
| Gravity Bomb | Magnet Implant | **Black Hole** | dmg 35, cd 4.0s, creates vortex lasting 5s, area 4.0, pulls enemies in |
| Flame Thrower | Reflux Core | **Inferno** | dmg 6, cd 0.1s, 360-degree aura, area 3.0, heals 2% of damage dealt |
| Cryo Spike | Phase Cloak | **Absolute Zero** | dmg 20, cd 2.0s, area 3.5, freezes enemies in blast for 2s |
| Homing Missile | Razor Wire | **Swarm Rockets** | dmg 15, cd 1.5s, projectiles 5, each leaves damage trail (3 dmg/tick) |

**No evolution (reserved for future):** Tesla Coil, Ricochet Disc, Photon Beam, Scatter Mine, Phase Blade.

### Evolved Weapon Definitions

Each evolved weapon is a full `WeaponDefinition` entry in `weapons.ts`. Evolved weapons are identified by being listed in the existing `EVOLVED_WEAPON_IDS` array (same pattern as Plasma Storm, Singularity Core, Death Ray). They start at level 1 when obtained and can be leveled to 8.

---

## 5. Unlock System

All content is earned through gameplay. Credit purchase is **removed** from character unlocks (existing `creditCost` field set to 0 for all characters). Credits remain for permanent shop upgrades and character level upgrades only.

### Character Unlocks (keep existing conditions)

The existing character unlock conditions in `src/data/characters.ts` are **kept as-is**. Only the credit purchase alternative is removed.

| Character | Unlock Condition (unchanged) |
|-----------|------------------------------|
| Kai | Default |
| Vex | Survive 5 minutes (bestTime >= 300) |
| Rhea | Kill 300 total enemies (totalKills >= 300) |
| Zion | Reach level 15 (bestLevel >= 15) |
| Nova | Complete 10 runs (totalRuns >= 10) |
| Tank | Take 1,000 total damage (totalDamageTaken >= 1000) |
| Sage | Kill a boss (totalBossKills >= 1) |
| Flux | Collect 500 XP gems (totalXPGemsCollected >= 500) |

### Weapon Unlocks

Each weapon has an unlock condition. Locked weapons never appear in the level-up pool. Weapon unlock conditions are defined on `WeaponDefinition` as `unlockCondition: UnlockCondition | null` (null = always available).

| Weapon | Unlock Condition |
|--------|-----------------|
| plasma_bolt | Default (null) |
| neon_whip | Unlock Vex |
| cyber_shuriken | Unlock Rhea |
| pulse_rifle | Unlock Zion |
| blade_drone | Unlock Nova |
| ion_orbit | Unlock Tank |
| volt_chain | Unlock Sage |
| gravity_bomb | Unlock Flux |
| flame_thrower | Survive 5 minutes as Kai |
| phase_blade | Survive 15 minutes as Vex |
| scatter_mine | Survive 15 minutes as Rhea |
| photon_beam | Get Pulse Rifle to Level 7 |
| tesla_coil | Get Blade Drone to Level 7 |
| ricochet_disc | Survive 15 minutes as Tank |
| homing_missile | Get Volt Chain to Level 7 |
| cryo_spike | Defeat 10,000 enemies total |

Note: "Survive 15 minutes" conditions are achievable under the current 15-minute run cap (game ends at exactly 900s = 15:00, so surviving to the end satisfies these). The previously proposed "Survive 20 minutes" conditions have been replaced since the run timer is not extended until Sub-project 3.

### Passive Item Unlocks

| Item | Unlock Condition |
|------|-----------------|
| energy_cell | Default (null) |
| shield_matrix | Default (null) |
| nano_repair | Survive 1 minute with any character |
| cyber_boots | Reach Level 5 |
| magnet_implant | Default (null) |
| targeting_chip | Get Pulse Rifle to Level 4 |
| growth_serum | Reach Level 10 |
| holo_armor | Survive 5 minutes as Tank |
| crit_module | Survive 10 minutes as Sage |
| reflux_core | Recover 1,000 HP total across all runs |
| phase_cloak | Survive 15 minutes with any character |
| ammo_belt | Hold 6 weapons simultaneously |
| razor_wire | Defeat 5,000 enemies total |
| quantum_lens | Get any weapon to max level (8) |
| overclock_chip | Evolve any weapon |

### Stage Unlocks

| Stage ID | Name | Unlock Condition |
|----------|------|-----------------|
| neon_district | Neon District | Default (null) |
| data_mines | Data Mines | Reach Level 20 in Neon District |
| orbital_station | Orbital Station | Reach Level 40 in Data Mines |
| core_nexus | Core Nexus | Reach Level 60 in Orbital Station |

Note: Stage definitions (ID, name, unlock condition) are added in this sub-project. Actual stage geometry, unique enemy rosters, and visual themes come in Sub-project 3. Until then, all stages use the same arena layout.

### Hyper Mode

- Unlocked per stage by surviving the full run duration (15 min now, 30 min after Sub-project 3)
- Effect: all enemy movement speed 2x, all spawn timers run at 2x rate
- Toggle on stage select screen before starting run
- Stored in `hyperModeStageIds: string[]`

---

## 6. New Stats to Track

### Lifetime stats (added to `MetaStats`)

| Stat | Type | Used By |
|------|------|---------|
| totalHPRecovered | cumulative | Reflux Core item unlock |
| bestCreditsInRun | lifetime max | (reserved for future) |
| hasEvolved | boolean | Overclock Chip item unlock |

### Per-character stats (new field on MetaState)

`perCharacterStats: Record<string, { bestTime: number }>`

| Stat | Used By |
|------|---------|
| bestTime per character | Flame Thrower, Phase Blade, Scatter Mine, Ricochet Disc, Holo Armor, Crit Module weapon/item unlocks |

### Per-weapon stats (new field on MetaState)

`perWeaponStats: Record<string, { maxLevel: number }>`

Tracks the **lifetime maximum** level reached for each weapon across all runs.

| Stat | Used By |
|------|---------|
| maxLevel per weapon | Targeting Chip, Photon Beam, Tesla Coil, Homing Missile unlocks |

### Per-run tracking (in useGameStore, reported at run end)

| Stat | Used By |
|------|---------|
| maxWeaponsHeld | Ammo Belt item unlock |
| hpRecovered | totalHPRecovered lifetime stat |
| weaponMaxLevels | perWeaponStats updates |
| hasEvolvedThisRun | hasEvolved lifetime stat |

The `recordRunStats` function signature expands to accept these new fields in its `extras` parameter.

---

## 7. Data Model Changes

### `UnlockCondition` (new shared type in `src/types.ts`)

```typescript
type UnlockCondition =
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

All variants include a `description` string for UI display. `null` on the definition means always available (no unlock needed).

### `WeaponDefinition` (weapons.ts) — add field

```typescript
unlockCondition: UnlockCondition | null;
```

Existing weapons that were always available get `unlockCondition: null`. Character starting weapons get `{ type: 'character_unlocked', characterId: '...', description: '...' }`.

Also add `evolutionItemId` and `evolvesInto` to the 5 existing weapons that now have evolution paths (neon_whip, cyber_shuriken, volt_chain, blade_drone, gravity_bomb).

### `ItemDefinition` (items.ts) — add field

```typescript
unlockCondition: UnlockCondition | null;
```

### `CharacterDefinition` (characters.ts) — modify

Set `creditCost: 0` for all characters. Keep the existing `unlockCondition` field and values.

### `StageDefinition` (new file: stages.ts)

```typescript
interface StageDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: UnlockCondition | null;
}
```

### `MetaState` additions (useMetaStore)

```typescript
unlockedWeaponIds: string[];
unlockedItemIds: string[];
unlockedStageIds: string[];
hyperModeStageIds: string[];
selectedStageId: string;
perCharacterStats: Record<string, { bestTime: number }>;
perWeaponStats: Record<string, { maxLevel: number }>;
```

### `MetaStats` additions

```typescript
totalHPRecovered: number;
bestCreditsInRun: number;
hasEvolved: boolean;
```

### `SaveData` version bump: v2 → v3

Migration v2 → v3:
- Add `unlockedWeaponIds`: auto-populate with `['plasma_bolt']` plus starting weapons of any already-unlocked characters
- Add `unlockedItemIds`: auto-populate with default items (`energy_cell`, `shield_matrix`, `magnet_implant`) plus any items whose unlock conditions are already met based on existing stats
- Add `unlockedStageIds`: `['neon_district']`
- Add `hyperModeStageIds`: `[]`
- Add `selectedStageId`: `'neon_district'`
- Add `perCharacterStats`: `{}`
- Add `perWeaponStats`: `{}`
- Add new `MetaStats` fields with defaults (0 / false)
- Set all `creditCost` to 0 (characters already unlocked stay unlocked)

### Level-up pool filtering

`generateLevelUpOptions` in `useGameStore.ts` currently iterates `BASE_WEAPON_IDS` and `ALL_ITEM_IDS`. This must be changed to intersect with the player's `unlockedWeaponIds` / `unlockedItemIds` from `useMetaStore`.

---

## 8. UI Changes

### PLAY Tab
- Add **stage select** row between character select and START RUN button
- Stage cards: locked stages show unlock condition, unlocked stages are selectable
- Cleared stages show Hyper Mode toggle switch
- Remove credit purchase buttons from locked character cards (show only unlock condition text)

### ACHIEVEMENTS Tab
- Expand to 4 sections: CHARACTER UNLOCKS, WEAPON UNLOCKS, ITEM UNLOCKS, STAGE UNLOCKS
- Each entry shows: name, unlock condition description, progress indicator, locked/unlocked status
- Sections are collapsible to manage length

### Level-Up Screen
- Filter weapon/item offers by `unlockedWeaponIds` / `unlockedItemIds`
- No other changes needed

### Results Screen
- Show newly unlocked weapons/items/stages (same pattern as character unlock banner)
- Multiple unlocks shown in sequence

---

## 9. What This Does NOT Include

- New stage geometry, enemies, or visual themes — Sub-project 3
- Cyber Augments system — Sub-project 2
- Game modes (Mission, Endless) — Sub-project 4
- Weapon mods/enchantments — cut from scope entirely
- 30-minute run timer extension — Sub-project 3
- New enemy types — Sub-project 3
- Limit Break system — Sub-project 4
- Difficulty/Curse system — Sub-project 4
