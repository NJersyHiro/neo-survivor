# Neo Survivor — Project Conventions

## Project

3D roguelike survivor game with Cyberpunk Neon aesthetics and Star Wars-inspired setting.
Tech: TypeScript + React + Three.js (R3F) + Zustand + Capacitor (iOS).

## Code Style

- TypeScript strict mode, no `any`
- Functional React components only
- R3F components in `src/components/`, pure game logic in `src/game/`
- Zustand stores in `src/stores/`, game data in `src/data/`
- Use `useFrame()` for per-frame updates, never `setInterval`
- Selectors for Zustand: `useGameStore((s) => s.player.hp)`, never `useGameStore()`

## Naming

- Components/Types: `PascalCase`
- Files: `PascalCase.tsx` for components, `camelCase.ts` for logic
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Stores: `use<Name>Store`

## Architecture Rules

- Game logic (`src/game/`) must not import React
- Components render only — delegate calculations to `src/game/`
- No hardcoded stats — all game data lives in `src/data/`
- Object pool projectiles, enemies, and particles — never create/destroy in the game loop
- Use InstancedMesh for bulk rendering (enemies, gems, projectiles)

## Performance

- Target 60fps on iPhone 12+, 30fps minimum on iPhone SE 2
- Max 300 enemies, 200 projectiles, 400 XP gems on screen
- Profile before optimizing — use R3F `<Stats />`

## Testing

- Unit tests for all `src/game/` modules (Vitest)
- Test formulas, stat calculations, wave schedules

## Git

- Imperative commit messages: "Add X", "Fix Y"
- Feature branches → dev → main
- Never commit `.env` files or `node_modules/`

## Key Docs

- `GAME_SPEC.md` — full game mechanics specification
- `docs/ARCHITECTURE.md` — tech stack, project structure, rendering pipeline
- `docs/DEVELOPMENT_GUIDE.md` — setup, conventions, asset pipeline
- `docs/PHASE_PLAN.md` — phased development roadmap
