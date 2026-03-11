# Phase 1: Core Loop Prototype — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single character auto-attacks waves of enemies in a 3D neon arena. Player moves, gains XP, levels up, picks weapons, and survives 5 minutes.

**Architecture:** React + Three.js via React Three Fiber for 3D rendering. Zustand for game state. Pure TypeScript game logic in `src/game/`, R3F components in `src/components/`, DOM UI in `src/ui/`. Touch input via virtual joystick.

**Tech Stack:** TypeScript, React 18, Three.js, React Three Fiber, Drei, react-three/postprocessing, Zustand, Vite, Vitest

---

## Chunk 1: Project Scaffold and Foundation

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create the Vite project and install dependencies**

```bash
cd /Users/yaa/Downloads/neo_survivor
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install Three.js and R3F dependencies**

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing zustand
npm install -D @types/three vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vite for the project**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Configure TypeScript strict mode**

Update `tsconfig.json` — ensure these are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Update index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Neo Survivor</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #000; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create minimal App.tsx with R3F Canvas**

Create `src/App.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 20, 14], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <ambientLight intensity={0.15} color="#4444ff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#0a0a1a" />
        </mesh>
      </Canvas>
    </div>
  );
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Verify the app runs**

```bash
npm run dev
```

Expected: Browser opens at localhost:5173 showing a dark plane with dim blue ambient lighting.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Initialize Vite + React + R3F project scaffold"
```

---

### Task 2: Game Types and Constants

**Files:**
- Create: `src/types.ts`
- Create: `src/data/weapons.ts`
- Create: `src/data/enemies.ts`
- Create: `src/utils/math.ts`
- Test: `src/utils/__tests__/math.test.ts`

- [ ] **Step 1: Define core game types**

Create `src/types.ts`:

```ts
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vec3;
  hp: number;
  maxHp: number;
  speed: number;
  might: number;
  armor: number;
  xp: number;
  xpToNextLevel: number;
  level: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  category: 'melee' | 'multishot' | 'ranged';
  baseDamage: number;
  cooldown: number;
  projectileSpeed: number;
  area: number;
  pierce: number;
  amount: number;
  maxLevel: number;
  damagePerLevel: number;
}

export interface WeaponInstance {
  definitionId: string;
  level: number;
}

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
}

export interface EnemyInstance {
  id: string;
  definitionId: string;
  position: Vec3;
  hp: number;
  maxHp: number;
}

export interface ProjectileInstance {
  id: string;
  weaponId: string;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  pierce: number;
  pierceCount: number;
  area: number;
  lifetime: number;
  age: number;
}

export interface XPGemInstance {
  id: string;
  position: Vec3;
  value: number;
}

export type GamePhase = 'menu' | 'playing' | 'levelup' | 'paused' | 'gameover';

export interface LevelUpOption {
  type: 'new_weapon' | 'upgrade_weapon';
  weaponId: string;
  level: number;
}
```

- [ ] **Step 2: Define weapon data**

Create `src/data/weapons.ts`:

```ts
import type { WeaponDefinition } from '../types';

export const WEAPONS: Record<string, WeaponDefinition> = {
  plasma_bolt: {
    id: 'plasma_bolt',
    name: 'Plasma Bolt',
    description: 'Fires a bolt at the nearest enemy.',
    category: 'ranged',
    baseDamage: 10,
    cooldown: 1.0,
    projectileSpeed: 15,
    area: 0.3,
    pierce: 1,
    amount: 1,
    maxLevel: 7,
    damagePerLevel: 5,
  },
  neon_whip: {
    id: 'neon_whip',
    name: 'Neon Whip',
    description: 'Lashes in front of the character.',
    category: 'melee',
    baseDamage: 15,
    cooldown: 1.3,
    projectileSpeed: 0,
    area: 2.5,
    pierce: 999,
    amount: 1,
    maxLevel: 7,
    damagePerLevel: 5,
  },
  cyber_shuriken: {
    id: 'cyber_shuriken',
    name: 'Cyber Shuriken',
    description: 'Throws spinning blades that pierce enemies.',
    category: 'multishot',
    baseDamage: 8,
    cooldown: 1.5,
    projectileSpeed: 10,
    area: 0.4,
    pierce: 3,
    amount: 2,
    maxLevel: 7,
    damagePerLevel: 3,
  },
};

export const STARTING_WEAPON_ID = 'plasma_bolt';

export const ALL_WEAPON_IDS = Object.keys(WEAPONS);
```

- [ ] **Step 3: Define enemy data**

Create `src/data/enemies.ts`:

```ts
import type { EnemyDefinition } from '../types';

export const ENEMIES: Record<string, EnemyDefinition> = {
  drone: {
    id: 'drone',
    name: 'Corrupted Drone',
    hp: 20,
    damage: 5,
    speed: 2.5,
    xpValue: 1,
    color: '#ff3366',
    emissive: '#ff1144',
    scale: 0.5,
  },
};

export const SWARMER_ID = 'drone';
```

- [ ] **Step 4: Write math utility tests**

Create `src/utils/__tests__/math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { distance, normalize, directionTo } from '../math';

describe('distance', () => {
  it('returns 0 for same point', () => {
    expect(distance({ x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: 1 })).toBe(0);
  });

  it('calculates distance on xz plane', () => {
    const d = distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 4 });
    expect(d).toBeCloseTo(5);
  });
});

describe('normalize', () => {
  it('normalizes a vector', () => {
    const n = normalize({ x: 3, y: 0, z: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.z).toBeCloseTo(0.8);
  });

  it('returns zero vector for zero input', () => {
    const n = normalize({ x: 0, y: 0, z: 0 });
    expect(n.x).toBe(0);
    expect(n.z).toBe(0);
  });
});

describe('directionTo', () => {
  it('returns normalized direction from A to B', () => {
    const dir = directionTo({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    expect(dir.x).toBeCloseTo(1);
    expect(dir.z).toBeCloseTo(0);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

```bash
npx vitest run src/utils/__tests__/math.test.ts
```

Expected: FAIL — `../math` module not found.

- [ ] **Step 6: Implement math utilities**

Create `src/utils/math.ts`:

```ts
import type { Vec3 } from '../types';

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: 0, z: v.z / len };
}

export function directionTo(from: Vec3, to: Vec3): Vec3 {
  return normalize({ x: to.x - from.x, y: 0, z: to.z - from.z });
}

let nextId = 0;
export function generateId(): string {
  return `${++nextId}`;
}

export function resetIdCounter(): void {
  nextId = 0;
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/math.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/data/ src/utils/ src/test/
git commit -m "Add core game types, weapon/enemy data, and math utilities"
```

---

### Task 3: Zustand Game Store

**Files:**
- Create: `src/stores/useGameStore.ts`
- Test: `src/stores/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/stores/__tests__/useGameStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('initializes with correct defaults', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe('menu');
    expect(state.player.hp).toBe(100);
    expect(state.player.level).toBe(1);
    expect(state.weapons).toHaveLength(0);
    expect(state.enemies).toHaveLength(0);
  });

  it('starts a run with starting weapon', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.weapons).toHaveLength(1);
    expect(state.weapons[0]!.definitionId).toBe('plasma_bolt');
  });

  it('adds XP and levels up', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().addXP(100);
    const state = useGameStore.getState();
    expect(state.player.level).toBeGreaterThanOrEqual(2);
    expect(state.phase).toBe('levelup');
  });

  it('takes damage and dies', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(200);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(0);
    expect(state.phase).toBe('gameover');
  });

  it('spawns and removes enemies', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: '1',
      definitionId: 'drone',
      position: { x: 5, y: 0, z: 5 },
      hp: 20,
      maxHp: 20,
    });
    expect(useGameStore.getState().enemies).toHaveLength(1);
    useGameStore.getState().removeEnemy('1');
    expect(useGameStore.getState().enemies).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/stores/__tests__/useGameStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the game store**

Create `src/stores/useGameStore.ts`:

```ts
import { create } from 'zustand';
import type {
  GamePhase,
  PlayerState,
  WeaponInstance,
  EnemyInstance,
  ProjectileInstance,
  XPGemInstance,
  LevelUpOption,
} from '../types';
import { STARTING_WEAPON_ID, WEAPONS, ALL_WEAPON_IDS } from '../data/weapons';

const XP_BASE = 10;
const XP_GROWTH = 1.2;

function xpForLevel(level: number): number {
  return Math.floor(XP_BASE * Math.pow(XP_GROWTH, level - 1));
}

function generateLevelUpOptions(currentWeapons: WeaponInstance[]): LevelUpOption[] {
  const options: LevelUpOption[] = [];

  // Option to upgrade existing weapons
  for (const weapon of currentWeapons) {
    const def = WEAPONS[weapon.definitionId];
    if (def && weapon.level < def.maxLevel) {
      options.push({
        type: 'upgrade_weapon',
        weaponId: weapon.definitionId,
        level: weapon.level + 1,
      });
    }
  }

  // Option to add new weapons (if slots available, max 6)
  if (currentWeapons.length < 6) {
    const ownedIds = new Set(currentWeapons.map((w) => w.definitionId));
    for (const id of ALL_WEAPON_IDS) {
      if (!ownedIds.has(id)) {
        options.push({ type: 'new_weapon', weaponId: id, level: 1 });
      }
    }
  }

  // Shuffle and pick up to 3
  const shuffled = options.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

interface GameState {
  phase: GamePhase;
  elapsedTime: number;
  killCount: number;

  player: PlayerState;
  weapons: WeaponInstance[];
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  xpGems: XPGemInstance[];

  levelUpOptions: LevelUpOption[];

  // Actions
  reset: () => void;
  startRun: () => void;
  setPhase: (phase: GamePhase) => void;
  tick: (delta: number) => void;
  addXP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  selectLevelUpOption: (option: LevelUpOption) => void;
  spawnEnemy: (enemy: EnemyInstance) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, damage: number) => void;
  addProjectile: (projectile: ProjectileInstance) => void;
  removeProjectile: (id: string) => void;
  addXPGem: (gem: XPGemInstance) => void;
  removeXPGem: (id: string) => void;
  movePlayer: (dx: number, dz: number, delta: number) => void;
}

const INITIAL_PLAYER: PlayerState = {
  position: { x: 0, y: 0, z: 0 },
  hp: 100,
  maxHp: 100,
  speed: 5,
  might: 0,
  armor: 0,
  xp: 0,
  xpToNextLevel: xpForLevel(1),
  level: 1,
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  elapsedTime: 0,
  killCount: 0,

  player: { ...INITIAL_PLAYER },
  weapons: [],
  enemies: [],
  projectiles: [],
  xpGems: [],
  levelUpOptions: [],

  reset: () =>
    set({
      phase: 'menu',
      elapsedTime: 0,
      killCount: 0,
      player: { ...INITIAL_PLAYER },
      weapons: [],
      enemies: [],
      projectiles: [],
      xpGems: [],
      levelUpOptions: [],
    }),

  startRun: () =>
    set({
      phase: 'playing',
      elapsedTime: 0,
      killCount: 0,
      player: { ...INITIAL_PLAYER },
      weapons: [{ definitionId: STARTING_WEAPON_ID, level: 1 }],
      enemies: [],
      projectiles: [],
      xpGems: [],
      levelUpOptions: [],
    }),

  setPhase: (phase) => set({ phase }),

  tick: (delta) => {
    const { phase, elapsedTime } = get();
    if (phase !== 'playing') return;

    const newTime = elapsedTime + delta;

    // 5-minute run limit
    if (newTime >= 300) {
      set({ phase: 'gameover', elapsedTime: 300 });
      return;
    }

    set({ elapsedTime: newTime });
  },

  addXP: (amount) => {
    const { player, weapons } = get();
    let newXP = player.xp + amount;
    let newLevel = player.level;
    let newXPToNext = player.xpToNextLevel;

    if (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newXPToNext = xpForLevel(newLevel);

      const options = generateLevelUpOptions(weapons);
      set({
        player: {
          ...player,
          xp: newXP,
          level: newLevel,
          xpToNextLevel: newXPToNext,
        },
        phase: 'levelup',
        levelUpOptions: options,
      });
      return;
    }

    set({
      player: { ...player, xp: newXP },
    });
  },

  takeDamage: (amount) => {
    const { player } = get();
    const reduced = Math.max(0, amount - player.armor);
    const newHp = Math.max(0, player.hp - reduced);

    if (newHp <= 0) {
      set({
        player: { ...player, hp: 0 },
        phase: 'gameover',
      });
    } else {
      set({
        player: { ...player, hp: newHp },
      });
    }
  },

  selectLevelUpOption: (option) => {
    const { weapons } = get();

    if (option.type === 'new_weapon') {
      set({
        weapons: [...weapons, { definitionId: option.weaponId, level: 1 }],
        phase: 'playing',
        levelUpOptions: [],
      });
    } else {
      set({
        weapons: weapons.map((w) =>
          w.definitionId === option.weaponId
            ? { ...w, level: option.level }
            : w
        ),
        phase: 'playing',
        levelUpOptions: [],
      });
    }
  },

  spawnEnemy: (enemy) =>
    set((state) => ({ enemies: [...state.enemies, enemy] })),

  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    })),

  damageEnemy: (id, damage) => {
    const { enemies, killCount } = get();
    const updated = enemies.map((e) =>
      e.id === id ? { ...e, hp: Math.max(0, e.hp - damage) } : e
    );
    const dead = updated.filter((e) => e.hp <= 0);
    const alive = updated.filter((e) => e.hp > 0);

    set({
      enemies: alive,
      killCount: killCount + dead.length,
    });
  },

  addProjectile: (projectile) =>
    set((state) => ({
      projectiles: [...state.projectiles, projectile],
    })),

  removeProjectile: (id) =>
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== id),
    })),

  addXPGem: (gem) =>
    set((state) => ({ xpGems: [...state.xpGems, gem] })),

  removeXPGem: (id) =>
    set((state) => ({
      xpGems: state.xpGems.filter((g) => g.id !== id),
    })),

  movePlayer: (dx, dz, delta) => {
    const { player } = get();
    const newX = Math.max(-24, Math.min(24, player.position.x + dx * player.speed * delta));
    const newZ = Math.max(-24, Math.min(24, player.position.z + dz * player.speed * delta));
    set({
      player: {
        ...player,
        position: { x: newX, y: 0, z: newZ },
      },
    });
  },
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/stores/__tests__/useGameStore.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "Add Zustand game store with player, weapon, enemy, and XP state"
```

---

## Chunk 2: Stage, Player, and Camera

### Task 4: Neon Stage and Camera

**Files:**
- Create: `src/components/Stage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the Stage component**

Create `src/components/Stage.tsx`:

```tsx
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const STAGE_SIZE = 50;
const GRID_DIVISIONS = 50;

function NeonGrid() {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(
      STAGE_SIZE,
      GRID_DIVISIONS,
      new THREE.Color('#00ffff'),
      new THREE.Color('#1a1a3e')
    );
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
    return grid;
  }, []);

  return <primitive object={gridHelper} />;
}

function StageBoundary() {
  const half = STAGE_SIZE / 2;
  const wallHeight = 3;
  const walls = [
    { pos: [0, wallHeight / 2, -half] as const, size: [STAGE_SIZE, wallHeight, 0.2] as const },
    { pos: [0, wallHeight / 2, half] as const, size: [STAGE_SIZE, wallHeight, 0.2] as const },
    { pos: [-half, wallHeight / 2, 0] as const, size: [0.2, wallHeight, STAGE_SIZE] as const },
    { pos: [half, wallHeight / 2, 0] as const, size: [0.2, wallHeight, STAGE_SIZE] as const },
  ];

  return (
    <>
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </>
  );
}

export default function Stage() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[STAGE_SIZE, STAGE_SIZE]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>
      <NeonGrid />
      <StageBoundary />
    </group>
  );
}
```

- [ ] **Step 2: Create camera follow component**

Add to `src/components/Camera.tsx`:

```tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';
import * as THREE from 'three';

const CAMERA_OFFSET = new THREE.Vector3(0, 20, 14);
const LERP_SPEED = 5;
const targetPos = new THREE.Vector3();

export default function Camera() {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const { player, phase } = useGameStore.getState();
    if (phase !== 'playing' && phase !== 'levelup') return;

    targetPos.set(
      player.position.x + CAMERA_OFFSET.x,
      CAMERA_OFFSET.y,
      player.position.z + CAMERA_OFFSET.z
    );
    camera.position.lerp(targetPos, LERP_SPEED * delta);
    camera.lookAt(player.position.x, 0, player.position.z);
  });

  return null;
}
```

- [ ] **Step 3: Update App.tsx with Stage and Camera**

Replace `src/App.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import Stage from './components/Stage';
import Camera from './components/Camera';
import { useGameStore } from './stores/useGameStore';
import { useEffect } from 'react';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
    </>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    // Auto-start for now (menu comes later)
    if (phase === 'menu') {
      useGameStore.getState().startRun();
    }
  }, [phase]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <GameScene />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Expected: Dark arena with cyan/purple neon grid, glowing magenta boundary walls, camera looking down at an angle.

- [ ] **Step 5: Commit**

```bash
git add src/components/Stage.tsx src/components/Camera.tsx src/App.tsx
git commit -m "Add neon stage with grid, boundaries, and follow camera"
```

---

### Task 5: Player Character and Touch Input

**Files:**
- Create: `src/components/Player.tsx`
- Create: `src/hooks/useInput.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create input hook for keyboard and touch**

Create `src/hooks/useInput.ts`:

```ts
import { useEffect, useRef, useCallback } from 'react';

interface InputState {
  dx: number;
  dz: number;
}

export function useInput(): React.RefObject<InputState> {
  const input = useRef<InputState>({ dx: 0, dz: 0 });
  const keys = useRef<Set<string>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      updateFromKeys();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      updateFromKeys();
    };

    function updateFromKeys() {
      let dx = 0;
      let dz = 0;
      if (keys.current.has('w') || keys.current.has('arrowup')) dz -= 1;
      if (keys.current.has('s') || keys.current.has('arrowdown')) dz += 1;
      if (keys.current.has('a') || keys.current.has('arrowleft')) dx -= 1;
      if (keys.current.has('d') || keys.current.has('arrowright')) dx += 1;

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0) {
        dx /= len;
        dz /= len;
      }
      input.current = { dx, dz };
    }

    // Touch: virtual joystick via drag
    const onTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      touchIdRef.current = touch.identifier;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch && touch.identifier === touchIdRef.current && touchStartRef.current) {
          const maxDist = 50;
          let dx = (touch.clientX - touchStartRef.current.x) / maxDist;
          let dz = (touch.clientY - touchStartRef.current.y) / maxDist;
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len > 1) {
            dx /= len;
            dz /= len;
          }
          input.current = { dx, dz };
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch && touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          touchStartRef.current = null;
          input.current = { dx: 0, dz: 0 };
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return input;
}
```

- [ ] **Step 2: Create Player component**

Create `src/components/Player.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { useInput } from '../hooks/useInput';

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null);
  const input = useInput();

  useFrame((_, delta) => {
    const { phase } = useGameStore.getState();
    if (phase !== 'playing') return;

    const { dx, dz } = input.current!;
    if (dx !== 0 || dz !== 0) {
      useGameStore.getState().movePlayer(dx, dz, delta);
    }

    // Sync mesh position with store
    const { player } = useGameStore.getState();
    if (meshRef.current) {
      meshRef.current.position.set(player.position.x, 0.5, player.position.z);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
      {/* Capsule placeholder */}
      <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={0.8}
      />
      {/* Direction indicator */}
      <mesh position={[0, 0.5, -0.3]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>
    </mesh>
  );
}
```

- [ ] **Step 3: Add Player to App.tsx**

Update `src/App.tsx` — add Player to GameScene:

```tsx
import Player from './components/Player';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
    </>
  );
}
```

- [ ] **Step 4: Verify movement works**

```bash
npm run dev
```

Expected: Cyan capsule on the neon grid. WASD/arrow keys move it. Camera follows. Capsule stays within stage boundaries.

- [ ] **Step 5: Commit**

```bash
git add src/components/Player.tsx src/hooks/useInput.ts src/App.tsx
git commit -m "Add player character with keyboard and touch input"
```

---

## Chunk 3: Enemies and Weapons

### Task 6: Enemy Spawner and AI

**Files:**
- Create: `src/game/WaveManager.ts`
- Create: `src/components/Enemies.tsx`
- Test: `src/game/__tests__/WaveManager.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write WaveManager tests**

Create `src/game/__tests__/WaveManager.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getSpawnCount, getSpawnPosition } from '../WaveManager';

describe('getSpawnCount', () => {
  it('returns base count at time 0', () => {
    expect(getSpawnCount(0)).toBe(3);
  });

  it('increases count over time', () => {
    expect(getSpawnCount(120)).toBeGreaterThan(getSpawnCount(0));
  });

  it('caps at max enemies', () => {
    expect(getSpawnCount(600)).toBeLessThanOrEqual(15);
  });
});

describe('getSpawnPosition', () => {
  it('spawns outside visible range', () => {
    const pos = getSpawnPosition({ x: 0, y: 0, z: 0 });
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    expect(dist).toBeGreaterThanOrEqual(15);
  });

  it('stays within stage bounds', () => {
    const pos = getSpawnPosition({ x: 20, y: 0, z: 20 });
    expect(pos.x).toBeGreaterThanOrEqual(-25);
    expect(pos.x).toBeLessThanOrEqual(25);
    expect(pos.z).toBeGreaterThanOrEqual(-25);
    expect(pos.z).toBeLessThanOrEqual(25);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/__tests__/WaveManager.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement WaveManager**

Create `src/game/WaveManager.ts`:

```ts
import type { Vec3 } from '../types';

const BASE_SPAWN_COUNT = 3;
const MAX_SPAWN_COUNT = 15;
const SPAWN_DISTANCE = 18;
const STAGE_HALF = 24;

export function getSpawnCount(elapsedTime: number): number {
  // Ramp: +1 enemy per 30 seconds, capped at MAX
  const bonus = Math.floor(elapsedTime / 30);
  return Math.min(BASE_SPAWN_COUNT + bonus, MAX_SPAWN_COUNT);
}

export function getSpawnPosition(playerPos: Vec3): Vec3 {
  const angle = Math.random() * Math.PI * 2;
  const dist = SPAWN_DISTANCE + Math.random() * 5;
  let x = playerPos.x + Math.cos(angle) * dist;
  let z = playerPos.z + Math.sin(angle) * dist;

  // Clamp to stage bounds
  x = Math.max(-STAGE_HALF, Math.min(STAGE_HALF, x));
  z = Math.max(-STAGE_HALF, Math.min(STAGE_HALF, z));

  return { x, y: 0, z };
}

export const SPAWN_INTERVAL = 2.0; // seconds between spawn waves
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/game/__tests__/WaveManager.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Create Enemies renderer component**

Create `src/components/Enemies.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { ENEMIES } from '../data/enemies';
import { getSpawnCount, getSpawnPosition, SPAWN_INTERVAL } from '../game/WaveManager';
import { generateId } from '../utils/math';

const tempVec = new THREE.Vector3();
const tempColor = new THREE.Color();

export default function EnemyRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spawnTimer = useRef(0);
  const maxInstances = 300;

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    // Spawn logic
    spawnTimer.current += delta;
    if (spawnTimer.current >= SPAWN_INTERVAL) {
      spawnTimer.current = 0;
      const count = getSpawnCount(store.elapsedTime);
      const enemyDef = ENEMIES.drone!;

      for (let i = 0; i < count; i++) {
        if (store.enemies.length >= maxInstances) break;
        const pos = getSpawnPosition(store.player.position);
        // HP scales with time: base * (1 + time/120)
        const hpScale = 1 + store.elapsedTime / 120;
        const hp = Math.floor(enemyDef.hp * hpScale);
        useGameStore.getState().spawnEnemy({
          id: generateId(),
          definitionId: 'drone',
          position: pos,
          hp,
          maxHp: hp,
        });
      }
    }

    // Move enemies toward player
    const { player, enemies } = useGameStore.getState();
    const playerPos = player.position;
    const enemyDef = ENEMIES.drone!;
    const speed = enemyDef.speed;

    for (const enemy of enemies) {
      const dx = playerPos.x - enemy.position.x;
      const dz = playerPos.z - enemy.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.1) {
        const nx = dx / dist;
        const nz = dz / dist;
        enemy.position.x += nx * speed * delta;
        enemy.position.z += nz * speed * delta;
      }
    }

    // Contact damage
    for (const enemy of enemies) {
      const dx = playerPos.x - enemy.position.x;
      const dz = playerPos.z - enemy.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.8) {
        useGameStore.getState().takeDamage(enemyDef.damage * delta);
      }
    }

    // Update instanced mesh
    if (meshRef.current) {
      const mesh = meshRef.current;
      const currentEnemies = useGameStore.getState().enemies;
      tempColor.set(enemyDef.color);

      for (let i = 0; i < maxInstances; i++) {
        if (i < currentEnemies.length) {
          const e = currentEnemies[i]!;
          const matrix = new THREE.Matrix4();
          matrix.makeTranslation(e.position.x, enemyDef.scale, e.position.z);
          matrix.scale(new THREE.Vector3(enemyDef.scale, enemyDef.scale, enemyDef.scale));
          mesh.setMatrixAt(i, matrix);
          mesh.setColorAt(i, tempColor);
        } else {
          const matrix = new THREE.Matrix4();
          matrix.makeTranslation(0, -100, 0); // hide unused
          mesh.setMatrixAt(i, matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.count = currentEnemies.length;
    }
  });

  const enemyDef = ENEMIES.drone!;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={enemyDef.color}
        emissive={enemyDef.emissive}
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}
```

- [ ] **Step 6: Add Enemies to App.tsx**

```tsx
import EnemyRenderer from './components/Enemies';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <EnemyRenderer />
    </>
  );
}
```

- [ ] **Step 7: Verify enemies spawn and chase player**

```bash
npm run dev
```

Expected: Red/pink cubes spawn around the player every 2 seconds, walk toward the player. Player takes damage on contact.

- [ ] **Step 8: Commit**

```bash
git add src/game/WaveManager.ts src/game/__tests__/ src/components/Enemies.tsx src/App.tsx
git commit -m "Add enemy spawner with wave scaling and instanced rendering"
```

---

### Task 7: Weapon System and Projectiles

**Files:**
- Create: `src/game/WeaponSystem.ts`
- Create: `src/components/Projectiles.tsx`
- Test: `src/game/__tests__/WeaponSystem.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write WeaponSystem tests**

Create `src/game/__tests__/WeaponSystem.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getWeaponDamage, findNearestEnemy } from '../WeaponSystem';
import type { EnemyInstance, Vec3 } from '../../types';

describe('getWeaponDamage', () => {
  it('calculates base damage at level 1', () => {
    expect(getWeaponDamage('plasma_bolt', 1, 0)).toBe(10);
  });

  it('scales damage with level', () => {
    expect(getWeaponDamage('plasma_bolt', 3, 0)).toBe(20);
  });

  it('applies might bonus', () => {
    // 10 base + 10 from levels = 20, * 1.5 might = 30
    expect(getWeaponDamage('plasma_bolt', 3, 50)).toBe(30);
  });
});

describe('findNearestEnemy', () => {
  const enemies: EnemyInstance[] = [
    { id: '1', definitionId: 'drone', position: { x: 5, y: 0, z: 0 }, hp: 10, maxHp: 10 },
    { id: '2', definitionId: 'drone', position: { x: 2, y: 0, z: 0 }, hp: 10, maxHp: 10 },
    { id: '3', definitionId: 'drone', position: { x: 10, y: 0, z: 0 }, hp: 10, maxHp: 10 },
  ];

  it('finds the closest enemy', () => {
    const nearest = findNearestEnemy({ x: 0, y: 0, z: 0 }, enemies);
    expect(nearest?.id).toBe('2');
  });

  it('returns null for empty list', () => {
    expect(findNearestEnemy({ x: 0, y: 0, z: 0 }, [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/__tests__/WeaponSystem.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement WeaponSystem**

Create `src/game/WeaponSystem.ts`:

```ts
import type { Vec3, EnemyInstance } from '../types';
import { WEAPONS } from '../data/weapons';
import { distance, directionTo } from '../utils/math';

export function getWeaponDamage(weaponId: string, level: number, might: number): number {
  const def = WEAPONS[weaponId];
  if (!def) return 0;
  const base = def.baseDamage + def.damagePerLevel * (level - 1);
  return Math.floor(base * (1 + might / 100));
}

export function findNearestEnemy(
  position: Vec3,
  enemies: EnemyInstance[]
): EnemyInstance | null {
  if (enemies.length === 0) return null;

  let nearest: EnemyInstance | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    const d = distance(position, enemy.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = enemy;
    }
  }

  return nearest;
}

export function getWeaponCooldown(weaponId: string, level: number): number {
  const def = WEAPONS[weaponId];
  if (!def) return 1;
  // Reduce cooldown slightly per level: -5% per level beyond 1
  return def.cooldown * (1 - 0.05 * (level - 1));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/game/__tests__/WeaponSystem.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Create Projectiles component**

Create `src/components/Projectiles.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';
import { ENEMIES } from '../data/enemies';
import {
  findNearestEnemy,
  getWeaponDamage,
  getWeaponCooldown,
} from '../game/WeaponSystem';
import { directionTo, generateId, distance } from '../utils/math';

const MAX_PROJECTILES = 200;
const PROJECTILE_LIFETIME = 3;

export default function ProjectileSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cooldowns = useRef<Map<string, number>>(new Map());

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    // Fire weapons
    for (const weapon of store.weapons) {
      const def = WEAPONS[weapon.definitionId];
      if (!def) continue;

      const cd = cooldowns.current.get(weapon.definitionId) ?? 0;
      const newCd = cd - delta;
      if (newCd <= 0) {
        cooldowns.current.set(weapon.definitionId, getWeaponCooldown(weapon.definitionId, weapon.level));

        const damage = getWeaponDamage(weapon.definitionId, weapon.level, store.player.might);

        if (def.category === 'melee') {
          // Melee: damage all enemies in area around player
          for (const enemy of store.enemies) {
            const dist = distance(store.player.position, enemy.position);
            if (dist <= def.area) {
              useGameStore.getState().damageEnemy(enemy.id, damage);
            }
          }
        } else {
          // Ranged/Multishot: fire projectiles
          const amount = def.amount + (weapon.level >= 5 ? 1 : 0);
          for (let i = 0; i < amount; i++) {
            if (store.projectiles.length >= MAX_PROJECTILES) break;

            const target = findNearestEnemy(store.player.position, store.enemies);
            if (!target) break;

            const dir = directionTo(store.player.position, target.position);

            // For multishot, spread projectiles
            let spreadAngle = 0;
            if (def.category === 'multishot' && amount > 1) {
              const spreadRange = 0.5; // radians
              spreadAngle = -spreadRange / 2 + (spreadRange * i) / (amount - 1);
            }

            const cos = Math.cos(spreadAngle);
            const sin = Math.sin(spreadAngle);
            const vx = (dir.x * cos - dir.z * sin) * def.projectileSpeed;
            const vz = (dir.x * sin + dir.z * cos) * def.projectileSpeed;

            useGameStore.getState().addProjectile({
              id: generateId(),
              weaponId: weapon.definitionId,
              position: { ...store.player.position, y: 0.5 },
              velocity: { x: vx, y: 0, z: vz },
              damage,
              pierce: def.pierce,
              pierceCount: 0,
              area: def.area,
              lifetime: PROJECTILE_LIFETIME,
              age: 0,
            });
          }
        }
      } else {
        cooldowns.current.set(weapon.definitionId, newCd);
      }
    }

    // Move projectiles and check collisions
    const projectiles = useGameStore.getState().projectiles;
    const toRemove: string[] = [];

    for (const proj of projectiles) {
      proj.position.x += proj.velocity.x * delta;
      proj.position.z += proj.velocity.z * delta;
      proj.age += delta;

      if (proj.age >= proj.lifetime) {
        toRemove.push(proj.id);
        continue;
      }

      // Check enemy collisions
      const enemies = useGameStore.getState().enemies;
      for (const enemy of enemies) {
        const dist = distance(proj.position, enemy.position);
        if (dist < proj.area + 0.5) {
          useGameStore.getState().damageEnemy(enemy.id, proj.damage);

          // Drop XP gem on kill
          const updatedEnemies = useGameStore.getState().enemies;
          const stillExists = updatedEnemies.find((e) => e.id === enemy.id);
          if (!stillExists) {
            const enemyDef = ENEMIES[enemy.definitionId];
            if (enemyDef) {
              useGameStore.getState().addXPGem({
                id: generateId(),
                position: { ...enemy.position },
                value: enemyDef.xpValue,
              });
            }
          }

          proj.pierceCount++;
          if (proj.pierceCount >= proj.pierce) {
            toRemove.push(proj.id);
            break;
          }
        }
      }
    }

    for (const id of toRemove) {
      useGameStore.getState().removeProjectile(id);
    }

    // Update instanced mesh
    if (meshRef.current) {
      const currentProjectiles = useGameStore.getState().projectiles;
      for (let i = 0; i < MAX_PROJECTILES; i++) {
        const matrix = new THREE.Matrix4();
        if (i < currentProjectiles.length) {
          const p = currentProjectiles[i]!;
          matrix.makeTranslation(p.position.x, p.position.y, p.position.z);
          matrix.scale(new THREE.Vector3(p.area, p.area, p.area));
        } else {
          matrix.makeTranslation(0, -100, 0);
        }
        meshRef.current.setMatrixAt(i, matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = currentProjectiles.length;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PROJECTILES]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#ffff00"
        emissive="#ffff00"
        emissiveIntensity={1}
      />
    </instancedMesh>
  );
}
```

- [ ] **Step 6: Add ProjectileSystem to App.tsx**

```tsx
import ProjectileSystem from './components/Projectiles';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <EnemyRenderer />
      <ProjectileSystem />
    </>
  );
}
```

- [ ] **Step 7: Verify weapons auto-fire and kill enemies**

```bash
npm run dev
```

Expected: Yellow projectiles auto-fire at nearest enemy. Enemies disappear when HP reaches 0.

- [ ] **Step 8: Commit**

```bash
git add src/game/WeaponSystem.ts src/game/__tests__/WeaponSystem.test.ts src/components/Projectiles.tsx src/App.tsx
git commit -m "Add weapon system with auto-fire projectiles and enemy damage"
```

---

## Chunk 4: XP, Level-Up, and Game Timer

### Task 8: XP Gems Pickup

**Files:**
- Create: `src/components/XPGems.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create XP Gems renderer**

Create `src/components/XPGems.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { distance } from '../utils/math';

const MAX_GEMS = 400;
const PICKUP_RADIUS = 1.5;
const MAGNET_RADIUS = 3.0;
const MAGNET_SPEED = 12;

export default function XPGemRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const playerPos = store.player.position;
    const toRemove: string[] = [];
    let totalXP = 0;

    for (const gem of store.xpGems) {
      const dist = distance(playerPos, gem.position);

      // Magnet: attract gems within radius
      if (dist < MAGNET_RADIUS && dist > PICKUP_RADIUS) {
        const dx = playerPos.x - gem.position.x;
        const dz = playerPos.z - gem.position.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
          gem.position.x += (dx / len) * MAGNET_SPEED * delta;
          gem.position.z += (dz / len) * MAGNET_SPEED * delta;
        }
      }

      // Pickup
      if (dist < PICKUP_RADIUS) {
        totalXP += gem.value;
        toRemove.push(gem.id);
      }
    }

    if (totalXP > 0) {
      useGameStore.getState().addXP(totalXP);
    }

    for (const id of toRemove) {
      useGameStore.getState().removeXPGem(id);
    }

    // Merge gems if over limit
    const gems = useGameStore.getState().xpGems;
    if (gems.length > MAX_GEMS) {
      // Remove oldest gems and add their value to a merged gem
      const excess = gems.slice(0, gems.length - MAX_GEMS);
      let mergedValue = 0;
      for (const g of excess) {
        mergedValue += g.value;
        useGameStore.getState().removeXPGem(g.id);
      }
      if (excess[0]) {
        useGameStore.getState().addXPGem({
          id: `merged_${Date.now()}`,
          position: { ...excess[0].position },
          value: mergedValue,
        });
      }
    }

    // Update instanced mesh
    if (meshRef.current) {
      const currentGems = useGameStore.getState().xpGems;
      for (let i = 0; i < MAX_GEMS; i++) {
        const matrix = new THREE.Matrix4();
        if (i < currentGems.length) {
          const g = currentGems[i]!;
          const scale = g.value >= 5 ? 0.25 : 0.15;
          matrix.makeTranslation(g.position.x, 0.2, g.position.z);
          matrix.scale(new THREE.Vector3(scale, scale, scale));
        } else {
          matrix.makeTranslation(0, -100, 0);
        }
        meshRef.current.setMatrixAt(i, matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = currentGems.length;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_GEMS]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#00ff88"
        emissive="#00ff88"
        emissiveIntensity={0.8}
      />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Add to App.tsx**

```tsx
import XPGemRenderer from './components/XPGems';

// Add inside GameScene:
<XPGemRenderer />
```

- [ ] **Step 3: Verify gems drop and get picked up**

```bash
npm run dev
```

Expected: Green gems drop when enemies die. Gems attract to player when close. XP increases on pickup.

- [ ] **Step 4: Commit**

```bash
git add src/components/XPGems.tsx src/App.tsx
git commit -m "Add XP gem drops with magnet pickup and gem merging"
```

---

### Task 9: Game Timer

**Files:**
- Create: `src/components/GameLoop.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create GameLoop component**

Create `src/components/GameLoop.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';

export default function GameLoop() {
  useFrame((_, delta) => {
    useGameStore.getState().tick(delta);
  });

  return null;
}
```

- [ ] **Step 2: Add to App.tsx**

```tsx
import GameLoop from './components/GameLoop';

// Add inside GameScene, first child:
<GameLoop />
```

- [ ] **Step 3: Verify timer triggers game over at 5 minutes**

Run and wait or temporarily set the limit to 10 seconds in `useGameStore.ts` for testing, then revert.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameLoop.tsx src/App.tsx
git commit -m "Add game loop with 5-minute timer"
```

---

### Task 10: Level-Up Screen

**Files:**
- Create: `src/ui/LevelUpScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create LevelUpScreen component**

Create `src/ui/LevelUpScreen.tsx`:

```tsx
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';
import type { LevelUpOption } from '../types';

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  fontFamily: "'Courier New', monospace",
  color: '#fff',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#00ffff',
  textShadow: '0 0 20px #00ffff',
  marginBottom: '30px',
};

const cardStyle: React.CSSProperties = {
  width: '280px',
  padding: '20px',
  margin: '10px',
  border: '1px solid #00ffff',
  borderRadius: '8px',
  background: 'rgba(0, 255, 255, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center',
};

const cardHoverStyle: React.CSSProperties = {
  ...cardStyle,
  borderColor: '#ff00ff',
  background: 'rgba(255, 0, 255, 0.1)',
  boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
};

function OptionCard({ option }: { option: LevelUpOption }) {
  const selectOption = useGameStore((s) => s.selectLevelUpOption);
  const def = WEAPONS[option.weaponId];
  if (!def) return null;

  const isNew = option.type === 'new_weapon';
  const label = isNew ? 'NEW' : `Lv ${option.level}`;
  const damage = def.baseDamage + def.damagePerLevel * (option.level - 1);

  return (
    <div
      style={cardStyle}
      onClick={() => selectOption(option)}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
    >
      <div style={{ fontSize: '12px', color: '#ff00ff', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
        {def.name}
      </div>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
        {def.description}
      </div>
      <div style={{ fontSize: '14px', color: '#00ff88' }}>
        DMG: {damage} | CD: {def.cooldown}s | {def.category}
      </div>
    </div>
  );
}

export default function LevelUpScreen() {
  const phase = useGameStore((s) => s.phase);
  const options = useGameStore((s) => s.levelUpOptions);
  const level = useGameStore((s) => s.player.level);

  if (phase !== 'levelup') return null;

  return (
    <div style={overlayStyle}>
      <div style={titleStyle}>LEVEL {level}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt, i) => (
          <OptionCard key={i} option={opt} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to App.tsx**

```tsx
import LevelUpScreen from './ui/LevelUpScreen';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'menu') {
      useGameStore.getState().startRun();
    }
  }, [phase]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <GameScene />
      </Canvas>
      <LevelUpScreen />
    </div>
  );
}
```

- [ ] **Step 3: Verify level-up screen appears and weapon selection works**

```bash
npm run dev
```

Expected: After collecting enough XP gems, game pauses and shows level-up options. Clicking an option resumes play with the selected weapon/upgrade.

- [ ] **Step 4: Commit**

```bash
git add src/ui/LevelUpScreen.tsx src/App.tsx
git commit -m "Add level-up screen with weapon selection cards"
```

---

## Chunk 5: HUD, Results, and Post-Processing

### Task 11: HUD Overlay

**Files:**
- Create: `src/ui/HUD.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create HUD component**

Create `src/ui/HUD.tsx`:

```tsx
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';

const hudStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  padding: '10px 20px',
  fontFamily: "'Courier New', monospace",
  color: '#fff',
  pointerEvents: 'none',
  zIndex: 10,
};

const barContainerStyle: React.CSSProperties = {
  width: '200px',
  height: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '4px',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HUD() {
  const phase = useGameStore((s) => s.phase);
  const hp = useGameStore((s) => s.player.hp);
  const maxHp = useGameStore((s) => s.player.maxHp);
  const xp = useGameStore((s) => s.player.xp);
  const xpToNext = useGameStore((s) => s.player.xpToNextLevel);
  const level = useGameStore((s) => s.player.level);
  const elapsed = useGameStore((s) => s.elapsedTime);
  const kills = useGameStore((s) => s.killCount);
  const weapons = useGameStore((s) => s.weapons);

  if (phase !== 'playing' && phase !== 'levelup') return null;

  const hpPercent = (hp / maxHp) * 100;
  const xpPercent = (xp / xpToNext) * 100;

  return (
    <div style={hudStyle}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: HP and XP */}
        <div>
          <div style={{ fontSize: '14px', color: '#ff3366' }}>
            HP: {Math.ceil(hp)} / {maxHp}
          </div>
          <div style={barContainerStyle}>
            <div
              style={{
                width: `${hpPercent}%`,
                height: '100%',
                background: hpPercent > 30 ? '#ff3366' : '#ff0000',
                boxShadow: `0 0 8px ${hpPercent > 30 ? '#ff3366' : '#ff0000'}`,
                transition: 'width 0.2s',
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: '#00ff88', marginTop: '8px' }}>
            Lv {level}
          </div>
          <div style={barContainerStyle}>
            <div
              style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: '#00ff88',
                boxShadow: '0 0 8px #00ff88',
                transition: 'width 0.1s',
              }}
            />
          </div>
        </div>

        {/* Center: Timer */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff',
          }}
        >
          {formatTime(elapsed)}
        </div>

        {/* Right: Kill counter */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#ffff00' }}>
            KILLS: {kills}
          </div>
        </div>
      </div>

      {/* Bottom: Weapon list */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '20px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {weapons.map((w, i) => {
          const def = WEAPONS[w.definitionId];
          return (
            <div
              key={i}
              style={{
                padding: '4px 8px',
                border: '1px solid #00ffff',
                borderRadius: '4px',
                fontSize: '11px',
                background: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              {def?.name ?? w.definitionId} Lv{w.level}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add HUD to App.tsx**

```tsx
import HUD from './ui/HUD';

// Add after Canvas, before LevelUpScreen:
<HUD />
```

- [ ] **Step 3: Verify HUD displays correctly**

```bash
npm run dev
```

Expected: HP bar (red), XP bar (green), timer (cyan, center), kill counter (yellow, right), weapon list (bottom).

- [ ] **Step 4: Commit**

```bash
git add src/ui/HUD.tsx src/App.tsx
git commit -m "Add HUD with HP, XP, timer, kills, and weapon display"
```

---

### Task 12: Results Screen

**Files:**
- Create: `src/ui/ResultsScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create ResultsScreen**

Create `src/ui/ResultsScreen.tsx`:

```tsx
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.9)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  fontFamily: "'Courier New', monospace",
  color: '#fff',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ResultsScreen() {
  const phase = useGameStore((s) => s.phase);
  const elapsed = useGameStore((s) => s.elapsedTime);
  const kills = useGameStore((s) => s.killCount);
  const level = useGameStore((s) => s.player.level);
  const weapons = useGameStore((s) => s.weapons);
  const reset = useGameStore((s) => s.reset);
  const startRun = useGameStore((s) => s.startRun);

  if (phase !== 'gameover') return null;

  const survived = elapsed >= 300;

  return (
    <div style={overlayStyle}>
      <div
        style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: survived ? '#00ff88' : '#ff3366',
          textShadow: `0 0 30px ${survived ? '#00ff88' : '#ff3366'}`,
          marginBottom: '30px',
        }}
      >
        {survived ? 'SYSTEM SURVIVED' : 'SYSTEM TERMINATED'}
      </div>

      <div style={{ fontSize: '18px', marginBottom: '20px', color: '#00ffff' }}>
        Time: {formatTime(elapsed)}
      </div>

      <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', color: '#ffff00' }}>{kills}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>ENEMIES KILLED</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', color: '#00ff88' }}>{level}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>LEVEL REACHED</div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>WEAPONS</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {weapons.map((w, i) => {
            const def = WEAPONS[w.definitionId];
            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #00ffff',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {def?.name} Lv{w.level}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => startRun()}
        style={{
          padding: '12px 40px',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: "'Courier New', monospace",
          color: '#000',
          background: '#00ffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        }}
      >
        RETRY
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add to App.tsx**

```tsx
import ResultsScreen from './ui/ResultsScreen';

// Add after LevelUpScreen:
<ResultsScreen />
```

- [ ] **Step 3: Verify results screen appears on death or time-up**

Expected: On death or at 5 minutes, shows "SYSTEM TERMINATED" or "SYSTEM SURVIVED" with stats. Retry button starts a new run.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ResultsScreen.tsx src/App.tsx
git commit -m "Add results screen with stats and retry button"
```

---

### Task 13: Post-Processing (Bloom and Neon)

**Files:**
- Create: `src/components/PostProcessing.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create PostProcessing component**

Create `src/components/PostProcessing.tsx`:

```tsx
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0005, 0.0005)}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
```

- [ ] **Step 2: Install postprocessing dependency**

```bash
npm install postprocessing
```

- [ ] **Step 3: Add PostProcessing to GameScene**

```tsx
import PostProcessing from './components/PostProcessing';

function GameScene() {
  return (
    <>
      <GameLoop />
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <EnemyRenderer />
      <ProjectileSystem />
      <XPGemRenderer />
      <PostProcessing />
    </>
  );
}
```

- [ ] **Step 4: Verify neon bloom effect**

```bash
npm run dev
```

Expected: All emissive materials (player, enemies, gems, walls, projectiles) now glow with bloom. Dark vignette around edges. Subtle chromatic aberration.

- [ ] **Step 5: Commit**

```bash
git add src/components/PostProcessing.tsx src/App.tsx package.json package-lock.json
git commit -m "Add post-processing: bloom, vignette, chromatic aberration"
```

---

### Task 14: Final App.tsx Assembly and Run All Tests

**Files:**
- Modify: `src/App.tsx` (final assembly)

- [ ] **Step 1: Verify final App.tsx has all components**

Read `src/App.tsx` and ensure it imports and renders all components:

```tsx
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import Stage from './components/Stage';
import Camera from './components/Camera';
import Player from './components/Player';
import EnemyRenderer from './components/Enemies';
import ProjectileSystem from './components/Projectiles';
import XPGemRenderer from './components/XPGems';
import GameLoop from './components/GameLoop';
import PostProcessing from './components/PostProcessing';
import HUD from './ui/HUD';
import LevelUpScreen from './ui/LevelUpScreen';
import ResultsScreen from './ui/ResultsScreen';
import { useGameStore } from './stores/useGameStore';

function GameScene() {
  return (
    <>
      <GameLoop />
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <EnemyRenderer />
      <ProjectileSystem />
      <XPGemRenderer />
      <PostProcessing />
    </>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'menu') {
      useGameStore.getState().startRun();
    }
  }, [phase]);

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
    </div>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (math utils, game store, wave manager, weapon system).

- [ ] **Step 3: Run the app and do a full playthrough**

```bash
npm run dev
```

Verify the full gameplay loop:
1. Game starts, player appears on neon grid
2. WASD/touch to move
3. Enemies spawn and chase player
4. Weapons auto-fire, enemies die, drop XP gems
5. Gems attract and get picked up
6. Level up → weapon selection screen → resume
7. Pick up new weapons, upgrade existing ones
8. Timer counts up, enemies get harder
9. Die or reach 5:00 → results screen
10. Retry starts a fresh run

- [ ] **Step 4: Commit final assembly**

```bash
git add -A
git commit -m "Complete Phase 1: core loop prototype with all systems"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```
