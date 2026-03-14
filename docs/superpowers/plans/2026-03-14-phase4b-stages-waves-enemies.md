# Phase 4B: Stages, Waves & Enemies — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the game from a single enemy set with continuous spawning into 4 distinct stages with unique enemy rosters, per-minute wave schedules, 30-minute runs, horde spawn patterns, a kill screen at 30:00, and hyper mode for cleared stages.

**Architecture:** Data-driven wave system where each stage has 30 WaveEntry objects (one per minute) defining enemy composition, spawn rate, patterns, and HP scaling. Enemy behaviors (chase, ranged, teleport_chase) and abilities (shields, auras, explosions) are defined in EnemyDefinition and executed in the Enemies.tsx game loop. Enemy projectiles are a separate pool rendered with their own InstancedMesh.

**Tech Stack:** TypeScript, React, Three.js (R3F), Zustand, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-phase4b-stages-waves-enemies-design.md`

---

## File Structure

**New files:**
- `src/data/enemies.ts` — rewrite: 26 stage enemies + 2 kill screen entities (replaces 4 old enemies)
- `src/data/waveSchedules.ts` — 4 stage wave schedules (30 WaveEntry each)
- `src/components/EnemyProjectiles.tsx` — renders enemy projectiles via InstancedMesh
- `src/game/__tests__/WaveManager.test.ts` — rewrite for new API

**Modified files:**
- `src/types.ts` — extend EnemyDefinition, EnemyInstance; add EnemyBehavior, EnemyOnDeath, EnemyAura, EnemyProjectileInstance, WaveEntry, StageWaveSchedule types
- `src/data/stages.ts` — add enemyPrefix, groundColor to StageDefinition
- `src/game/WaveManager.ts` — complete rewrite: getWaveEntry(), getSpawnPositions()
- `src/components/Enemies.tsx` — major rewrite: behaviors, patterns, stage-aware spawning, kill screen
- `src/stores/useGameStore.ts` — add enemyProjectiles, hyperModeEnabled; update tick() to 1800s; update takeDamage() for reaper; update damageEnemy() for shields/explosions
- `src/stores/useMetaStore.ts` — add perStageStats, hyper mode unlock, fix checkCondition for stage-specific reach_level
- `src/ui/ResultsScreen.tsx` — survived condition 1800s, record per-stage stats
- `src/ui/MainMenu.tsx` — hyper mode toggle on stage select
- `src/game/BossManager.ts` — delete (bosses in wave schedule)

**Deleted files:**
- `src/game/BossManager.ts`
- `src/game/__tests__/BossManager.test.ts`

---

## Chunk 1: Types, Enemy Data & Stage Definitions

### Task 1: Extend Types

**Files:**
- Modify: `src/types.ts:53-73`

- [ ] **Step 1: Add new type aliases after line 65 (EnemyDefinition closing brace)**

Add these types to `src/types.ts` right after the current `EnemyDefinition` interface:

```typescript
export type EnemyBehavior = 'chase' | 'ranged' | 'teleport_chase';
export type EnemyOnDeath = 'none' | 'explode' | 'split';
export type EnemyAura = 'none' | 'heal_allies' | 'buff_damage';
```

- [ ] **Step 2: Extend EnemyDefinition with new optional fields**

Add these fields to the `EnemyDefinition` interface (before the closing brace at line 65):

```typescript
  isReaper?: boolean;
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
  auraValue?: number;
  auraRadius?: number;
  shieldHp?: number;
  shieldRegenDelay?: number;
  teleportInterval?: number;
```

- [ ] **Step 3: Extend EnemyInstance with new optional fields**

Add these fields to the `EnemyInstance` interface (before the closing brace at line 73):

```typescript
  shieldHp?: number;
  shieldBrokeAt?: number;
  lastTeleport?: number;
  lastProjectile?: number;
```

- [ ] **Step 4: Add EnemyProjectileInstance interface**

Add after EnemyInstance:

```typescript
export interface EnemyProjectileInstance {
  id: string;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  speed: number;
  age: number;
}
```

- [ ] **Step 5: Add WaveEntry and StageWaveSchedule interfaces**

Add at end of file:

```typescript
export type SpawnPattern = 'ring' | 'cluster' | 'line';

export interface WaveEntry {
  enemies: { id: string; weight: number }[];
  spawnInterval: number;
  maxSpawnCount: number;
  hpMultiplier: number;
  spawnPattern: SpawnPattern;
  bossId?: string;
}

export interface StageWaveSchedule {
  stageId: string;
  waves: WaveEntry[];
}
```

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors from types.ts

- [ ] **Step 7: Commit**

```bash
git add src/types.ts
git commit -m "Add enemy behavior, wave schedule, and projectile types"
```

---

### Task 2: Rewrite Enemy Data

**Files:**
- Rewrite: `src/data/enemies.ts`

- [ ] **Step 1: Write all 26 enemy definitions + 2 kill screen entities**

Replace the entire contents of `src/data/enemies.ts` with:

```typescript
import type { EnemyDefinition } from '../types';

export const ENEMIES: Record<string, EnemyDefinition> = {
  // === Neon District (Stage 1) — No special mechanics ===
  nd_drone: {
    id: 'nd_drone', name: 'Street Drone', hp: 20, damage: 5, speed: 2.5,
    xpValue: 1, color: '#ff3366', emissive: '#ff1144', scale: 0.5,
  },
  nd_speeder: {
    id: 'nd_speeder', name: 'Neon Runner', hp: 12, damage: 4, speed: 5.0,
    xpValue: 2, color: '#00ff88', emissive: '#00cc66', scale: 0.35,
  },
  nd_enforcer: {
    id: 'nd_enforcer', name: 'Enforcer', hp: 80, damage: 10, speed: 1.2,
    xpValue: 5, color: '#8844ff', emissive: '#6622cc', scale: 0.8,
  },
  nd_turret: {
    id: 'nd_turret', name: 'Street Turret', hp: 30, damage: 3, speed: 1.0,
    xpValue: 3, color: '#ffaa00', emissive: '#cc8800', scale: 0.6,
    behavior: 'ranged', projectileDamage: 8, projectileSpeed: 8,
    projectileInterval: 2.0, attackRange: 10,
  },
  nd_elite: {
    id: 'nd_elite', name: 'Neon Elite', hp: 120, damage: 12, speed: 2.0,
    xpValue: 8, color: '#ff00ff', emissive: '#cc00cc', scale: 0.7,
  },
  nd_boss: {
    id: 'nd_boss', name: 'Circuit Breaker', hp: 800, damage: 15, speed: 1.5,
    xpValue: 50, color: '#ff8800', emissive: '#ff6600', scale: 1.2,
    isBoss: true, bossScale: 2.5,
  },

  // === Data Mines (Stage 2) — Enemies gain abilities ===
  dm_crawler: {
    id: 'dm_crawler', name: 'Crawler', hp: 30, damage: 7, speed: 2.8,
    xpValue: 2, color: '#44ff44', emissive: '#22cc22', scale: 0.5,
  },
  dm_glitch: {
    id: 'dm_glitch', name: 'Glitch', hp: 18, damage: 5, speed: 4.5,
    xpValue: 3, color: '#00ffff', emissive: '#00cccc', scale: 0.4,
    behavior: 'teleport_chase', teleportInterval: 4,
  },
  dm_golem: {
    id: 'dm_golem', name: 'Data Golem', hp: 150, damage: 12, speed: 1.0,
    xpValue: 8, color: '#666699', emissive: '#444477', scale: 0.9,
    shieldHp: 50, shieldRegenDelay: 3,
  },
  dm_laser: {
    id: 'dm_laser', name: 'Laser Node', hp: 45, damage: 4, speed: 0.8,
    xpValue: 5, color: '#ff4444', emissive: '#cc2222', scale: 0.55,
    behavior: 'ranged', projectileDamage: 12, projectileSpeed: 10,
    projectileInterval: 1.8, attackRange: 12,
  },
  dm_virus: {
    id: 'dm_virus', name: 'Virus Elite', hp: 180, damage: 15, speed: 2.2,
    xpValue: 12, color: '#88ff00', emissive: '#66cc00', scale: 0.7,
  },
  dm_boss: {
    id: 'dm_boss', name: 'Data Worm', hp: 1500, damage: 20, speed: 1.8,
    xpValue: 80, color: '#00ff00', emissive: '#00cc00', scale: 1.5,
    isBoss: true, bossScale: 3.0,
  },

  // === Orbital Station (Stage 3) — Faster, deadlier ===
  os_probe: {
    id: 'os_probe', name: 'Probe', hp: 40, damage: 9, speed: 3.2,
    xpValue: 3, color: '#aaaaff', emissive: '#8888cc', scale: 0.45,
  },
  os_interceptor: {
    id: 'os_interceptor', name: 'Interceptor', hp: 25, damage: 7, speed: 5.5,
    xpValue: 4, color: '#ff88ff', emissive: '#cc66cc', scale: 0.4,
  },
  os_mech: {
    id: 'os_mech', name: 'Heavy Mech', hp: 250, damage: 15, speed: 1.0,
    xpValue: 12, color: '#888888', emissive: '#666666', scale: 1.0,
    onDeath: 'explode', explosionDamage: 20, explosionRadius: 2.0,
  },
  os_sentry: {
    id: 'os_sentry', name: 'Plasma Sentry', hp: 60, damage: 5, speed: 0.6,
    xpValue: 7, color: '#ff6644', emissive: '#cc4422', scale: 0.6,
    behavior: 'ranged', projectileDamage: 15, projectileSpeed: 12,
    projectileInterval: 1.5, attackRange: 14,
  },
  os_commander: {
    id: 'os_commander', name: 'Commander', hp: 300, damage: 18, speed: 2.5,
    xpValue: 15, color: '#ffdd00', emissive: '#ccaa00', scale: 0.8,
    aura: 'buff_damage', auraValue: 0.25, auraRadius: 3,
  },
  os_boss: {
    id: 'os_boss', name: 'Station Core', hp: 3000, damage: 25, speed: 1.2,
    xpValue: 120, color: '#ffffff', emissive: '#aaaaaa', scale: 1.8,
    isBoss: true, bossScale: 3.5,
  },

  // === Core Nexus (Stage 4) — Maximum danger ===
  cn_fragment: {
    id: 'cn_fragment', name: 'Fragment', hp: 50, damage: 12, speed: 3.0,
    xpValue: 4, color: '#ff2222', emissive: '#cc0000', scale: 0.45,
    aura: 'heal_allies', auraValue: 2, auraRadius: 3,
  },
  cn_phaser: {
    id: 'cn_phaser', name: 'Phase Runner', hp: 35, damage: 10, speed: 6.0,
    xpValue: 6, color: '#22ffff', emissive: '#00cccc', scale: 0.4,
    behavior: 'teleport_chase', teleportInterval: 3,
  },
  cn_firewall: {
    id: 'cn_firewall', name: 'Firewall', hp: 400, damage: 20, speed: 0.8,
    xpValue: 15, color: '#ff4400', emissive: '#cc3300', scale: 1.1,
    shieldHp: 100, shieldRegenDelay: 2,
  },
  cn_sniper: {
    id: 'cn_sniper', name: 'Code Sniper', hp: 80, damage: 8, speed: 0.5,
    xpValue: 10, color: '#4444ff', emissive: '#2222cc', scale: 0.55,
    behavior: 'ranged', projectileDamage: 20, projectileSpeed: 14,
    projectileInterval: 1.2, attackRange: 16,
  },
  cn_kernel: {
    id: 'cn_kernel', name: 'Kernel Elite', hp: 500, damage: 25, speed: 2.0,
    xpValue: 20, color: '#ffff00', emissive: '#cccc00', scale: 0.85,
    aura: 'buff_damage', auraValue: 0.40, auraRadius: 3,
  },
  cn_boss: {
    id: 'cn_boss', name: 'Nexus Guardian', hp: 6000, damage: 30, speed: 1.5,
    xpValue: 200, color: '#ff0044', emissive: '#cc0033', scale: 2.0,
    isBoss: true, bossScale: 4.0,
  },

  // === Kill Screen Entities ===
  system_purge: {
    id: 'system_purge', name: 'System Purge', hp: 65535, damage: 65535, speed: 4.0,
    xpValue: 0, color: '#ffffff', emissive: '#ff0000', scale: 3.0,
    isReaper: true,
  },
  null_entity: {
    id: 'null_entity', name: 'Null Entity', hp: 999999, damage: 65535, speed: 4.0,
    xpValue: 0, color: '#000000', emissive: '#ff0000', scale: 3.0,
    isReaper: true,
    // Note: effectively invincible — damageEnemy skips damage for isReaper enemies
  },
};

// Backward-compatible aliases for old enemy IDs
ENEMIES['drone'] = ENEMIES['nd_drone']!;
ENEMIES['speeder'] = ENEMIES['nd_speeder']!;
ENEMIES['tank'] = ENEMIES['nd_enforcer']!;
ENEMIES['sentinel'] = ENEMIES['nd_boss']!;

export const SWARMER_ID = 'nd_drone';
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/enemies.ts
git commit -m "Rewrite enemy data with 26 stage enemies and kill screen entities"
```

---

### Task 3: Update Stage Definitions

**Files:**
- Modify: `src/data/stages.ts`

- [ ] **Step 1: Add enemyPrefix and groundColor to StageDefinition interface**

In `src/data/stages.ts`, update the `StageDefinition` interface to add `enemyPrefix` and `groundColor`:

```typescript
export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: UnlockCondition | null;
  enemyPrefix: string;
  groundColor: string;
}
```

- [ ] **Step 2: Add the new fields to each stage definition**

Update each stage in the STAGES record:

- `neon_district`: `enemyPrefix: 'nd'`, `groundColor: '#1a0a2e'`
- `data_mines`: `enemyPrefix: 'dm'`, `groundColor: '#0a1e0a'`
- `orbital_station`: `enemyPrefix: 'os'`, `groundColor: '#0a0a2e'`
- `core_nexus`: `enemyPrefix: 'cn'`, `groundColor: '#2e0a0a'`

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/data/stages.ts
git commit -m "Add enemyPrefix and groundColor to stage definitions"
```

---

## Chunk 2: Wave Schedules & WaveManager

### Task 4: Create Wave Schedule Data

**Files:**
- Create: `src/data/waveSchedules.ts`

- [ ] **Step 1: Create the wave schedules file with all 4 stages**

Create `src/data/waveSchedules.ts` with:
- Import `WaveEntry`, `StageWaveSchedule` from types
- Export `WAVE_SCHEDULES: Record<string, StageWaveSchedule>` containing schedules for all 4 stages
- Each schedule has 30 `WaveEntry` objects (index 0-29, one per minute)

Use the Neon District reference template from the spec (Section 3.6) for `neon_district` — write all 30 entries exactly as specified in the spec table.

For stages 2-4, copy the Neon District schedule verbatim but replace enemy IDs using this exact mapping. The difficulty parameters (interval, count, hpMultiplier, pattern) remain identical — only enemy IDs and bossIds change.

| Role | Neon District | Data Mines | Orbital Station | Core Nexus |
|------|--------------|------------|----------------|------------|
| Swarmer | nd_drone | dm_crawler | os_probe | cn_fragment |
| Fast | nd_speeder | dm_glitch | os_interceptor | cn_phaser |
| Tank | nd_enforcer | dm_golem | os_mech | cn_firewall |
| Ranged | nd_turret | dm_laser | os_sentry | cn_sniper |
| Elite | nd_elite | dm_virus | os_commander | cn_kernel |
| Boss | nd_boss | dm_boss | os_boss | cn_boss |

Boss minutes for all stages: **3, 5, 10, 15, 20, 25, 29**

Write a helper function `createStageSchedule(mapping)` that takes the ID mapping and generates the 30-entry array, to avoid repeating the same structure 4 times. Then export:

```typescript
function createStageSchedule(ids: {
  swarmer: string; fast: string; tank: string;
  ranged: string; elite: string; boss: string;
}): WaveEntry[] {
  return [
    { enemies: [{ id: ids.swarmer, weight: 1 }], spawnInterval: 2.0, maxSpawnCount: 3, hpMultiplier: 1.0, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 1 }], spawnInterval: 1.8, maxSpawnCount: 4, hpMultiplier: 1.0, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 3 }, { id: ids.fast, weight: 1 }], spawnInterval: 1.6, maxSpawnCount: 5, hpMultiplier: 1.0, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }], spawnInterval: 1.5, maxSpawnCount: 5, hpMultiplier: 1.0, spawnPattern: 'ring', bossId: ids.boss },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }], spawnInterval: 1.4, maxSpawnCount: 6, hpMultiplier: 1.0, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }], spawnInterval: 1.3, maxSpawnCount: 6, hpMultiplier: 1.0, spawnPattern: 'cluster', bossId: ids.boss },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.2, maxSpawnCount: 7, hpMultiplier: 1.1, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.2, maxSpawnCount: 7, hpMultiplier: 1.1, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.1, maxSpawnCount: 8, hpMultiplier: 1.1, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 2 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 8, hpMultiplier: 1.2, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 8, hpMultiplier: 1.2, spawnPattern: 'ring', bossId: ids.boss },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 9, hpMultiplier: 1.2, spawnPattern: 'line' },
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 9, hpMultiplier: 1.3, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 10, hpMultiplier: 1.3, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 10, hpMultiplier: 1.3, spawnPattern: 'line' },
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 10, hpMultiplier: 1.4, spawnPattern: 'ring', bossId: ids.boss },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 11, hpMultiplier: 1.4, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 11, hpMultiplier: 1.4, spawnPattern: 'line' },
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.7, maxSpawnCount: 12, hpMultiplier: 1.5, spawnPattern: 'ring' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.7, maxSpawnCount: 12, hpMultiplier: 1.5, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.7, maxSpawnCount: 13, hpMultiplier: 1.5, spawnPattern: 'ring', bossId: ids.boss },
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.6, maxSpawnCount: 13, hpMultiplier: 1.6, spawnPattern: 'line' },
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.6, maxSpawnCount: 14, hpMultiplier: 1.6, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.6, maxSpawnCount: 14, hpMultiplier: 1.7, spawnPattern: 'ring' },
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 15, hpMultiplier: 1.7, spawnPattern: 'line' },
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 15, hpMultiplier: 1.8, spawnPattern: 'ring', bossId: ids.boss },
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 16, hpMultiplier: 1.8, spawnPattern: 'cluster' },
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.4, maxSpawnCount: 16, hpMultiplier: 1.9, spawnPattern: 'line' },
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.elite, weight: 4 }], spawnInterval: 0.4, maxSpawnCount: 18, hpMultiplier: 1.9, spawnPattern: 'ring' },
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.elite, weight: 4 }], spawnInterval: 0.4, maxSpawnCount: 20, hpMultiplier: 2.0, spawnPattern: 'cluster', bossId: ids.boss },
  ];
}

export const WAVE_SCHEDULES: Record<string, StageWaveSchedule> = {
  neon_district: {
    stageId: 'neon_district',
    waves: createStageSchedule({ swarmer: 'nd_drone', fast: 'nd_speeder', tank: 'nd_enforcer', ranged: 'nd_turret', elite: 'nd_elite', boss: 'nd_boss' }),
  },
  data_mines: {
    stageId: 'data_mines',
    waves: createStageSchedule({ swarmer: 'dm_crawler', fast: 'dm_glitch', tank: 'dm_golem', ranged: 'dm_laser', elite: 'dm_virus', boss: 'dm_boss' }),
  },
  orbital_station: {
    stageId: 'orbital_station',
    waves: createStageSchedule({ swarmer: 'os_probe', fast: 'os_interceptor', tank: 'os_mech', ranged: 'os_sentry', elite: 'os_commander', boss: 'os_boss' }),
  },
  core_nexus: {
    stageId: 'core_nexus',
    waves: createStageSchedule({ swarmer: 'cn_fragment', fast: 'cn_phaser', tank: 'cn_firewall', ranged: 'cn_sniper', elite: 'cn_kernel', boss: 'cn_boss' }),
  },
};
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/waveSchedules.ts
git commit -m "Add wave schedule data for all 4 stages"
```

---

### Task 5: Rewrite WaveManager

**Files:**
- Rewrite: `src/game/WaveManager.ts`
- Rewrite: `src/game/__tests__/WaveManager.test.ts`
- Delete: `src/game/BossManager.ts`
- Delete: `src/game/__tests__/BossManager.test.ts`

- [ ] **Step 1: Write failing tests for new WaveManager API**

Create/rewrite `src/game/__tests__/WaveManager.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getWaveEntry, getSpawnPositions } from '../WaveManager';

describe('getWaveEntry', () => {
  it('returns minute 0 wave for time 0', () => {
    const entry = getWaveEntry('neon_district', 0);
    expect(entry.spawnInterval).toBe(2.0);
    expect(entry.maxSpawnCount).toBe(3);
    expect(entry.enemies[0]!.id).toBe('nd_drone');
  });

  it('returns minute 3 wave at 180s', () => {
    const entry = getWaveEntry('neon_district', 180);
    expect(entry.bossId).toBe('nd_boss');
  });

  it('clamps to minute 29 for times >= 1740', () => {
    const entry = getWaveEntry('neon_district', 1800);
    expect(entry.maxSpawnCount).toBe(20);
  });

  it('returns correct wave for data_mines stage', () => {
    const entry = getWaveEntry('data_mines', 0);
    expect(entry.enemies[0]!.id).toBe('dm_crawler');
  });

  it('falls back to neon_district for unknown stageId', () => {
    const entry = getWaveEntry('unknown_stage', 0);
    expect(entry.enemies[0]!.id).toBe('nd_drone');
  });
});

describe('getSpawnPositions', () => {
  const playerPos = { x: 0, y: 0, z: 0 };

  it('returns correct count of positions for ring', () => {
    const positions = getSpawnPositions('ring', playerPos, 5);
    expect(positions).toHaveLength(5);
  });

  it('ring positions are 18-23 units from player', () => {
    const positions = getSpawnPositions('ring', playerPos, 10);
    for (const p of positions) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z);
      expect(dist).toBeGreaterThanOrEqual(17);
      expect(dist).toBeLessThanOrEqual(25); // allow clamping margin
    }
  });

  it('cluster positions are within 2 units of each other', () => {
    const positions = getSpawnPositions('cluster', playerPos, 5);
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i]!.x - positions[0]!.x;
      const dz = positions[i]!.z - positions[0]!.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      expect(dist).toBeLessThanOrEqual(4); // 2-unit radius
    }
  });

  it('line positions are spaced 1.5 units apart', () => {
    const positions = getSpawnPositions('line', playerPos, 3);
    expect(positions).toHaveLength(3);
    // Line positions should be roughly 1.5 units apart
    const dx = positions[1]!.x - positions[0]!.x;
    const dz = positions[1]!.z - positions[0]!.z;
    const spacing = Math.sqrt(dx * dx + dz * dz);
    expect(spacing).toBeCloseTo(1.5, 0);
  });

  it('clamps positions to stage bounds', () => {
    const edgePos = { x: 22, y: 0, z: 22 };
    const positions = getSpawnPositions('ring', edgePos, 10);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(-24);
      expect(p.x).toBeLessThanOrEqual(24);
      expect(p.z).toBeGreaterThanOrEqual(-24);
      expect(p.z).toBeLessThanOrEqual(24);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/__tests__/WaveManager.test.ts 2>&1 | tail -20`
Expected: FAIL (old API doesn't match)

- [ ] **Step 3: Rewrite WaveManager implementation**

Replace `src/game/WaveManager.ts` with:

```typescript
import type { Vec3, SpawnPattern, WaveEntry } from '../types';
import { WAVE_SCHEDULES } from '../data/waveSchedules';

const STAGE_HALF = 24;
const MIN_SPAWN_DIST = 18;
const MAX_SPAWN_DIST = 23;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getWaveEntry(stageId: string, elapsedTime: number): WaveEntry {
  const schedule = WAVE_SCHEDULES[stageId] ?? WAVE_SCHEDULES['neon_district'];
  if (!schedule) {
    // Absolute fallback — should never happen
    return {
      enemies: [{ id: 'nd_drone', weight: 1 }],
      spawnInterval: 2.0,
      maxSpawnCount: 3,
      hpMultiplier: 1.0,
      spawnPattern: 'ring',
    };
  }
  const minute = Math.min(Math.floor(elapsedTime / 60), schedule.waves.length - 1);
  return schedule.waves[minute]!;
}

export function getSpawnPositions(pattern: SpawnPattern, playerPos: Vec3, count: number): Vec3[] {
  const positions: Vec3[] = [];

  if (pattern === 'ring') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
      positions.push({
        x: clamp(playerPos.x + Math.cos(angle) * dist, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(playerPos.z + Math.sin(angle) * dist, -STAGE_HALF, STAGE_HALF),
      });
    }
  } else if (pattern === 'cluster') {
    const angle = Math.random() * Math.PI * 2;
    const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
    const centerX = playerPos.x + Math.cos(angle) * dist;
    const centerZ = playerPos.z + Math.sin(angle) * dist;
    for (let i = 0; i < count; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * 2;
      positions.push({
        x: clamp(centerX + Math.cos(offsetAngle) * offsetDist, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(centerZ + Math.sin(offsetAngle) * offsetDist, -STAGE_HALF, STAGE_HALF),
      });
    }
  } else {
    // line pattern
    const angle = Math.random() * Math.PI * 2;
    const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
    const centerX = playerPos.x + Math.cos(angle) * dist;
    const centerZ = playerPos.z + Math.sin(angle) * dist;
    // perpendicular direction
    const perpX = -Math.sin(angle);
    const perpZ = Math.cos(angle);
    const startOffset = -((count - 1) * 1.5) / 2;
    for (let i = 0; i < count; i++) {
      const offset = startOffset + i * 1.5;
      positions.push({
        x: clamp(centerX + perpX * offset, -STAGE_HALF, STAGE_HALF),
        y: 0,
        z: clamp(centerZ + perpZ * offset, -STAGE_HALF, STAGE_HALF),
      });
    }
  }

  return positions;
}
```

- [ ] **Step 4: Delete BossManager**

Delete `src/game/BossManager.ts` and `src/game/__tests__/BossManager.test.ts` (if it exists).

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/game/__tests__/WaveManager.test.ts 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/game/WaveManager.ts src/game/__tests__/WaveManager.test.ts
git rm src/game/BossManager.ts
git rm src/game/__tests__/BossManager.test.ts 2>/dev/null || true
git commit -m "Rewrite WaveManager to data-driven wave system, delete BossManager"
```

---

## Chunk 3: GameStore Updates

### Task 6: Update GameStore — Timer, Enemy Projectiles, Hyper Mode, Reaper

**Files:**
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Add imports for new types**

Add `EnemyProjectileInstance` to the imports from `../types` at the top of the file.

- [ ] **Step 2: Add new fields to GameState interface**

Add these fields to the `GameState` interface (after `razorWireTimer`):

```typescript
  enemyProjectiles: EnemyProjectileInstance[];
  hyperModeEnabled: boolean;
```

Add these action signatures:

```typescript
  addEnemyProjectile: (proj: EnemyProjectileInstance) => void;
  tickEnemyProjectiles: (delta: number) => void;
```

- [ ] **Step 3: Initialize new fields in the store's default state**

In the `create<GameState>()` call, add defaults:

```typescript
  enemyProjectiles: [],
  hyperModeEnabled: false,
```

- [ ] **Step 4: Update startRun() to set hyperModeEnabled**

In the `startRun` method, after reading `meta`, add:

```typescript
const hyperModeEnabled = meta.hyperModeActive && meta.hyperModeStageIds.includes(meta.selectedStageId);
```

Note: `hyperModeActive` is added to MetaStore in Task 11. Until Task 11 is implemented, this will be `false` (defaulting to no hyper mode), which is correct.

Include `hyperModeEnabled` in the returned state, and reset `enemyProjectiles: []`.

Also add hyper mode XP multiplier to `addXP`:

```typescript
addXP: (amount) =>
  set((state) => {
    const player = { ...state.player };
    const xpAmount = state.hyperModeEnabled ? amount * 1.5 : amount;
    player.xp += xpAmount;
    // ... rest unchanged
  }),
```

- [ ] **Step 5: Update tick() — change 900 to 1800**

Change line 277 from `if (newTime >= 900)` to `if (newTime >= 1800)`:

```typescript
tick: (delta) =>
  set((state) => {
    const newTime = state.elapsedTime + delta;
    if (newTime >= 1800) {
      return { elapsedTime: 1800, phase: 'gameover' };
    }
    return { elapsedTime: newTime };
  }),
```

- [ ] **Step 6: Update takeDamage() — handle reaper bypass**

Add reaper check at the top of `takeDamage`. The method currently takes `amount: number`. We need to add an optional parameter for reaper damage. Change the signature and add logic:

```typescript
takeDamage: (amount, isReaper = false) =>
  set((state) => {
    const player = { ...state.player };
    if (isReaper) {
      player.hp = 0;
      return { player, phase: 'gameover' as const, damageTaken: state.damageTaken + amount };
    }
    // ... existing damage logic unchanged
  }),
```

Update the `takeDamage` type in GameState interface:
```typescript
takeDamage: (amount: number, isReaper?: boolean) => void;
```

- [ ] **Step 7: Update damageEnemy() — handle shields and explosions**

In `damageEnemy`, add shield logic before applying damage. Add explosion logic when enemy dies:

The full updated `damageEnemy` replaces the existing implementation. Key changes:
1. Skip damage for `null_entity` (effectively invincible)
2. Shield absorption before HP damage
3. Explosion on death damages player
4. System Purge killed spawns Null Entity
5. Hyper mode 1.5x credit multiplier

```typescript
damageEnemy: (id, damage) =>
  set((state) => {
    const shopUpgrades = useMetaStore.getState().upgrades;
    const stats = computePlayerStats(state.items, shopUpgrades);

    let finalDamage = damage;
    const isCrit = stats.critChance > 0 && Math.random() * 100 < stats.critChance;
    if (isCrit) finalDamage *= 2;

    const enemies = state.enemies.map((e) => {
      if (e.id !== id) return e;
      const def = ENEMIES[e.definitionId];
      // Null entity is invincible
      if (def?.id === 'null_entity') return e;

      const updated = { ...e };
      let remainingDmg = finalDamage;

      // Shield absorbs damage first
      if (updated.shieldHp !== undefined && updated.shieldHp > 0) {
        const absorbed = Math.min(remainingDmg, updated.shieldHp);
        updated.shieldHp -= absorbed;
        remainingDmg -= absorbed;
        if (updated.shieldHp <= 0) {
          updated.shieldBrokeAt = state.elapsedTime;
        }
      }

      updated.hp -= remainingDmg;
      return updated;
    });

    const dead = enemies.filter((e) => e.hp <= 0);
    const alive = enemies.filter((e) => e.hp > 0);

    // Handle onDeath effects
    let player = state.player;
    const extraEnemies: EnemyInstance[] = [];
    for (const d of dead) {
      const def = ENEMIES[d.definitionId];
      if (!def) continue;

      // Explosion on death
      if (def.onDeath === 'explode' && def.explosionDamage && def.explosionRadius) {
        const dist = Math.sqrt(
          (d.position.x - player.position.x) ** 2 +
          (d.position.z - player.position.z) ** 2
        );
        if (dist <= def.explosionRadius) {
          const effectiveDmg = Math.max(0, def.explosionDamage - player.armor);
          player = { ...player, hp: player.hp - effectiveDmg };
        }
      }

      // System Purge killed → spawn Null Entity
      if (def.isReaper && def.id === 'system_purge') {
        const nullDef = ENEMIES['null_entity'];
        if (nullDef) {
          extraEnemies.push({
            id: generateId(),
            definitionId: 'null_entity',
            position: { ...d.position },
            hp: nullDef.hp,
            maxHp: nullDef.hp,
          });
        }
      }
    }

    // Credits — existing logic + hyper mode multiplier
    let creditGain = 0;
    let newBossKills = 0;
    const hyperMultiplier = state.hyperModeEnabled ? 1.5 : 1;
    for (const d of dead) {
      const def = ENEMIES[d.definitionId];
      if (def?.isBoss) {
        creditGain += Math.floor((25 + Math.floor(Math.random() * 26)) * hyperMultiplier);
        newBossKills += 1;
      } else if (!def?.isReaper) {
        creditGain += Math.floor((1 + Math.floor(Math.random() * 3)) * hyperMultiplier);
      }
    }

    // Lifesteal — existing logic
    let actualHeal = 0;
    if (stats.lifesteal > 0 && finalDamage > 0) {
      const healAmount = finalDamage * stats.lifesteal / 100;
      const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
      actualHeal = Math.min(healAmount, effectiveMaxHp - player.hp);
      if (actualHeal > 0) {
        player = { ...player, hp: player.hp + actualHeal };
      }
    }

    // Check player death from explosions
    if (player.hp <= 0) {
      player = { ...player, hp: 0 };
      return {
        enemies: [...alive, ...extraEnemies],
        killCount: state.killCount + dead.length,
        creditsEarned: state.creditsEarned + creditGain,
        bossKills: state.bossKills + newBossKills,
        player,
        hpRecovered: state.hpRecovered + Math.max(0, actualHeal),
        phase: 'gameover' as const,
      };
    }

    return {
      enemies: [...alive, ...extraEnemies],
      killCount: state.killCount + dead.length,
      creditsEarned: state.creditsEarned + creditGain,
      bossKills: state.bossKills + newBossKills,
      player,
      hpRecovered: state.hpRecovered + Math.max(0, actualHeal),
    };
  }),
```

Import `generateId` from `../utils/math` if not already imported. Add `EnemyInstance` to the type imports.

- [ ] **Step 8: Add enemyProjectile actions**

```typescript
addEnemyProjectile: (proj) =>
  set((state) => {
    if (state.enemyProjectiles.length >= 100) return {};
    return { enemyProjectiles: [...state.enemyProjectiles, proj] };
  }),

tickEnemyProjectiles: (delta) =>
  set((state) => {
    const player = state.player;
    let hp = player.hp;
    let damageTaken = state.damageTaken;
    const alive: EnemyProjectileInstance[] = [];

    for (const proj of state.enemyProjectiles) {
      const newAge = proj.age + delta;
      if (newAge > 3) continue; // despawn after 3s
      const newPos = {
        x: proj.position.x + proj.velocity.x * delta,
        y: 0,
        z: proj.position.z + proj.velocity.z * delta,
      };
      // Out of bounds check
      if (Math.abs(newPos.x) > 24 || Math.abs(newPos.z) > 24) continue;
      // Hit player check
      const dx = newPos.x - player.position.x;
      const dz = newPos.z - player.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
        const effectiveDmg = Math.max(0, proj.damage - player.armor);
        hp -= effectiveDmg;
        damageTaken += effectiveDmg;
        continue; // projectile consumed
      }
      alive.push({ ...proj, position: newPos, age: newAge });
    }

    if (hp <= 0) {
      return {
        enemyProjectiles: alive,
        player: { ...player, hp: 0 },
        phase: 'gameover' as const,
        damageTaken,
      };
    }
    return {
      enemyProjectiles: alive,
      player: hp !== player.hp ? { ...player, hp } : player,
      damageTaken,
    };
  }),
```

- [ ] **Step 9: Update reset() to clear new fields**

In the `reset` method, add: `enemyProjectiles: []`, `hyperModeEnabled: false`

- [ ] **Step 10: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No errors (may have errors in Enemies.tsx — those will be fixed in Task 7)

- [ ] **Step 11: Run existing tests**

Run: `npx vitest run src/stores/__tests__/useGameStore.test.ts 2>&1 | tail -20`
Expected: Most tests pass. Tests referencing `elapsedTime >= 900` need updating to 1800. Update any failing tests.

- [ ] **Step 12: Commit**

```bash
git add src/stores/useGameStore.ts src/stores/__tests__/useGameStore.test.ts
git commit -m "Update GameStore for 30-min runs, enemy projectiles, shields, explosions, reaper"
```

---

## Chunk 4: Enemies.tsx Rewrite & Enemy Projectiles

### Task 7: Rewrite Enemies.tsx

**Files:**
- Rewrite: `src/components/Enemies.tsx`

This is the largest task. The new Enemies.tsx handles:
1. Stage-aware spawning using wave schedules
2. Boss spawning from wave entry bossId
3. Kill screen (System Purge at 30:00)
4. Chase, ranged, teleport_chase behaviors
5. Aura effects (heal_allies, buff_damage)
6. Shield regeneration
7. Per-enemy coloring via instanced mesh color attribute

- [ ] **Step 1: Rewrite Enemies.tsx**

Replace `src/components/Enemies.tsx` with:

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { ENEMIES } from '../data/enemies';
import { getWaveEntry, getSpawnPositions } from '../game/WaveManager';
import { generateId, distance, directionTo } from '../utils/math';
import { SoundManager } from '../game/SoundManager';
import type { EnemyInstance, Vec3 } from '../types';

const MAX_INSTANCES = 300;
const CONTACT_DISTANCE = 0.8;
const AURA_TICK_INTERVAL = 1.0;

const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();
const tmpColor = new THREE.Color();

function selectWeightedEnemy(enemies: { id: string; weight: number }[]): string {
  const totalWeight = enemies.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of enemies) {
    roll -= e.weight;
    if (roll <= 0) return e.id;
  }
  return enemies[enemies.length - 1]!.id;
}

export default function Enemies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spawnTimerRef = useRef(0);
  const prevTimeRef = useRef(0);
  const prevMinuteRef = useRef(-1);
  const lastHitSoundRef = useRef(0);
  const auraTimerRef = useRef(0);
  const reaperTimerRef = useRef(0);
  const stageIdRef = useRef(useMetaStore.getState().selectedStageId);

  // Set up color attribute on first render
  useRef(() => {
    const mesh = meshRef.current;
    if (mesh) {
      const colors = new Float32Array(MAX_INSTANCES * 3);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }
  });

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1);
    const stageId = stageIdRef.current;
    const hyperMode = store.hyperModeEnabled;

    // --- Wave-based spawn logic ---
    const waveEntry = getWaveEntry(stageId, store.elapsedTime);
    const effectiveInterval = hyperMode ? waveEntry.spawnInterval * 0.5 : waveEntry.spawnInterval;

    spawnTimerRef.current += clampedDelta;
    if (spawnTimerRef.current >= effectiveInterval) {
      spawnTimerRef.current -= effectiveInterval;
      const count = waveEntry.maxSpawnCount;
      const positions = getSpawnPositions(waveEntry.spawnPattern, store.player.position, count);

      for (let i = 0; i < count; i++) {
        if (store.enemies.length >= MAX_INSTANCES) break;
        const pos = positions[i];
        if (!pos) break;
        const enemyTypeId = selectWeightedEnemy(waveEntry.enemies);
        const enemyDef = ENEMIES[enemyTypeId];
        if (!enemyDef) continue;

        const hpScale = waveEntry.hpMultiplier * (1 + store.elapsedTime / 120);
        const hyperHpScale = hyperMode ? 1.5 : 1;
        const hp = Math.floor(enemyDef.hp * hpScale * hyperHpScale);
        const speed = hyperMode ? enemyDef.speed * 2 : enemyDef.speed;

        const instance: EnemyInstance = {
          id: generateId(),
          definitionId: enemyTypeId,
          position: pos,
          hp,
          maxHp: hp,
        };

        // Initialize shield if enemy has one
        if (enemyDef.shieldHp) {
          instance.shieldHp = enemyDef.shieldHp;
        }

        store.spawnEnemy(instance);
        const updated = useGameStore.getState();
        if (updated.enemies.length >= MAX_INSTANCES) break;
      }
    }

    // --- Boss spawn from wave entry ---
    const currentMinute = Math.floor(store.elapsedTime / 60);
    if (currentMinute !== prevMinuteRef.current && currentMinute > prevMinuteRef.current) {
      const bossWave = getWaveEntry(stageId, currentMinute * 60);
      if (bossWave.bossId) {
        const bossDef = ENEMIES[bossWave.bossId];
        if (bossDef && store.enemies.length < MAX_INSTANCES) {
          const pos = getSpawnPositions('ring', store.player.position, 1)[0]!;
          store.spawnEnemy({
            id: generateId(),
            definitionId: bossWave.bossId,
            position: pos,
            hp: bossDef.hp,
            maxHp: bossDef.hp,
          });
          SoundManager.bossSpawn();
        }
      }
    }
    prevMinuteRef.current = currentMinute;

    // --- Kill screen: System Purge at 30:00 ---
    if (store.elapsedTime >= 1800) {
      reaperTimerRef.current += clampedDelta;
      // Spawn first reaper right at 1800, then every 60s
      const timeSince1800 = store.elapsedTime - 1800;
      const expectedReapers = 1 + Math.floor(timeSince1800 / 60);
      // Simple approach: spawn if timer crosses threshold
      if (prevTimeRef.current < 1800 || reaperTimerRef.current >= 60) {
        if (reaperTimerRef.current >= 60) reaperTimerRef.current -= 60;
        const purgeDef = ENEMIES['system_purge'];
        if (purgeDef && store.enemies.length < MAX_INSTANCES) {
          const pos = getSpawnPositions('ring', store.player.position, 1)[0]!;
          store.spawnEnemy({
            id: generateId(),
            definitionId: 'system_purge',
            position: pos,
            hp: purgeDef.hp,
            maxHp: purgeDef.hp,
          });
        }
      }
    }

    prevTimeRef.current = store.elapsedTime;

    // --- Movement + behavior ---
    const { enemies, player } = useGameStore.getState();
    for (const enemy of enemies) {
      const enemyDef = ENEMIES[enemy.definitionId];
      if (!enemyDef) continue;

      const behavior = enemyDef.behavior ?? 'chase';
      const dist = distance(enemy.position, player.position);
      const effectiveSpeed = hyperMode ? enemyDef.speed * 2 : enemyDef.speed;

      // --- Teleport ---
      if (behavior === 'teleport_chase' && enemyDef.teleportInterval) {
        const lastTp = enemy.lastTeleport ?? 0;
        if (store.elapsedTime - lastTp >= enemyDef.teleportInterval) {
          const angle = Math.random() * Math.PI * 2;
          const tpDist = 3 + Math.random() * 5; // 3-8 units from player
          enemy.position.x = player.position.x + Math.cos(angle) * tpDist;
          enemy.position.z = player.position.z + Math.sin(angle) * tpDist;
          enemy.lastTeleport = store.elapsedTime;
        }
      }

      // --- Ranged: stop and fire when in range ---
      if (behavior === 'ranged' && enemyDef.attackRange) {
        if (dist <= enemyDef.attackRange) {
          // In range — fire projectile
          const lastShot = enemy.lastProjectile ?? 0;
          const interval = enemyDef.projectileInterval ?? 2.0;
          if (store.elapsedTime - lastShot >= interval) {
            enemy.lastProjectile = store.elapsedTime;
            const dir = directionTo(enemy.position, player.position);
            const speed = enemyDef.projectileSpeed ?? 8;
            store.addEnemyProjectile({
              id: generateId(),
              position: { ...enemy.position },
              velocity: { x: dir.x * speed, y: 0, z: dir.z * speed },
              damage: enemyDef.projectileDamage ?? 5,
              speed,
              age: 0,
            });
          }
          // Don't move when in range
        } else {
          // Out of range — chase
          const dir = directionTo(enemy.position, player.position);
          enemy.position.x += dir.x * effectiveSpeed * clampedDelta;
          enemy.position.z += dir.z * effectiveSpeed * clampedDelta;
        }
      } else if (behavior !== 'ranged') {
        // Chase (including teleport_chase between teleports)
        const dir = directionTo(enemy.position, player.position);
        enemy.position.x += dir.x * effectiveSpeed * clampedDelta;
        enemy.position.z += dir.z * effectiveSpeed * clampedDelta;
      }

      // --- Contact damage ---
      if (dist < CONTACT_DISTANCE) {
        let contactDmg = enemyDef.damage;

        // Check if this enemy is near a buff_damage aura
        for (const other of enemies) {
          if (other.id === enemy.id) continue;
          const otherDef = ENEMIES[other.definitionId];
          if (otherDef?.aura !== 'buff_damage') continue;
          const auraRadius = otherDef.auraRadius ?? 3;
          if (distance(enemy.position, other.position) <= auraRadius) {
            contactDmg *= (1 + (otherDef.auraValue ?? 0.25));
            break; // only one buff stacks
          }
        }

        if (enemyDef.isReaper) {
          store.takeDamage(contactDmg, true);
        } else {
          store.takeDamage(contactDmg * clampedDelta);
        }
        const now = store.elapsedTime;
        if (now - lastHitSoundRef.current >= 1) {
          lastHitSoundRef.current = now;
          SoundManager.playerHit();
        }
      }
    }

    // --- Aura effects: heal_allies (every AURA_TICK_INTERVAL) ---
    auraTimerRef.current += clampedDelta;
    if (auraTimerRef.current >= AURA_TICK_INTERVAL) {
      auraTimerRef.current -= AURA_TICK_INTERVAL;
      const currentEnemies = useGameStore.getState().enemies;

      for (const enemy of currentEnemies) {
        const def = ENEMIES[enemy.definitionId];
        if (!def?.aura || def.aura !== 'heal_allies') continue;
        const radius = def.auraRadius ?? 3;
        const healPerTick = (def.auraValue ?? 2) * AURA_TICK_INTERVAL;
        for (const ally of currentEnemies) {
          if (ally.id === enemy.id) continue;
          const d = distance(enemy.position, ally.position);
          if (d <= radius) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healPerTick);
          }
        }
      }
    }

    // --- Shield regen (with delay tracking) ---
    for (const enemy of enemies) {
      const def = ENEMIES[enemy.definitionId];
      if (!def?.shieldHp || !def.shieldRegenDelay) continue;
      if (enemy.shieldHp === undefined) continue;
      if (enemy.shieldHp <= 0) {
        // Mark when shield broke
        if (enemy.shieldBrokeAt === undefined) {
          enemy.shieldBrokeAt = store.elapsedTime;
        }
        // Regen after delay
        if (store.elapsedTime - enemy.shieldBrokeAt >= def.shieldRegenDelay) {
          enemy.shieldHp = def.shieldHp;
          enemy.shieldBrokeAt = undefined;
        }
      }
    }

    // --- Tick enemy projectiles ---
    store.tickEnemyProjectiles(clampedDelta);

    // --- Update instanced mesh ---
    const mesh = meshRef.current;
    if (!mesh) return;

    const currentEnemies = useGameStore.getState().enemies;

    // Ensure instanceColor exists
    if (!mesh.instanceColor) {
      const colors = new Float32Array(MAX_INSTANCES * 3);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }

    for (let i = 0; i < MAX_INSTANCES; i++) {
      if (i < currentEnemies.length) {
        const e = currentEnemies[i]!;
        const enemyDef = ENEMIES[e.definitionId];
        const scale = enemyDef?.isBoss ? (enemyDef.bossScale ?? enemyDef.scale) : (enemyDef?.scale ?? 0.5);
        tmpVec.set(e.position.x, e.position.y + scale * 0.5, e.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(scale, scale, scale));

        // Set per-instance color
        if (enemyDef) {
          const hasShield = e.shieldHp !== undefined && e.shieldHp > 0;
          tmpColor.set(hasShield ? '#00aaff' : enemyDef.color);
          mesh.setColorAt(i, tmpColor);
        }
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
        tmpColor.set('#000000');
        mesh.setColorAt(i, tmpColor);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Enemies.tsx
git commit -m "Rewrite Enemies.tsx with stage-aware spawning, behaviors, and kill screen"
```

---

### Task 8: Enemy Projectile Rendering

**Files:**
- Create: `src/components/EnemyProjectiles.tsx`
- Modify: `src/App.tsx` (or wherever game scene components are mounted)

- [ ] **Step 1: Create EnemyProjectiles component**

Create `src/components/EnemyProjectiles.tsx`:

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';

const MAX_ENEMY_PROJECTILES = 100;
const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();

export default function EnemyProjectiles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const projectiles = useGameStore.getState().enemyProjectiles;

    for (let i = 0; i < MAX_ENEMY_PROJECTILES; i++) {
      if (i < projectiles.length) {
        const p = projectiles[i]!;
        tmpVec.set(p.position.x, 0.3, p.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(0.2, 0.2, 0.2));
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_ENEMY_PROJECTILES]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.8} />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Mount EnemyProjectiles in the game scene**

Find the file where `<Enemies />` is mounted (likely `src/App.tsx` or a scene component). Add `<EnemyProjectiles />` next to `<Enemies />`:

```typescript
import EnemyProjectiles from './components/EnemyProjectiles';
// ...
<EnemyProjectiles />
```

- [ ] **Step 3: Verify compile and visual check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/EnemyProjectiles.tsx src/App.tsx
git commit -m "Add EnemyProjectiles component for enemy ranged attacks"
```

---

## Chunk 5: UI Updates, MetaStore & Migration

### Task 9: Update ResultsScreen

**Files:**
- Modify: `src/ui/ResultsScreen.tsx:29`

- [ ] **Step 1: Update survived condition from 900 to 1800**

Change line 29 from:
```typescript
const survived = elapsedTime >= 900;
```
to:
```typescript
const survived = elapsedTime >= 1800;
```

- [ ] **Step 2: Add hyper mode unlock when survived**

In the `handleEnd` function, after `checkAllUnlocks()`, add:

```typescript
if (survived) {
  const meta = useMetaStore.getState();
  if (!meta.hyperModeStageIds.includes(meta.selectedStageId)) {
    useMetaStore.getState().unlockHyperMode(meta.selectedStageId);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/ResultsScreen.tsx
git commit -m "Update survived condition to 1800s and add hyper mode unlock"
```

---

### Task 10: Update MetaStore — Hyper Mode, Per-Stage Stats, checkCondition Fix

**Files:**
- Modify: `src/stores/useMetaStore.ts`

- [ ] **Step 1: Add perStageStats to MetaState interface**

Add to MetaState:
```typescript
perStageStats: Record<string, { bestLevel: number; bestTime: number }>;
```

- [ ] **Step 2: Add unlockHyperMode action**

Add to MetaState interface:
```typescript
unlockHyperMode: (stageId: string) => void;
```

Implement:
```typescript
unlockHyperMode: (stageId) =>
  set((state) => {
    if (state.hyperModeStageIds.includes(stageId)) return {};
    const newIds = [...state.hyperModeStageIds, stageId];
    SaveManager.save({ ...state, hyperModeStageIds: newIds } as SaveData);
    return { hyperModeStageIds: newIds };
  }),
```

- [ ] **Step 3: Update recordRunStats to track per-stage stats**

In `recordRunStats`, add logic to update `perStageStats` with the stage the run was played on:

```typescript
const stageId = useMetaStore.getState().selectedStageId;
const prev = state.perStageStats[stageId] ?? { bestLevel: 0, bestTime: 0 };
const perStageStats = {
  ...state.perStageStats,
  [stageId]: {
    bestLevel: Math.max(prev.bestLevel, level),
    bestTime: Math.max(prev.bestTime, time),
  },
};
```

Include `perStageStats` in the returned state and in `SaveManager.save()`.

- [ ] **Step 4: Fix checkCondition for stage-specific reach_level**

In `checkCondition`, update the `reach_level` case:

```typescript
case 'reach_level': {
  if (cond.stageId) {
    const stageStats = state.perStageStats[cond.stageId];
    return (stageStats?.bestLevel ?? 0) >= cond.level;
  }
  return state.stats.bestLevel >= cond.level;
}
```

- [ ] **Step 5: Initialize perStageStats in defaults and save/load**

Add `perStageStats: {}` to default state. Add to `SaveManager.save()` and `SaveManager.load()`. Update save migration if needed.

- [ ] **Step 6: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/stores/useMetaStore.ts
git commit -m "Add hyper mode unlock, per-stage stats, fix stage-specific reach_level"
```

---

### Task 11: MainMenu Hyper Mode Toggle

**Files:**
- Modify: `src/ui/MainMenu.tsx`

- [ ] **Step 1: Add hyper mode state**

In the MainMenu component, read `hyperModeStageIds` from MetaStore:

```typescript
const hyperModeStageIds = useMetaStore((s) => s.hyperModeStageIds);
```

Add a local state for hyper mode toggle per stage:

```typescript
const [hyperEnabled, setHyperEnabled] = useState(false);
```

- [ ] **Step 2: Add hyper mode toggle to stage select cards**

For each stage card that has been cleared (is in `hyperModeStageIds`), show a toggle button:

```typescript
{hyperModeStageIds.includes(id) && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      setHyperEnabled(!hyperEnabled);
    }}
    style={{
      background: hyperEnabled ? '#ff0000' : 'transparent',
      color: hyperEnabled ? '#fff' : '#ff0000',
      border: '1px solid #ff0000',
      borderRadius: 4,
      padding: '2px 6px',
      fontSize: 10,
      fontWeight: 'bold',
      fontFamily: "'Courier New', monospace",
      cursor: 'pointer',
      marginTop: 4,
    }}
  >
    HYPER
  </button>
)}
```

- [ ] **Step 3: Pass hyperEnabled to startRun**

When starting a run, store the hyper mode selection. The simplest approach: set it on MetaStore before startRun is called, or pass it through GameStore's startRun. Since `startRun` already reads `meta.hyperModeStageIds.includes(meta.selectedStageId)`, we just need to ensure the GameStore checks a `hyperModeActive` flag.

Update the START button's onClick to set a flag on MetaStore or GameStore before calling `startRun()`. Since `startRun` already reads from MetaStore, add a `hyperModeActive: boolean` field to MetaStore:

```typescript
// In MetaStore:
hyperModeActive: boolean;
setHyperModeActive: (active: boolean) => void;
```

Then in MainMenu's START button:
```typescript
useMetaStore.getState().setHyperModeActive(hyperEnabled);
useGameStore.getState().startRun();
```

And in GameStore's startRun:
```typescript
const hyperModeEnabled = meta.hyperModeActive && meta.hyperModeStageIds.includes(meta.selectedStageId);
```

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/ui/MainMenu.tsx src/stores/useMetaStore.ts
git commit -m "Add hyper mode toggle to stage select UI"
```

---

### Task 12: Update Existing Tests & Final Cleanup

**Files:**
- Modify: `src/stores/__tests__/useGameStore.test.ts`
- Modify: any other test files referencing old enemy IDs or 900s

- [ ] **Step 1: Update GameStore tests**

Find all references to:
- `elapsedTime >= 900` → change to `1800`
- `'drone'` / `'speeder'` / `'tank'` / `'sentinel'` enemy IDs → update to new IDs or keep old (they are aliased)
- Old enemy stats (e.g., `hp: 500` for sentinel → `hp: 800` for nd_boss)

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run 2>&1 | tail -30`
Expected: All tests pass

- [ ] **Step 3: Fix any remaining failures**

Address each failure individually.

- [ ] **Step 4: Final compile check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/stores/__tests__/useGameStore.test.ts src/game/__tests__/
git commit -m "Update tests for Phase 4B changes"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Extend types | types.ts |
| 2 | Rewrite enemy data (26 enemies) | enemies.ts |
| 3 | Update stage definitions | stages.ts |
| 4 | Create wave schedules (4 stages × 30 min) | waveSchedules.ts |
| 5 | Rewrite WaveManager | WaveManager.ts, tests |
| 6 | Update GameStore (timer, projectiles, shields, reaper) | useGameStore.ts |
| 7 | Rewrite Enemies.tsx (behaviors, patterns, kill screen) | Enemies.tsx |
| 8 | Enemy projectile rendering | EnemyProjectiles.tsx |
| 9 | Update ResultsScreen (1800s, hyper unlock) | ResultsScreen.tsx |
| 10 | Update MetaStore (hyper mode, per-stage stats, checkCondition) | useMetaStore.ts |
| 11 | MainMenu hyper mode toggle | MainMenu.tsx |
| 12 | Update tests & cleanup | test files |
