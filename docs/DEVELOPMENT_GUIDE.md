# Neo Survivor — Development Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Xcode** 15+ (for iOS builds, Mac only)
- **CocoaPods** (for iOS dependencies)
- A modern browser with WebGL2 support (Chrome/Safari for testing)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-username>/neo-survivor.git
cd neo-survivor

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# → http://localhost:5173
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run ios:sync` | Sync web build to iOS project |
| `npm run ios:open` | Open Xcode project |
| `npm run ios:run` | Build and run on iOS simulator |

## iOS Build

```bash
# First time setup
npm run build
npx cap add ios
npx cap sync ios

# Subsequent builds
npm run build
npx cap sync ios
npx cap open ios
# → Build and run from Xcode
```

## Coding Conventions

### General

- **Language:** TypeScript strict mode — no `any` types
- **Formatting:** Prettier with default config
- **Linting:** ESLint with recommended rules
- **Naming:**
  - Files: `PascalCase.tsx` for components, `camelCase.ts` for logic/utils
  - Variables/functions: `camelCase`
  - Types/interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Zustand stores: `use<Name>Store`

### React / R3F Components

- Functional components only, no class components
- Use hooks for state and side effects
- Keep R3F components focused on rendering — delegate logic to `game/` modules
- Use `useFrame()` for per-frame updates, not `setInterval`/`requestAnimationFrame`

```tsx
// Good: logic separated from rendering
function Enemy({ id }: { id: string }) {
  const enemy = useGameStore((s) => s.enemies[id]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current && enemy) {
      const direction = calculateDirection(enemy.position, playerPosition);
      meshRef.current.position.lerp(direction, delta * enemy.speed);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={enemy.color} emissive={enemy.color} />
    </mesh>
  );
}
```

### Game Logic (`src/game/`)

- Pure TypeScript — no React imports
- Classes or plain functions, whichever is clearer
- All game data constants in `src/data/` — never hardcode stats in logic files
- Document formulas with comments when non-obvious

```ts
// Good: formula documented
// Damage = baseDamage * (1 + might/100) * critMultiplier - targetArmor
function calculateDamage(
  baseDamage: number,
  might: number,
  isCrit: boolean,
  critMultiplier: number,
  targetArmor: number
): number {
  const raw = baseDamage * (1 + might / 100) * (isCrit ? critMultiplier : 1);
  return Math.max(1, Math.floor(raw - targetArmor));
}
```

### State Management (Zustand)

- One store per domain: `useGameStore`, `useMetaStore`, `useSettingsStore`
- Use selectors to minimize re-renders
- Never mutate state directly — always use `set()`

```ts
// Good: selector picks only what's needed
const hp = useGameStore((s) => s.player.hp);

// Bad: subscribes to entire store
const store = useGameStore();
```

### Performance Rules

- **Instanced rendering** for enemies, projectiles, pickups — never individual meshes for bulk objects
- **Object pool** before creating/destroying — especially for projectiles and particles
- **Avoid allocations in the game loop** — pre-allocate vectors, reuse objects
- **Memoize** expensive UI components with `React.memo`
- **Profile before optimizing** — use Chrome DevTools Performance tab and R3F `<Stats />` component

## Folder Structure Rules

| Path | Content | Rules |
| --- | --- | --- |
| `src/game/` | Core game systems | No React imports. Pure logic. |
| `src/components/` | R3F 3D components | Rendering only. Delegate logic to `game/`. |
| `src/ui/` | DOM overlay UI | React components for HUD, menus, modals. |
| `src/stores/` | Zustand stores | State shape and actions. No rendering logic. |
| `src/data/` | Game data definitions | Constants, weapon/enemy/item stats. Export as typed objects. |
| `src/hooks/` | Custom hooks | Reusable logic for input, game loop, persistence. |
| `src/utils/` | Pure utilities | Math, pooling, storage. No game-specific logic. |
| `public/` | Static assets | Models, textures, audio. Not processed by Vite. |

## Asset Pipeline

### 3D Models

- Format: **glTF 2.0** (`.glb` binary preferred)
- Compression: **Draco** for geometry
- Poly budget: characters ~2K tris, enemies ~500 tris, props ~200 tris
- Export from Blender with Y-up axis

### Textures

- Format: **KTX2** with Basis Universal compression for runtime
- PNG/JPG source files kept in `assets-source/` (not committed)
- Max resolution: 512x512 for characters, 256x256 for enemies/props
- Use texture atlases where possible

### Audio

- Format: **MP3** for music (streaming), **WAV/OGG** for SFX (low latency)
- Music: 128kbps stereo
- SFX: mono, normalized, short duration (<2s)

## Testing Strategy

### Unit Tests (Vitest)

- All `src/game/` modules must have unit tests
- Test damage formulas, stat calculations, wave schedules, loot tables
- Mock Zustand stores with `create()` from Zustand

### Component Tests (React Testing Library)

- Test UI components: level-up screen selections, shop purchases, HUD display
- Use `@react-three/test-renderer` for R3F component testing

### Manual Testing

- Browser: Chrome DevTools for performance profiling
- iOS Simulator: test touch controls, safe areas, performance
- Real device: test on oldest supported device (iPhone 15) before release

## Git Workflow

- **main** branch: stable, deployable
- **dev** branch: integration branch for features
- **feature/xxx** branches: individual features, merged to dev via PR
- Commit messages: imperative mood, concise (`Add weapon evolution system`, `Fix XP gem merge logic`)
- PR required for merges to main

## Environment Variables

```bash
# .env.local (not committed)
VITE_DEBUG_MODE=true          # Show FPS counter, debug overlays
VITE_SKIP_SPLASH=true         # Skip splash screen in dev
VITE_UNLOCK_ALL=true          # Unlock all characters/stages for testing
```
