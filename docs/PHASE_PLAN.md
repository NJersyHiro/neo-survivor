# Neo Survivor — Phase Plan

## Overview

Development is split into 6 phases, each producing a playable build. Earlier phases focus on the core loop; later phases add depth, content, and polish.

---

## Phase 1: Core Loop Prototype

**Goal:** A single character auto-attacks enemies in a 3D arena. Player moves, gains XP, levels up, and picks weapons.

### Deliverables

- [ ] Vite + React + R3F project scaffold
- [ ] 3D stage: flat neon-grid ground plane with boundaries
- [ ] Player character: capsule/cube placeholder, virtual joystick movement
- [ ] Camera: top-down angled perspective following player
- [ ] 1 weapon: basic projectile (auto-fires at nearest enemy)
- [ ] Enemy spawner: single enemy type (swarmer), walks toward player
- [ ] Collision detection: projectile hits enemy, enemy contacts player
- [ ] Damage system: HP, damage numbers, enemy death
- [ ] XP gems: drop on enemy death, player picks up, XP bar fills
- [ ] Level-up screen: choose 1 of 3 random weapons/upgrades
- [ ] 3 placeholder weapons with distinct attack patterns
- [ ] HUD: HP bar, timer, level indicator
- [ ] Run ends at 5 minutes (temporary short timer for testing)
- [ ] Results screen: kills, time survived

### Post-Processing

- [ ] Bloom effect on emissive materials
- [ ] Dark ambient lighting with neon accent lights

---

## Phase 2: Build Crafting Depth

**Goal:** Full weapon + item system with evolutions. The build-crafting core of the game.

### Deliverables

- [ ] 6 weapon slots with level-up progression (max level 7)
- [ ] 6 passive item slots with stat effects
- [ ] 8+ weapons across 3 categories (melee, multishot, ranged)
- [ ] 8+ passive items across 3 categories (healing, stat, utility)
- [ ] Weapon evolution system: max weapon + passive item + boss chest = evolved weapon
- [ ] Boss enemies: spawn at minute marks, drop treasure chests
- [ ] Treasure chest system: bronze (pre-10 min), silver (post-10 min, can evolve)
- [ ] Reroll, skip, banish on level-up screen
- [ ] Weapon stat display on selection
- [ ] Extend run timer to 15 minutes

---

## Phase 3: Meta-Progression and Characters

**Goal:** Permanent upgrades, multiple characters, currency economy. Players want to do "one more run."

### Deliverables

- [ ] Currency system: Credits drop from enemies, bonus on run end
- [ ] Shop screen: permanent stat upgrades (PowerUps) with escalating costs
- [ ] 8 playable characters with unique starting weapons and stats
- [ ] Character unlock system: achievements + credit purchase
- [ ] Character upgrade levels (5 levels per character)
- [ ] Achievement tracking via lifetime stats
- [ ] Persistent save system (localStorage + Capacitor Preferences)
- [ ] Main menu with mode/character/stage selection

---

## Phase 4: Content Expansion

**Goal:** Full game content — stages, enemies, weapons, augments. Multiple hours of content.

### Deliverables

- [ ] 4+ stages with unique themes and enemy rosters
- [ ] Stage-specific wave schedules (30-minute runs)
- [ ] 15+ weapons with evolution trees
- [ ] 15+ passive items
- [ ] 20+ Cyber Augment cards (Arcana equivalent)
- [ ] Cyber Augment selection: start of run, minute 11, minute 21
- [ ] Weapon mod/stamp system (3 slots on main weapon)
- [ ] Enchantment system for all weapons
- [ ] Limit Break system: weapon upgrades beyond max after all slots filled
- [ ] Kill screen Reaper mechanic at 30:00
- [ ] Game modes: Survival, Mission (stage boss), Endless
- [ ] Enemy variety: 6+ enemy archetypes per stage
- [ ] Difficulty modifiers: Curse stat, self-imposed challenges

---

## Phase 5: Polish, Art, and Audio

**Goal:** Replace all placeholders. Game looks and sounds like a finished product.

### Deliverables

- [ ] Character 3D models (low-poly cyberpunk style)
- [ ] Enemy 3D models per archetype
- [ ] Stage environments with destructible props
- [ ] Weapon visual effects (projectiles, impacts, evolutions)
- [ ] Particle systems: neon explosions, XP gem sparkle, level-up flash
- [ ] UI design: neon-themed HUD, menus, shop, gacha
- [ ] Chromatic aberration, scanline, and vignette post-processing
- [ ] Background music: synthwave/cyberpunk tracks per stage
- [ ] SFX: weapon fire, enemy hit/death, pickup, level-up, boss alert
- [ ] Haptic feedback integration (Capacitor)
- [ ] Splash screen and app icon
- [ ] Tutorial / first-run experience
- [ ] Cyber Hideout hub area (between-run social space)

---

## Phase 6: iOS Release

**Goal:** App Store submission and launch.

### Deliverables

- [ ] Capacitor iOS build configured and tested
- [ ] Performance optimization pass (target: 60fps on iPhone 12+)
- [ ] Memory profiling and leak fixes
- [ ] Safe area / notch / Dynamic Island handling
- [ ] Touch control tuning (joystick dead zone, sensitivity)
- [ ] App Store metadata: screenshots, description, keywords
- [ ] App Store privacy labels and policy
- [ ] TestFlight beta testing
- [ ] Bug fixing from beta feedback
- [ ] App Store submission
- [ ] Post-launch: monitoring, crash reporting, first patch

---

## Phase Dependencies

```
Phase 1 (Core Loop)
    ↓
Phase 2 (Build Crafting)
    ↓
Phase 3 (Meta-Progression)
    ↓
Phase 4 (Content Expansion)
    ↓
Phase 5 (Polish)
    ↓
Phase 6 (iOS Release)
```

Each phase builds on the previous. A phase is complete when all its deliverables are checked off and the build is playable.
