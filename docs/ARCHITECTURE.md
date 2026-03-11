# Neo Survivor — Architecture Document

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Language | TypeScript | Type safety, productivity |
| 3D Engine | Three.js | WebGL-based 3D rendering |
| React Binding | React Three Fiber (R3F) | Declarative 3D scene management |
| UI Framework | React 18+ | HUD, menus, level-up screens |
| State Management | Zustand | Lightweight game state store |
| Physics | Rapier (via @react-three/rapier) | Collision detection, enemy-player interactions |
| Post-Processing | @react-three/postprocessing | Bloom, glow, neon visual effects |
| Audio | Howler.js | Sound effects and music |
| Mobile Wrapper | Capacitor | Native iOS shell for App Store |
| Build Tool | Vite | Fast dev server and production builds |
| Package Manager | npm | Dependency management |
| Testing | Vitest + React Testing Library | Unit and component tests |

## Project Structure

```
neo_survivor/
├── docs/                    # Architecture, guides, specs
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── PHASE_PLAN.md
├── public/                  # Static assets
│   ├── models/              # 3D models (.glb/.gltf)
│   ├── textures/            # Textures and sprite sheets
│   ├── audio/               # Sound effects and music
│   └── fonts/               # Custom fonts
├── src/
│   ├── main.tsx             # App entry point
│   ├── App.tsx              # Root component, scene setup
│   ├── game/                # Core game logic (non-React)
│   │   ├── GameLoop.ts      # Main update loop, timing
│   │   ├── WaveManager.ts   # Enemy wave spawning schedules
│   │   ├── DamageSystem.ts  # Damage calculation, crits, armor
│   │   ├── LevelSystem.ts   # XP, level-up, option generation
│   │   ├── LootSystem.ts    # Drops, chests, pickup logic
│   │   ├── StatsEngine.ts   # Stat aggregation and modifiers
│   │   └── WeaponFactory.ts # Weapon creation and evolution
│   ├── components/          # React Three Fiber components
│   │   ├── Player.tsx       # Player character mesh + controls
│   │   ├── Enemy.tsx        # Enemy mesh + AI behavior
│   │   ├── Weapon.tsx       # Weapon visual + projectile spawner
│   │   ├── Projectile.tsx   # Projectile mesh + movement
│   │   ├── XPGem.tsx        # XP gem pickup
│   │   ├── Chest.tsx        # Treasure chest drop
│   │   ├── Stage.tsx        # Stage ground, walls, destructibles
│   │   └── Effects.tsx      # Neon trails, explosions, particles
│   ├── ui/                  # 2D overlay UI (React DOM)
│   │   ├── HUD.tsx          # Health, timer, level, currency
│   │   ├── LevelUpScreen.tsx # Weapon/item selection modal
│   │   ├── PauseMenu.tsx    # Pause and settings
│   │   ├── ResultsScreen.tsx # End-of-run summary
│   │   ├── ShopScreen.tsx   # Meta-progression shop
│   │   ├── GachaScreen.tsx  # Character unlock gacha
│   │   └── MainMenu.tsx     # Title screen and mode select
│   ├── stores/              # Zustand state stores
│   │   ├── useGameStore.ts  # Run state: HP, weapons, items, timer
│   │   ├── useMetaStore.ts  # Persistent state: upgrades, currency, unlocks
│   │   └── useSettingsStore.ts # Audio, controls, display settings
│   ├── data/                # Static game data (JSON/TS constants)
│   │   ├── weapons.ts       # Weapon definitions and evolution trees
│   │   ├── items.ts         # Passive item definitions
│   │   ├── enemies.ts       # Enemy types and stat scaling
│   │   ├── waves.ts         # Per-stage wave schedules
│   │   ├── characters.ts    # Character stats, skills, starting weapons
│   │   ├── upgrades.ts      # Meta-progression shop data
│   │   └── augments.ts      # Cyber Augment (Arcana) definitions
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameLoop.ts   # Frame-based update hook
│   │   ├── useInput.ts      # Touch/keyboard input handler
│   │   └── useAutoSave.ts   # Periodic meta-state persistence
│   └── utils/               # Shared utilities
│       ├── math.ts          # Vector math, distance, random
│       ├── pool.ts          # Object pooling for projectiles/enemies
│       └── storage.ts       # LocalStorage / Capacitor Preferences wrapper
├── ios/                     # Capacitor iOS project (auto-generated)
├── capacitor.config.ts      # Capacitor configuration
├── index.html               # HTML entry
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
├── CLAUDE.md
└── GAME_SPEC.md
```

## Rendering Pipeline

### Scene Graph

```
Canvas (R3F)
├── Camera (PerspectiveCamera, top-down angled ~60°)
├── Lighting
│   ├── AmbientLight (dim, dark atmosphere)
│   ├── PointLights (neon accent lights on stage objects)
│   └── SpotLight (follows player, cyberpunk spotlight feel)
├── Stage
│   ├── Ground plane (grid texture, neon line accents)
│   ├── Destructible objects (neon signs, crates, hover cars)
│   └── Boundaries (walls, force fields)
├── Player (character mesh + shadow)
├── Enemies (instanced meshes for performance)
├── Projectiles (instanced meshes or sprites)
├── Pickups (XP gems, coins, chests — instanced)
└── Effects (particles, explosions, trails)
```

### Post-Processing Stack (Cyberpunk Neon)

Applied via `@react-three/postprocessing` EffectComposer:

1. **Bloom** — UnrealBloomPass for neon glow on emissive materials
2. **ChromaticAberration** — Subtle RGB split for cyberpunk feel
3. **Vignette** — Dark edges focusing attention on center
4. **ToneMapping** — ACES filmic for cinematic contrast
5. **Scanlines** (optional) — CRT/hologram effect on UI elements

### Performance Targets (Mobile)

| Metric | Target |
| --- | --- |
| FPS | 60 fps on iPhone 12+, 30 fps minimum on iPhone SE 2 |
| Draw calls | Under 100 per frame (via instancing) |
| Enemies on screen | Up to 300 (instanced rendering) |
| Projectiles on screen | Up to 200 (object pooled) |
| XP gems on screen | Up to 400 (merge beyond this) |
| Memory | Under 300MB total |
| Bundle size | Under 20MB (excluding assets) |

### Performance Strategies

- **Instanced Meshes:** All enemies of the same type share one draw call via `InstancedMesh`
- **Object Pooling:** Projectiles, XP gems, and particles are pooled — never created/destroyed at runtime
- **LOD:** Enemies far from camera use simplified geometry
- **Frustum Culling:** Built into Three.js, only render visible objects
- **Spatial Hashing:** Efficient collision detection grid for enemy-projectile interactions
- **Web Workers:** Heavy calculations (pathfinding, wave scheduling) offloaded to workers
- **Asset Compression:** glTF models with Draco compression, textures in KTX2/Basis format

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                   Game Loop (60fps)              │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Input   │→ │  Update   │→ │   Render     │  │
│  │  System  │  │  Systems  │  │   (R3F)      │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
│                     │                            │
│        ┌────────────┼────────────┐               │
│        ↓            ↓            ↓               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Player  │ │  Weapon  │ │  Enemy   │         │
│  │  Movement│ │  Cooldown│ │  Spawn   │         │
│  │          │ │  & Fire  │ │  & AI    │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│        │            │            │               │
│        └────────────┼────────────┘               │
│                     ↓                            │
│             ┌──────────────┐                     │
│             │  Collision   │                     │
│             │  Detection   │                     │
│             └──────────────┘                     │
│                     │                            │
│        ┌────────────┼────────────┐               │
│        ↓            ↓            ↓               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Damage  │ │   Loot   │ │   XP     │         │
│  │  System  │ │  Drops   │ │  System  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                     │                            │
│                     ↓                            │
│             ┌──────────────┐                     │
│             │  Zustand     │                     │
│             │  Game Store  │←──── UI reads       │
│             └──────────────┘                     │
└─────────────────────────────────────────────────┘

┌──────────────────────────────┐
│  Zustand Meta Store          │
│  (persisted to localStorage) │
│  - Permanent upgrades        │
│  - Unlocked characters       │
│  - Currency balance          │
│  - Settings                  │
└──────────────────────────────┘
```

## State Architecture

### Run State (useGameStore) — Reset each run

- Player position, HP, current stats (base + modifiers)
- Equipped weapons array (max 6) with levels
- Equipped items array (max 6) with levels
- Active Cyber Augments (max 3)
- Elapsed time, kill count, coins collected
- Active enemies list, active projectiles list
- Level-up queue, reroll/skip/banish counts

### Meta State (useMetaStore) — Persisted across runs

- Currency (Credits) balance
- PowerUp levels (24 upgrades with ranks)
- Unlocked characters and their G-Ranks
- Unlocked stages
- Unlocked Cyber Augments
- Achievement progress
- Gacha history

### Persistence

- Meta state saved to `localStorage` via Zustand `persist` middleware
- On iOS (Capacitor), uses `@capacitor/preferences` for native key-value storage
- Auto-save triggers on: run end, shop purchase, gacha pull, settings change
- Periodic auto-save every 60 seconds during runs as backup

## iOS Deployment via Capacitor

### Build Pipeline

```
TypeScript → Vite Build → Static dist/ → Capacitor Sync → Xcode Project → App Store
```

### Capacitor Configuration

- **WebView:** WKWebView (default on iOS, hardware-accelerated)
- **Orientation:** Landscape locked
- **Status Bar:** Hidden during gameplay
- **Splash Screen:** Custom neon-themed launch screen
- **App Icon:** Required sizes auto-generated from 1024x1024 source

### iOS-Specific Considerations

- Touch input via virtual joystick (nipplejs or custom)
- Haptic feedback on hits, level-ups, and special attacks (Capacitor Haptics plugin)
- Safe area insets for notch/Dynamic Island
- Background audio handling for music continuity
- Game Center integration for leaderboards (optional)
