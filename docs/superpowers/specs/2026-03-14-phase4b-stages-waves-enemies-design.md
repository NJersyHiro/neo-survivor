# Phase 4B: Stages, Waves & Enemies — Design Spec

## Goal

Transform the game from a single enemy set with continuous spawning into 4 distinct stages with unique enemy rosters, per-minute wave schedules, 30-minute runs, horde spawn patterns, a kill screen at 30:00, and hyper mode for cleared stages.

---

## 1. Extended Run Timer & Kill Screen

### 1.1 Timer Extension

Change the run duration from 15 minutes (900s) to 30 minutes (1800s). The `tick()` function force-ends the game at 1800s with `survived = true` (the player beat the stage). The System Purge kill screen spawns at 30:00 to make surviving those final seconds extremely difficult — it's the ultimate test.

The `survived` condition in ResultsScreen changes from `elapsedTime >= 900` to `elapsedTime >= 1800`.

### 1.2 System Purge (Kill Screen)

At exactly 30:00, spawn the **System Purge** — a massive digital construct that represents the system's final defense against the player.

| Property | Value |
|----------|-------|
| HP | 65535 |
| Damage | 65535 (instakill) |
| Speed | 4.0 (faster than any player) |
| Scale | 3.0 |
| Color | `#ffffff` |
| Emissive | `#ff0000` |

**Behavior:**
- Rushes directly toward the player (same as normal enemies)
- Contact = instant death (no armor reduction, no i-frames, no revives)
- If killed (nearly impossible), spawn an invincible **Null Entity** (`hp: Infinity`, same speed/damage)
- Additional System Purge spawns every 60 seconds after 30:00

**Implementation:**
- Add `system_purge` and `null_entity` to enemies.ts with `isReaper: true` flag
- In `takeDamage`, if the damaging enemy has `isReaper: true`, bypass armor/revive/i-frames
- In `damageEnemy`, if the killed enemy has `isReaper: true`, spawn `null_entity`
- In Enemies.tsx spawn loop, check if `elapsedTime >= 1800` and spawn system_purge

---

## 2. Enemy Archetypes

### 2.1 Enemy Definition Extension

Extend `EnemyDefinition` in types.ts:

```typescript
export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  xpValue: number;
  color: string;
  emissive: string;
  scale: number;
  isBoss?: boolean;
  bossScale?: number;
  isReaper?: boolean;
  // New fields:
  behavior?: EnemyBehavior;
  projectileDamage?: number;
  projectileSpeed?: number;
  projectileInterval?: number;
  attackRange?: number;
  onDeath?: EnemyOnDeath;
  explosionDamage?: number;
  explosionRadius?: number;
  splitInto?: string;
  aura?: EnemyAura;
  auraValue?: number;    // magnitude: 0.25 = +25%, 2 = 2hp/s heal
  auraRadius?: number;   // default 3
  shieldHp?: number;
  shieldRegenDelay?: number;
  teleportInterval?: number;
}

export type EnemyBehavior = 'chase' | 'ranged' | 'teleport_chase';
export type EnemyOnDeath = 'none' | 'explode' | 'split';
export type EnemyAura = 'none' | 'heal_allies' | 'buff_damage';
```

Default behavior is `'chase'` (current behavior). All existing enemies keep their behavior unchanged.

### 2.2 EnemyInstance Extension

Complete interface (replaces existing EnemyInstance):

```typescript
export interface EnemyInstance {
  id: string;
  definitionId: string;
  position: Vec3;
  hp: number;
  maxHp: number;
  // New fields:
  shieldHp?: number;
  lastTeleport?: number;
  lastProjectile?: number;
}
```

### 2.3 Stage Enemy Rosters

Each stage has 5 regular enemies + 1 boss = 6 enemies. Total: 24 stage enemies + 2 kill screen entities = 26 enemies.

#### Neon District (Stage 1) — Basic, no special mechanics

| ID | Name | Archetype | HP | Dmg | Speed | XP | Behavior | Special |
|----|------|-----------|-----|-----|-------|----|----------|---------|
| nd_drone | Street Drone | Swarmer | 20 | 5 | 2.5 | 1 | chase | — |
| nd_speeder | Neon Runner | Fast | 12 | 4 | 5.0 | 2 | chase | — |
| nd_enforcer | Enforcer | Tank | 80 | 10 | 1.2 | 5 | chase | — |
| nd_turret | Street Turret | Ranged | 30 | 3 | 1.0 | 3 | ranged | projDmg 8, projSpd 8, projInt 2.0s, range 10 |
| nd_elite | Neon Elite | Elite | 120 | 12 | 2.0 | 8 | chase | — |
| nd_boss | Circuit Breaker | Boss | 800 | 15 | 1.5 | 50 | chase | bossScale 2.5 |

#### Data Mines (Stage 2) — Enemies gain abilities

| ID | Name | Archetype | HP | Dmg | Speed | XP | Behavior | Special |
|----|------|-----------|-----|-----|-------|----|----------|---------|
| dm_crawler | Crawler | Swarmer | 30 | 7 | 2.8 | 2 | chase | — |
| dm_glitch | Glitch | Fast | 18 | 5 | 4.5 | 3 | teleport_chase | teleports every 4s |
| dm_golem | Data Golem | Tank | 150 | 12 | 1.0 | 8 | chase | shield 50hp, regen 3s |
| dm_laser | Laser Node | Ranged | 45 | 4 | 0.8 | 5 | ranged | projDmg 12, projSpd 10, projInt 1.8s, range 12 |
| dm_virus | Virus Elite | Elite | 180 | 15 | 2.2 | 12 | chase | — |
| dm_boss | Data Worm | Boss | 1500 | 20 | 1.8 | 80 | chase | bossScale 3.0 |

#### Orbital Station (Stage 3) — Faster, deadlier

| ID | Name | Archetype | HP | Dmg | Speed | XP | Behavior | Special |
|----|------|-----------|-----|-----|-------|----|----------|---------|
| os_probe | Probe | Swarmer | 40 | 9 | 3.2 | 3 | chase | — |
| os_interceptor | Interceptor | Fast | 25 | 7 | 5.5 | 4 | chase | — |
| os_mech | Heavy Mech | Tank | 250 | 15 | 1.0 | 12 | chase | onDeath: explode, explDmg 20, explRad 2.0 |
| os_sentry | Plasma Sentry | Ranged | 60 | 5 | 0.6 | 7 | ranged | aimed projectile, projDmg 15, projSpd 12, projInt 1.5s, range 14 |
| os_commander | Commander | Elite | 300 | 18 | 2.5 | 15 | chase | aura: buff_damage, auraValue 0.25 |
| os_boss | Station Core | Boss | 3000 | 25 | 1.2 | 120 | chase | bossScale 3.5 |

#### Core Nexus (Stage 4) — Auras, healing, maximum danger

| ID | Name | Archetype | HP | Dmg | Speed | XP | Behavior | Special |
|----|------|-----------|-----|-----|-------|----|----------|---------|
| cn_fragment | Fragment | Swarmer | 50 | 12 | 3.0 | 4 | chase | aura: heal_allies, auraValue 2, auraRadius 3 |
| cn_phaser | Phase Runner | Fast | 35 | 10 | 6.0 | 6 | teleport_chase | teleports every 3s |
| cn_firewall | Firewall | Tank | 400 | 20 | 0.8 | 15 | chase | shield 100hp, regen 2s |
| cn_sniper | Code Sniper | Ranged | 80 | 8 | 0.5 | 10 | ranged | projDmg 20, projSpd 14, projInt 1.2s, range 16 |
| cn_kernel | Kernel Elite | Elite | 500 | 25 | 2.0 | 20 | chase | aura: buff_damage, auraValue 0.40 |
| cn_boss | Nexus Guardian | Boss | 6000 | 30 | 1.5 | 200 | chase | bossScale 4.0 |

### 2.4 Behavior Implementations

**chase** (existing): Move toward player position each frame.

**ranged**: Move toward player until within `attackRange`. Stop moving when in range. Fire a projectile every `projectileInterval` seconds. Resume chasing if player moves out of range.

**teleport_chase**: Same as chase, but every `teleportInterval` seconds, teleport to a random position within 8 units of the player. Brief visual flash on teleport.

**onDeath — explode**: When HP reaches 0, deal `explosionDamage` to the player if within `explosionRadius`. Uses existing `takeDamage` on the player.

**onDeath — split**: When HP reaches 0, spawn 2 copies of a smaller variant (half HP, same speed). Define `splitInto` field on the definition pointing to a mini variant ID. Not used in current roster but available for future use.

**aura — heal_allies**: Every 1 second, heal all allies within radius 3 by 2 HP per second.

**aura — buff_damage**: All allies within radius 3 deal +25% (or +40%) more damage. Applied by multiplying the contact damage of nearby enemies. Tracked via a per-frame check in Enemies.tsx.

**shield**: Enemy has a shield that absorbs damage before HP. When shield reaches 0, it regenerates after `shieldRegenDelay` seconds. Visual: different emissive color when shielded.

---

## 3. Wave Schedules

### 3.1 Wave Entry Structure

```typescript
export interface WaveEntry {
  enemies: { id: string; weight: number }[];
  spawnInterval: number;
  maxSpawnCount: number;
  hpMultiplier: number;
  spawnPattern: 'ring' | 'cluster' | 'line';
  bossId?: string;
}

export interface StageWaveSchedule {
  stageId: string;
  waves: WaveEntry[]; // index 0 = minute 0, index 29 = minute 29
}
```

### 3.2 Spawn Patterns

**ring** (existing): Enemies spawn in a circle around the player at distance 18-23, evenly distributed.

**cluster**: All enemies in the batch spawn at one random point 18-23 units from player, within a 2-unit radius of each other. Creates dense packs that the player must deal with as a group.

**line**: Enemies spawn along a line perpendicular to the direction from spawn point to player, spaced 1.5 units apart. Creates a "wall" of enemies approaching together.

### 3.3 Wave Schedule Design Principles

Each stage follows this difficulty curve across 30 minutes:

| Minutes | Phase | Description |
|---------|-------|-------------|
| 0-2 | Intro | Swarmers only, low count, ring spawn |
| 3-5 | Ramp | Fast enemies join, first boss at 3, second at 5 |
| 6-9 | Mid-early | Ranged enemies appear, cluster spawns begin |
| 10-14 | Mid | Tanks + elites, boss at 10, mix of spawn patterns |
| 15-19 | Late-mid | All enemy types, faster spawns, boss at 15 |
| 20-24 | Late | High density, elites frequent, boss at 20 |
| 25-29 | Endgame | Maximum spawn rate, all patterns, bosses at 25, 29 |
| 30 | Kill screen | System Purge spawns |

Boss spawn minutes: **3, 5, 10, 15, 20, 25, 29** (7 bosses per run).

### 3.4 HP Scaling

Enemy HP scales with time:
```
finalHp = baseHp * waveEntry.hpMultiplier * (1 + elapsedTime / 120)
```

The `hpMultiplier` in the wave entry allows per-wave tuning on top of the global time scaling. Early waves use 1.0, late waves use 1.5-2.0.

### 3.5 Wave Schedule Data Location

Create `src/data/waveSchedules.ts` containing all 4 stage schedules. Each schedule is an array of 30 `WaveEntry` objects.

### 3.6 Reference Template — Neon District Wave Schedule

Stages 2-4 follow the same pattern with their own enemies, scaled up in difficulty.

| Min | Enemies (id: weight) | Interval | Count | HP Mult | Pattern | Boss |
|-----|----------------------|----------|-------|---------|---------|------|
| 0 | nd_drone:1 | 2.0 | 3 | 1.0 | ring | — |
| 1 | nd_drone:1 | 1.8 | 4 | 1.0 | ring | — |
| 2 | nd_drone:3, nd_speeder:1 | 1.6 | 5 | 1.0 | ring | — |
| 3 | nd_drone:2, nd_speeder:1 | 1.5 | 5 | 1.0 | ring | nd_boss |
| 4 | nd_drone:2, nd_speeder:2 | 1.4 | 6 | 1.0 | ring | — |
| 5 | nd_drone:2, nd_speeder:2 | 1.3 | 6 | 1.0 | cluster | nd_boss |
| 6 | nd_drone:2, nd_speeder:1, nd_turret:1 | 1.2 | 7 | 1.1 | ring | — |
| 7 | nd_drone:2, nd_speeder:1, nd_turret:1 | 1.2 | 7 | 1.1 | cluster | — |
| 8 | nd_drone:2, nd_speeder:2, nd_turret:1 | 1.1 | 8 | 1.1 | ring | — |
| 9 | nd_drone:1, nd_speeder:2, nd_turret:1 | 1.0 | 8 | 1.2 | cluster | — |
| 10 | nd_drone:1, nd_enforcer:1, nd_turret:1, nd_elite:1 | 1.0 | 8 | 1.2 | ring | nd_boss |
| 11 | nd_drone:2, nd_enforcer:1, nd_turret:1 | 1.0 | 9 | 1.2 | line | — |
| 12 | nd_speeder:2, nd_enforcer:1, nd_elite:1 | 0.9 | 9 | 1.3 | ring | — |
| 13 | nd_drone:1, nd_speeder:1, nd_enforcer:1, nd_turret:1 | 0.9 | 10 | 1.3 | cluster | — |
| 14 | nd_drone:2, nd_enforcer:1, nd_elite:1 | 0.9 | 10 | 1.3 | line | — |
| 15 | nd_speeder:1, nd_enforcer:1, nd_turret:1, nd_elite:1 | 0.8 | 10 | 1.4 | ring | nd_boss |
| 16 | nd_drone:1, nd_speeder:1, nd_enforcer:1, nd_elite:1 | 0.8 | 11 | 1.4 | cluster | — |
| 17 | nd_drone:1, nd_enforcer:1, nd_turret:1, nd_elite:1 | 0.8 | 11 | 1.4 | line | — |
| 18 | nd_speeder:2, nd_enforcer:1, nd_elite:2 | 0.7 | 12 | 1.5 | ring | — |
| 19 | nd_drone:1, nd_speeder:1, nd_enforcer:1, nd_turret:1, nd_elite:1 | 0.7 | 12 | 1.5 | cluster | — |
| 20 | nd_enforcer:1, nd_turret:1, nd_elite:2 | 0.7 | 13 | 1.5 | ring | nd_boss |
| 21 | nd_speeder:2, nd_enforcer:1, nd_elite:2 | 0.6 | 13 | 1.6 | line | — |
| 22 | nd_drone:1, nd_enforcer:1, nd_turret:1, nd_elite:2 | 0.6 | 14 | 1.6 | cluster | — |
| 23 | nd_speeder:1, nd_enforcer:1, nd_elite:3 | 0.6 | 14 | 1.7 | ring | — |
| 24 | nd_enforcer:1, nd_turret:1, nd_elite:3 | 0.5 | 15 | 1.7 | line | — |
| 25 | nd_enforcer:2, nd_elite:3 | 0.5 | 15 | 1.8 | ring | nd_boss |
| 26 | nd_speeder:1, nd_enforcer:1, nd_turret:1, nd_elite:3 | 0.5 | 16 | 1.8 | cluster | — |
| 27 | nd_enforcer:2, nd_turret:1, nd_elite:3 | 0.4 | 16 | 1.9 | line | — |
| 28 | nd_enforcer:1, nd_elite:4 | 0.4 | 18 | 1.9 | ring | — |
| 29 | nd_enforcer:2, nd_elite:4 | 0.4 | 20 | 2.0 | cluster | nd_boss |

**Key ranges for all stages:**
- `spawnInterval`: 2.0s (intro) → 0.4s (endgame)
- `maxSpawnCount`: 3 (intro) → 20 (endgame)
- `hpMultiplier`: 1.0 (intro) → 2.0 (endgame)

---

## 4. WaveManager Refactor

Replace the current simple WaveManager with a data-driven version:

```typescript
// New API:
export function getWaveEntry(stageId: string, elapsedTime: number): WaveEntry
export function getSpawnPositions(pattern: SpawnPattern, playerPos: Vec3, count: number): Vec3[]
```

`getWaveEntry` looks up the current minute in the stage's wave schedule. Boss spawning is determined by checking `waveEntry.bossId` when the minute changes — no separate `shouldSpawnBoss` function needed.

`getSpawnPositions` replaces the single `getSpawnPosition` function with pattern-aware multi-position generation.

The `SPAWN_INTERVAL` becomes per-wave (`waveEntry.spawnInterval`).

---

## 5. Enemies.tsx Updates

### 5.1 Enemy Behavior in Game Loop

The `useFrame` loop in Enemies.tsx currently only does chase + contact damage. Expand to handle:

1. **Ranged enemies**: Check distance to player. If within `attackRange`, stop moving and fire projectile every `projectileInterval`. Projectiles use the existing projectile system (`addProjectile`).

2. **Teleport enemies**: Track `lastTeleport` on EnemyInstance. When `teleportInterval` elapsed, move to random position near player.

3. **Shield**: Damage goes to `shieldHp` first. When 0, start regen timer. After `shieldRegenDelay`, restore shield.

4. **Auras**: Per-frame, for each enemy with an aura, find allies within radius 3:
   - `heal_allies`: heal 2 * delta HP
   - `buff_damage`: flag nearby enemies as damage-buffed (multiply contact damage by 1.25 or 1.4)

5. **OnDeath — explode**: When enemy dies, check `onDeath === 'explode'`. If player is within explosion radius, call `takeDamage`.

6. **Spawn pattern**: When spawning a batch, call `getSpawnPositions(pattern, playerPos, count)` instead of calling `getSpawnPosition` per enemy.

### 5.2 Enemy Projectiles

Ranged enemies fire projectiles toward the player's current position. These are enemy projectiles (different from player projectiles). They use a separate array in game state:

```typescript
// In GameState:
enemyProjectiles: EnemyProjectileInstance[];
```

```typescript
export interface EnemyProjectileInstance {
  id: string;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  speed: number;
}
```

Enemy projectiles move in a straight line. If they hit the player (distance < 0.5), call `takeDamage`. Despawn after 3 seconds or leaving stage bounds. Max pool size: 100 enemy projectiles (separate from the 200 player projectile cap).

Render as small colored spheres using a separate InstancedMesh.

### 5.3 Stage-Aware Spawning

`Enemies.tsx` reads `selectedStageId` from `useMetaStore` to determine which wave schedule to use. The spawn loop becomes:

```
1. Get current wave entry for this stage + elapsed time
2. Accumulate delta toward waveEntry.spawnInterval
3. When interval reached, spawn waveEntry.maxSpawnCount enemies
4. Select enemy type by weighted random from waveEntry.enemies
5. Generate positions using waveEntry.spawnPattern
6. Scale HP by waveEntry.hpMultiplier * time scaling
7. Check for boss spawn this minute
```

---

## 6. Hyper Mode

### 6.1 Mechanics

When a player survives 30 minutes on a stage, that stage's ID is added to `hyperModeStageIds` in MetaStore (field already exists).

Hyper Mode modifiers when active:
- Enemy speed × 2.0
- Spawn interval × 0.5 (twice as fast)
- Enemy HP × 1.5
- XP reward × 1.5
- Credit reward × 1.5

### 6.2 Activation

On the stage select UI, cleared stages show a toggle for Hyper Mode. Store `hyperModeEnabled: boolean` in GameState (set at `startRun` based on MetaStore).

### 6.3 Application

The modifiers apply in the spawn loop:
- Multiply enemy speed by 2.0 when creating instance
- Divide spawn interval by 2.0
- Multiply enemy HP by 1.5
- Multiply XP/credit drops by 1.5

---

## 7. StageDefinition Update

Extend `StageDefinition` to reference its wave schedule and enemy roster:

```typescript
export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: UnlockCondition | null;
  enemyPrefix: string; // e.g. 'nd' for neon_district
  groundColor: string; // stage floor color
}
```

The `enemyPrefix` maps to enemy IDs (e.g., `nd_drone`, `nd_boss`). The wave schedule is keyed by `stageId` in `waveSchedules.ts`.

---

## 8. Migration & Backward Compatibility

### 8.1 Existing Enemy IDs

The old enemy IDs (`drone`, `speeder`, `tank`, `sentinel`) become aliases for the Neon District enemies (`nd_drone`, `nd_speeder`, `nd_enforcer`, `nd_boss`). Keep both in `ENEMIES` for any code that references the old IDs. Note: this is a stat rebalance — old enemies get updated stats (e.g., `sentinel` HP 500 → `nd_boss` HP 800). All existing tests referencing old enemy stats must be updated.

### 8.2 Known Issue: Stage-Specific Level Check

The current `checkCondition` for `reach_level` checks `state.stats.bestLevel` globally, ignoring the `stageId` field. Stage unlock conditions like "Reach Level 20 in Neon District" won't correctly filter by stage. Fix: update `checkCondition` to check per-stage best level (stored in `perCharacterStats` or a new `perStageStats` field). Include this fix in this implementation.

### 8.3 Old WaveManager

Replace entirely. The old API (`getSpawnCount`, `getEnemyTypeForTime`, `getSpawnPosition`) is only used in `Enemies.tsx` and tests. Update both.

### 8.3 Old BossManager

Replace entirely. Boss spawning moves into wave schedule data.

---

## 9. Files Changed/Created

**New files:**
- `src/data/waveSchedules.ts` — all 4 stage wave schedules
- `src/data/enemies.ts` — expanded from 4 to 26 enemies (rewrite)

**Modified files:**
- `src/types.ts` — extend EnemyDefinition, EnemyInstance, add EnemyProjectileInstance
- `src/game/WaveManager.ts` — complete rewrite to data-driven
- `src/game/BossManager.ts` — delete or fold into WaveManager
- `src/components/Enemies.tsx` — major rewrite for behaviors, patterns, enemy projectiles
- `src/stores/useGameStore.ts` — add enemyProjectiles, hyperMode flag, extend tick for 30 min, System Purge logic
- `src/data/stages.ts` — add enemyPrefix, groundColor
- `src/ui/ResultsScreen.tsx` — update survived condition to 1800s
- `src/ui/MainMenu.tsx` — hyper mode toggle on stage select
- `src/ui/HUD.tsx` — no changes needed

**Test files:**
- `src/game/__tests__/WaveManager.test.ts` — rewrite
- `src/game/__tests__/BossManager.test.ts` — delete or rewrite
- `src/stores/__tests__/useGameStore.test.ts` — update for new fields

---

## 10. Exclusions

- **Visual models/art** — all enemies remain colored boxes; user will add models later
- **Cyber Augments** — separate sub-project (Phase 4C)
- **Limit Break** — separate sub-project (Phase 4D)
- **Game Modes** — separate sub-project (Phase 4E)
- **Difficulty/Curse modifiers** — separate sub-project (Phase 4F)
- **Destructible stage objects** — future work
- **Enemy projectile homing** — all ranged enemies fire aimed projectiles (straight line toward player position at fire time), not continuously tracking projectiles
