# Phase 4B: Stages, Waves & Enemies — Design Spec

## Goal

Transform the game from a single enemy set with continuous spawning into 4 distinct stages with unique enemy rosters, per-minute wave schedules, 30-minute runs, horde spawn patterns, a kill screen at 30:00, and hyper mode for cleared stages.

---

## 1. Extended Run Timer & Kill Screen

### 1.1 Timer Extension

Change the run duration from 15 minutes (900s) to 30 minutes (1800s). The `tick()` function no longer force-ends the game at any time — the kill screen entity is what ends runs.

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
  aura?: EnemyAura;
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

Add fields to track runtime state:

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

| ID | Name | Archetype | HP | Dmg | Speed | Behavior | Special |
|----|------|-----------|-----|-----|-------|----------|---------|
| nd_drone | Street Drone | Swarmer | 20 | 5 | 2.5 | chase | — |
| nd_speeder | Neon Runner | Fast | 12 | 4 | 5.0 | chase | — |
| nd_enforcer | Enforcer | Tank | 80 | 10 | 1.2 | chase | — |
| nd_turret | Street Turret | Ranged | 30 | 3 | 1.0 | ranged | projectile, range 10 |
| nd_elite | Neon Elite | Elite | 120 | 12 | 2.0 | chase | — |
| nd_boss | Circuit Breaker | Boss | 800 | 15 | 1.5 | chase | bossScale 2.5 |

#### Data Mines (Stage 2) — Enemies gain abilities

| ID | Name | Archetype | HP | Dmg | Speed | Behavior | Special |
|----|------|-----------|-----|-----|-------|----------|---------|
| dm_crawler | Crawler | Swarmer | 30 | 7 | 2.8 | chase | — |
| dm_glitch | Glitch | Fast | 18 | 5 | 4.5 | teleport_chase | teleports every 4s |
| dm_golem | Data Golem | Tank | 150 | 12 | 1.0 | chase | shield 50hp, regen 3s |
| dm_laser | Laser Node | Ranged | 45 | 4 | 0.8 | ranged | projectile, range 12 |
| dm_virus | Virus Elite | Elite | 180 | 15 | 2.2 | chase | — |
| dm_boss | Data Worm | Boss | 1500 | 20 | 1.8 | chase | bossScale 3.0 |

#### Orbital Station (Stage 3) — Faster, deadlier

| ID | Name | Archetype | HP | Dmg | Speed | Behavior | Special |
|----|------|-----------|-----|-----|-------|----------|---------|
| os_probe | Probe | Swarmer | 40 | 9 | 3.2 | chase | — |
| os_interceptor | Interceptor | Fast | 25 | 7 | 5.5 | chase | — |
| os_mech | Heavy Mech | Tank | 250 | 15 | 1.0 | chase | explodes on death (dmg 20, radius 2.0) |
| os_sentry | Plasma Sentry | Ranged | 60 | 5 | 0.6 | ranged | homing projectile, range 14 |
| os_commander | Commander | Elite | 300 | 18 | 2.5 | chase | aura: buff_damage (+25% to nearby) |
| os_boss | Station Core | Boss | 3000 | 25 | 1.2 | chase | bossScale 3.5 |

#### Core Nexus (Stage 4) — Auras, healing, maximum danger

| ID | Name | Archetype | HP | Dmg | Speed | Behavior | Special |
|----|------|-----------|-----|-----|-------|----------|---------|
| cn_fragment | Fragment | Swarmer | 50 | 12 | 3.0 | chase | aura: heal_allies (2hp/s in radius 3) |
| cn_phaser | Phase Runner | Fast | 35 | 10 | 6.0 | teleport_chase | teleports every 3s |
| cn_firewall | Firewall | Tank | 400 | 20 | 0.8 | chase | shield 100hp, regen 2s |
| cn_sniper | Code Sniper | Ranged | 80 | 8 | 0.5 | ranged | fast projectile, range 16 |
| cn_kernel | Kernel Elite | Elite | 500 | 25 | 2.0 | chase | aura: buff_damage (+40% to nearby) |
| cn_boss | Nexus Guardian | Boss | 6000 | 30 | 1.5 | chase | bossScale 4.0 |

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

---

## 4. WaveManager Refactor

Replace the current simple WaveManager with a data-driven version:

```typescript
// New API:
export function getWaveEntry(stageId: string, elapsedTime: number): WaveEntry
export function getSpawnPositions(pattern: SpawnPattern, playerPos: Vec3, count: number): Vec3[]
export function shouldSpawnBoss(stageId: string, currentTime: number, previousTime: number): string | null
// Returns boss definitionId or null
```

`getWaveEntry` looks up the current minute in the stage's wave schedule.

`getSpawnPositions` replaces the single `getSpawnPosition` function with pattern-aware multi-position generation.

`shouldSpawnBoss` returns the boss ID from the wave entry for the current minute (if any), replacing the hardcoded array.

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

Enemy projectiles move in a straight line. If they hit the player (distance < 0.5), call `takeDamage`. Despawn after 3 seconds or leaving stage bounds.

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

The old enemy IDs (`drone`, `speeder`, `tank`, `sentinel`) become aliases for the Neon District enemies (`nd_drone`, `nd_speeder`, `nd_enforcer`, `nd_boss`). Keep both in `ENEMIES` for any code that references the old IDs.

### 8.2 Old WaveManager

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
- **Enemy projectile homing** — Orbital Station's Plasma Sentry fires homing shots, but this is simple tracking toward player position at fire time, not continuous homing
