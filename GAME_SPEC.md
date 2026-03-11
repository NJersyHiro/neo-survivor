# Neo Survivor — Game Specification Document

## Based on Research: Vampire Survivors & HoloCure – Save the Fans!

**Genre:** 3D Roguelike / Bullet Heaven Survivor
**Visual Style:** Cyberpunk Neon
**World Setting:** Star Wars-inspired sci-fi universe
**Target Platform:** iOS (App Store release)

---

## Table of Contents

1. [Core Gameplay Loop](#1-core-gameplay-loop)
2. [Run Structure & Time System](#2-run-structure--time-system)
3. [Character System](#3-character-system)
4. [Weapon System](#4-weapon-system)
5. [Passive Items / Equipment System](#5-passive-items--equipment-system)
6. [Weapon Evolution / Collab System](#6-weapon-evolution--collab-system)
7. [Leveling & XP System](#7-leveling--xp-system)
8. [Enemy & Wave System](#8-enemy--wave-system)
9. [Boss System](#9-boss-system)
10. [Treasure / Loot System](#10-treasure--loot-system)
11. [Pickup & Floor Item System](#11-pickup--floor-item-system)
12. [Player Stats](#12-player-stats)
13. [Meta-Progression (Permanent Upgrades)](#13-meta-progression-permanent-upgrades)
14. [Arcana / Modifier Card System](#14-arcana--modifier-card-system)
15. [Stamp / Enchantment System](#15-stamp--enchantment-system)
16. [Special Attack System](#16-special-attack-system)
17. [Game Modes](#17-game-modes)
18. [Stage System](#18-stage-system)
19. [Character Unlock / Gacha System](#19-character-unlock--gacha-system)
20. [Hub / Housing System](#20-hub--housing-system)
21. [Difficulty Scaling & Modifiers](#21-difficulty-scaling--modifiers)
22. [Limit Break / Endgame Scaling](#22-limit-break--endgame-scaling)
23. [Endgame Kill Screen / Reaper Mechanic](#23-endgame-kill-screen--reaper-mechanic)
24. [UI/UX Systems](#24-uiux-systems)
25. [Monetization Considerations (App Store)](#25-monetization-considerations-app-store)

---

## 1. Core Gameplay Loop

### Overview (derived from both Vampire Survivors & HoloCure)

The player controls a single character in a 3D arena, automatically attacking waves of enemies. The core loop is:

```
Kill Enemies → Collect XP Gems → Level Up → Choose Weapon/Item Upgrades
    → Kill Stronger Enemies → Collect Currency → Survive Until Time Limit
        → Spend Currency on Permanent Upgrades → Start Next Run
```

### Key Principles

- **Automatic Attacks:** Weapons fire/activate automatically on a cooldown timer. The player focuses on **movement and positioning** only.
- **Wave-Based Survival:** Enemies spawn in increasingly difficult waves over time.
- **Build Crafting:** Each run is defined by the combination of weapons + passive items selected during level-ups.
- **Roguelike Per-Run Progression:** Weapons and items are gained/lost per run. Permanent upgrades carry over between runs.
- **Session Length:** A standard run lasts **20–30 minutes** (30 min in VS, variable in HoloCure depending on mode).

---

## 2. Run Structure & Time System

### Time-Based Progression (from Vampire Survivors)

| Minute | Event |
|--------|-------|
| 0:00 | Run begins, basic enemies spawn |
| 0:00–10:00 | Escalating enemy waves, each minute introduces new enemy types |
| 10:00 | First evolution-capable boss chest available |
| 11:00 | Second Arcana/modifier selection available |
| 15:00 | Mid-run difficulty spike |
| 21:00 | Third Arcana/modifier selection available |
| 25:00–29:00 | Maximum difficulty, elite enemy swarms |
| 30:00 | Kill Screen event (Reaper equivalent) spawns |

### HoloCure Stage Mode Structure

- Stage Mode has a **fixed boss** at the end; run ends upon defeating it.
- Bonus currency awarded for completing stage mode.
- Provides a structured, goal-oriented alternative to pure survival.

### Design Decision for Neo Survivor

Implement **both** run types:
- **Survival Mode:** 30-minute timed survival (VS style).
- **Mission Mode:** Stage-based with a final boss (HoloCure style).
- **Endless Mode:** No time limit, ends on death (HoloCure style).

---

## 3. Character System

### Character Structure (combined from both games)

Each character has:

| Attribute | Description |
|-----------|-------------|
| **Starting Weapon** | A unique weapon the character begins with (1 of their 6 weapon slots used) |
| **Special Attack** | A unique powerful ability on a cooldown gauge (HoloCure) |
| **Passive Skills** | 3 unique passive abilities per character (HoloCure) |
| **Base Stats** | Unique starting stat distribution (both games) |
| **Starting Bonuses** | Some characters start with passive items or unique modifiers (VS) |

### Character Stats (base)

| Stat | Description | Source |
|------|-------------|--------|
| Max HP | Total health points | Both |
| Recovery | HP regeneration per second | VS |
| Armor | Flat damage reduction | VS |
| Move Speed | Movement velocity | Both |
| Might / ATK | Damage multiplier | Both |
| Speed / Haste | Attack speed multiplier | Both |
| Area | Area of effect multiplier | VS |
| Duration | Weapon effect duration | VS |
| Amount | Number of projectiles | VS |
| Cooldown Reduction | Reduces weapon cooldown timers | Both |
| Luck | Affects drop quality, crit chance, chest contents | VS |
| Growth / EXP Gain | XP multiplier | Both |
| Greed / Money Gain | Currency drop multiplier | Both |
| Magnet / Pick Up Range | Item pickup radius | Both |
| Curse | Increases enemy difficulty & rewards | VS |
| Critical Chance | % chance for critical hits | HoloCure |
| Defense | % damage reduction | HoloCure |
| Skill Damage | Bonus to skill/special attack damage | HoloCure |

### Character Unlocking

- **Gacha System (HoloCure):** Spend in-game currency (1,000 coins per pull) for random character unlock. Duplicates increase character rank (+1 HP, +1% ATK, +1% SPD per duplicate, stacking up to 20 times).
- **Achievement Unlocks (VS):** Characters unlocked by completing specific in-game challenges.
- **Design Decision:** Implement both methods — some characters via gacha, some via achievements.

---

## 4. Weapon System

### Weapon Slots

- **6 weapon slots** per character (both games agree).
- **Slot 1** is occupied by the character's unique starting weapon.
- Remaining 5 slots filled during level-up selections.

### Weapon Categories (from HoloCure)

| Category | Behavior |
|----------|----------|
| **Melee** | Follows the character position, attacks around them |
| **Multishot** | Fires multiple projectiles, affected by Amount stat |
| **Ranged** | Projectiles move independently of character position |

### Weapon Attack Patterns (from Vampire Survivors)

Weapons auto-attack based on their cooldown. Attack patterns include:

| Pattern | Example (VS weapon) | Description |
|---------|---------------------|-------------|
| Horizontal sweep | Whip | Attacks in a line in front of / behind the character |
| Targeted projectile | Magic Wand | Fires at the nearest enemy |
| Random targeting | Fire Wand | Fires at a random nearby enemy |
| Orbiting | King Bible | Rotates around the character |
| Bouncing | Cross | Projectiles bounce between enemies |
| Zone/AoE | Santa Water | Creates a damage zone on the ground |
| Beam/Cone | Flames | Continuous directional damage |
| Retaliatory | Victory Sword | Triggers when the player takes damage |
| Movement-based | Shadow Pinion | Scales with character movement |

### Weapon Stats

| Stat | Description |
|------|-------------|
| Base Damage | Raw damage per hit |
| Cooldown | Time between automatic attacks |
| Area | Size of the attack hitbox |
| Speed | Projectile velocity |
| Amount | Number of projectiles per attack |
| Duration | How long the attack persists |
| Pierce | Number of enemies a projectile can hit before expiring |
| Knockback | How far enemies are pushed back |
| Crit Multiplier | Damage multiplier on critical hit |
| Pool Limit | Maximum number of active instances |
| Hitbox Delay | Delay before hitbox activates |

### Weapon Leveling

- **Vampire Survivors:** Weapons level to **max level 8** (some exceptions: 6, 7, 9, or 12).
- **HoloCure:** Weapons level to **max level 7**.
- Each level increases weapon stats (damage, area, amount, etc.).
- **Design Decision:** Max weapon level = **7** (aligning with HoloCure for tighter balance).

---

## 5. Passive Items / Equipment System

### Passive Item Slots

- **6 passive item slots** (Vampire Survivors).
- **6 item slots** (HoloCure, separate from weapons).
- Items are selected during level-up or found as floor drops.

### Item Categories (from HoloCure)

| Category | Effect |
|----------|--------|
| **Healing** | HP restoration, regeneration effects |
| **Stat** | Boost character stats (ATK, SPD, defense, etc.) |
| **Utility** | Special effects, defensive mechanics, unique abilities |

### Super Items (from HoloCure)

- **5% chance** from loot boxes to receive a **Super Item**.
- Super Items are maxed-out versions of standard items with improved stats and replaced penalties.
- Cannot be upgraded further.

### Item Leveling

- Items level up when selected again during level-ups.
- Some items are found pre-leveled from special drops.

---

## 6. Weapon Evolution / Collab System

### Evolution System (from Vampire Survivors)

**Requirements:**
1. Base weapon at **max level**
2. Corresponding passive item in inventory
3. Open a **boss treasure chest** (after minute 10:00)

**Result:** Base weapon transforms into a powerful **Evolved Weapon**.

### Evolution Types (from Vampire Survivors)

| Type | Description |
|------|-------------|
| **Evolution** | Base weapon + passive item → Evolved weapon (passive consumed) |
| **Union** | Two weapons merge → Union weapon (frees one weapon slot) |
| **Gift** | Meeting conditions grants an additional weapon/item without replacing anything |

### Collab System (from HoloCure)

**Requirements:**
1. Two specific base weapons both at **max level 7**
2. Collect a **Golden Anvil** item drop

**Result:** Two weapons merge into a powerful **Collab Weapon** (frees one weapon slot).

### Super Collab System (from HoloCure)

**Requirements:**
1. A Collab weapon
2. A specific item
3. A **Golden Hammer** item drop

**Result:** Collab weapon transforms into an even more powerful **Super Collab Weapon**.

### Design Decision for Neo Survivor

Implement a **3-tier evolution system:**

```
Tier 1: Base Weapons (levels 1–7)
    ↓ [Max level + Passive Item + Boss Chest]
Tier 2: Evolved Weapons (Collab equivalents)
    ↓ [Evolved Weapon + Specific Item + Rare Drop]
Tier 3: Ascended Weapons (Super Collab equivalents)
```

---

## 7. Leveling & XP System

### XP Gems (from Vampire Survivors)

| Gem Color | XP Value | Notes |
|-----------|----------|-------|
| Blue | 1–2 XP | Common drop |
| Green | 3–9 XP | Uncommon drop |
| Red | 10+ XP | Rare or merged gem |

### XP Gem Mechanics

- Enemies drop XP gems on death.
- Gems are physical pickups on the ground — player must walk over them (or use Magnet).
- **Gem Merge:** When >400 gems exist on the ground, new XP accumulates into a single red gem (prevents performance issues).
- **Gem Magnet Event:** At certain events (or on death), all gems on screen are attracted to the player.
- **Growth stat** increases XP gained from all sources.

### Level-Up Selection

On level-up, the player is presented with **3–4 random options:**

| Option Type | Description |
|-------------|-------------|
| **New Weapon** | Add a new weapon to an empty slot |
| **Weapon Upgrade** | Level up an existing weapon |
| **New Item** | Add a new passive item to an empty slot |
| **Item Upgrade** | Level up an existing passive item |
| **Stat Boost** | Small permanent stat increase (HoloCure) |
| **Consumable** | One-time use heal or buff |

### Level-Up Tools (from both games)

| Tool | Effect | Acquisition |
|------|--------|-------------|
| **Reroll** | Re-randomize the level-up options | Purchased in meta-shop |
| **Skip / Eliminate** | Remove an unwanted option | Purchased in meta-shop |
| **Banish** | Permanently remove an option from the run's pool | Purchased in meta-shop (VS) |
| **Hold** | Guarantee an option reappears next level-up | Purchased in meta-shop (HoloCure) |

---

## 8. Enemy & Wave System

### Wave Spawning (from Vampire Survivors)

- **One new wave per minute**, with each wave introducing new enemy types.
- Each wave specifies a **minimum enemy count** and a **spawn interval**.
- If below minimum, enemies spawn until quota is met.
- **Spawn Cap:** When **≥300 enemies** are alive, periodic spawning halts (only bosses and event spawns).
- Waves are **predetermined per stage** — not random.

### Enemy Types

| Category | Behavior |
|----------|----------|
| **Swarmers** | Weak, numerous, walk directly toward the player |
| **Ranged** | Fire projectiles from a distance |
| **Tanks** | High HP, slow, absorb damage |
| **Speedsters** | Fast-moving, low HP |
| **Elites** | Stronger variants with enhanced stats, auras, or abilities |
| **Spawners** | Create additional enemies on death or periodically |

### Enemy Scaling

- **Time-based:** Enemy stats (HP, damage, speed) scale with elapsed time, NOT player level.
- **Curse modifier:** Increases enemy HP, speed, damage, and spawn count — but also increases XP and currency rewards.

---

## 9. Boss System

### Boss Spawning (from Vampire Survivors)

- Bosses spawn at **specific minute marks** as part of predetermined wave schedules.
- Bosses appear at approximately minutes **5, 10, 15, 20, 25, 29**.
- Boss HP scales with **player level** and **Curse stat**.

### Boss Properties

| Property | Description |
|----------|-------------|
| High HP | Significantly more HP than regular enemies |
| Increased Damage | Contact deals heavy damage |
| Effect Resistance | Partially resistant to knockback, freeze, etc. |
| No Despawn | Bosses persist; teleport back if player moves far away |
| Treasure Chest Drop | Guaranteed chest drop on kill |

### Stage Boss (from HoloCure)

- Stage Mode has a **final boss** that must be defeated to complete the stage.
- Final boss has unique attack patterns and phases.
- Defeating the final boss awards bonus currency.

---

## 10. Treasure / Loot System

### Treasure Chest System (from Vampire Survivors)

| Chest Type | Source | Contents |
|------------|--------|----------|
| **Bronze** | Bosses before 10:00 | Random weapon/item level-up; cannot contain evolutions |
| **Silver** | Bosses after 10:00 | Can contain weapon evolutions/unions if conditions are met |
| **Golden** | Special events | Can contain weapons the player doesn't have |
| **Arcana Chest** | At minute 11:00 and 21:00 | Contains Arcana/modifier card selection |

### Chest Contents

- Chests typically contain **1 item**, with a chance for **3 or 5 items** (affected by Luck).
- The first 6 chests in a save follow a fixed sequence: **1-1-3-1-1-5**.
- Contents are a random level-up for a weapon/item the player already has.
- If evolution conditions are met (max weapon + required passive), the chest triggers the evolution.

### Holozon Box System (from HoloCure)

- Random item box drops during gameplay.
- Can contain weapons, items, or consumables.
- **5% chance** for a **Super Box** containing a Super Item.

---

## 11. Pickup & Floor Item System

### Pickup Types (from Vampire Survivors)

| Pickup | Effect |
|--------|--------|
| **XP Gems** | Grant experience (blue/green/red values) |
| **Gold Coins** | Meta-currency for permanent upgrades |
| **Floor Chicken** | Restores HP |
| **Vacuum / Magnet** | Attracts all pickups on screen to the player |
| **Rosary** | Kills all enemies on screen |
| **Clock** | Freezes all enemies temporarily |
| **Treasure Chest** | Contains weapon/item upgrades or evolutions |
| **Passive Items** | Some stages have passive items placed on the map |
| **Destructible Objects** | Light sources / containers drop pickups when destroyed |

### Magnet / Pickup Radius

- The **Magnet stat** increases the radius within which pickups are automatically attracted.
- Some events trigger a **full-screen magnet** effect.

---

## 12. Player Stats

### Full Stat List (combined from both games)

| Stat | Effect | Modified By |
|------|--------|-------------|
| **Max HP** | Total hit points | PowerUp, Items, Level |
| **Recovery** | HP regen per second | PowerUp, Items |
| **Armor / Defense** | Flat or % damage reduction | PowerUp, Items |
| **Move Speed** | Character movement velocity | PowerUp, Items |
| **Might / ATK** | Damage multiplier for all weapons | PowerUp, Items |
| **Speed / Haste** | Weapon attack speed multiplier | PowerUp, Items |
| **Area** | Weapon AoE size multiplier | PowerUp, Items |
| **Duration** | Weapon effect persistence time | PowerUp, Items |
| **Amount** | Extra projectiles for weapons | PowerUp, Items |
| **Cooldown** | Reduces time between weapon attacks | PowerUp, Items |
| **Luck** | Affects chest quality, drops, crit | PowerUp, Items |
| **Growth / EXP Gain** | XP multiplier | PowerUp, Items |
| **Greed / Money Gain** | Currency multiplier | PowerUp, Items |
| **Magnet / Pick Up Range** | Pickup attraction radius | PowerUp, Items |
| **Curse** | Increases enemy stats AND rewards | PowerUp, Items |
| **Critical Chance** | % chance for critical hit | PowerUp, Items |
| **Critical Multiplier** | Damage multiplier on crit | Items |
| **Skill Damage** | Bonus damage for special attacks | PowerUp, Items |
| **Revival** | Times the player can revive (at 50% HP) | PowerUp |

---

## 13. Meta-Progression (Permanent Upgrades)

### PowerUp Shop (from Vampire Survivors)

Permanent stat bonuses purchased with Gold Coins, applying to **all characters**.

| PowerUp | Max Rank | Effect Per Rank | Max Effect | Base Cost |
|---------|----------|-----------------|------------|-----------|
| Might | 5 | +5% damage | +25% | 200 |
| Armor | 3 | +1 flat reduction | +3 | 600 |
| Max Health | 3 | +10% HP | +33.1% | 200 |
| Recovery | 5 | +0.1 HP/sec | +0.5 | 200 |
| Cooldown | 2 | −2.5% | −5% | 900 |
| Area | 2 | +5% | +10% | 300 |
| Speed | 2 | +10% attack speed | +20% | 300 |
| Duration | 2 | +15% | +30% | 300 |
| Amount | 1 | +1 projectile | +1 | 5,000 |
| Move Speed | 2 | +5% | +10% | 600 |
| Magnet | 2 | +25% pickup radius | +56.25% | 300 |
| Luck | 3 | +10% | +30% | 600 |
| Growth | 5 | +3% XP | +15% | 900 |
| Greed | 5 | +10% gold | +50% | 200 |
| Curse | 5 | +10% enemy buff | +50% | 1,666 |
| Revival | 1 | +1 revive | +1 | 10,000 |
| Reroll | 5 | +2 rerolls/run | +10 | 1,000 |
| Skip | 5 | +2 skips/run | +10 | 100 |
| Banish | 5 | +2 banishes/run | +10 | 100 |

**Cost Scaling Formula:** Price = InitialPrice × (1 + TimesBought) + Fees
**Fees:** ⌊20 × 1.1^(TotalRanks)⌋

### Upgrade Shop (from HoloCure)

| Category | Upgrades |
|----------|----------|
| **Ability** | Special Attack unlock, Growth, Reroll, Eliminate, Stamps, Hold, Customize, Supports, Material Find, Fan Letters, Enchantments, Fandom |
| **Stats** | Max HP (+4%/lvl, 10 lvls), ATK (+6%/lvl, 10 lvls), SPD (+6%/lvl, 10 lvls), Crit (+2%/lvl, 5 lvls), Pick Up Range (+10%/lvl, 10 lvls), Haste (+4%/lvl, 5 lvls), Regen (5 lvls), Defense (-3% dmg/lvl, 5 lvls), Special CD (-3%/lvl, 5 lvls), Skill Dmg (+4%/lvl, 10 lvls), EXP Gain (+4%/lvl, 5 lvls), Food Drops (+4%/lvl, 5 lvls), Money Gain (+20%/lvl, 10 lvls), Enhancement Rate (+3%/lvl, 5 lvls) |
| **Challenge** | Marketing (more enemies), Weapon/Item Limit, Collab Ban, Supers Ban, G Rank Off, Hardcore Mode |
| **Utility** | Refund All (full refund of all purchases) |

**Total Cost:** ~1,716,775 coins to max all HoloCure upgrades.

### Design Decision for Neo Survivor

Combine both systems:
- **Stat PowerUps** with escalating costs (VS formula).
- **Ability Unlocks** as one-time purchases (HoloCure style).
- **Challenge Modifiers** for self-imposed difficulty.
- **Refund option** for full currency recovery.

---

## 14. Arcana / Modifier Card System

### Arcana System (from Vampire Survivors)

A set of **22 Arcana cards** + **6 Darkana cards** that act as run modifiers.

### How It Works

1. **First Arcana:** Selected at the **start of the run** (from unlocked pool).
2. **Second Arcana:** Obtained from an Arcana chest at **minute 11:00**.
3. **Third Arcana:** Obtained from an Arcana chest at **minute 21:00**.
4. **Maximum 3 Arcanas per run.**

### Arcana Unlock Methods

- Reach level 50 with specific characters.
- Reach minute 31 in specific stages.
- Collect relics.

### Example Arcana Effects

| Arcana | Effect |
|--------|--------|
| Sarabande of Healing | Healing also damages nearby enemies; doubles healing |
| Game Killer | XP gems become exploding projectiles; chests always have 3+ items |
| Iron Blue Will | Specific projectile weapons gain bouncing between enemies |
| Slash | Crit damage increased; certain weapons gain crit multiplier |
| Jail of Crystal | Retaliatory damage on hit; freezing effects enhanced |

### Design Decision for Neo Survivor

Implement as **"Neural Implants"** or **"Cyber Augments"** (fitting cyberpunk theme):
- 20+ unique modifier cards.
- 3 selected per run at fixed intervals.
- Unlocked through character progression and stage completion.

---

## 15. Stamp / Enchantment System

### Stamps (from HoloCure)

- Augment the character's **Main Attack** (starting weapon).
- Up to **3 stamps** equipped at once.
- Stamps upgrade to **max level 3**.
- Provide stat bonuses or special effects (explosions on hit, etc.).
- Must be **unlocked** via the shop (500 coins).

### Enchantments (from HoloCure)

- Modify weapons with **blue modifier bonuses**.
- Unlocked via the shop (1,000 coins).
- Applied through **anvils** during gameplay.
- If two enchanted weapons fuse into a Collab, the Collab **retains both enchantments**.

### Enhancement System (from HoloCure)

- Weapons beyond max level can be **enhanced** using coins.
- Enhancement costs increase progressively.
- **Success rate decreases by 10% per attempt**.
- Failed enhancements result in coin loss only (no weapon downgrade).

### Design Decision for Neo Survivor

Implement as **"Weapon Mods"**:
- Socket-style system where mods are slotted into weapons.
- Main weapon gets 3 mod slots (stamps equivalent).
- Other weapons get 1–2 mod slots (enchantments equivalent).
- Mods found during runs or crafted from materials.

---

## 16. Special Attack System

### Special Attacks (from HoloCure)

Each character has a **unique special attack:**

| Aspect | Detail |
|--------|--------|
| **Unlock** | Purchased in shop for 500 coins |
| **Cooldown** | Visible gauge below character portrait |
| **Activation** | Manual input when gauge is full |
| **Types** | High-damage burst, AoE clear, buff/heal, summon |
| **Scaling** | Affected by Skill Damage stat and Growth upgrade |

### Design Decision for Neo Survivor

Each character has an **"Ultimate Ability"**:
- Charges through combat (damage dealt / enemies killed).
- Activated by player input (tap/button).
- Unique visual per character matching cyberpunk theme.
- Upgraded via skill damage stat and permanent upgrades.

---

## 17. Game Modes

### From Both Games Combined

| Mode | Description | End Condition | Source |
|------|-------------|---------------|--------|
| **Survival** | Classic 30-minute survival | Kill screen at 30:00 or player death | VS |
| **Stage / Mission** | Objective-based with final boss | Defeat the final boss | HoloCure |
| **Endless** | No time limit, infinite scaling | Player death only | HoloCure |
| **Time Attack** | Speed-clear all enemies ASAP | All enemies defeated | HoloCure |
| **Hurry Mode** | Accelerated enemy spawns | Modified survival | VS |

### Supports System (from HoloCure)

- Before starting a run, select pre-stage bonuses.
- Choose from unlocked support abilities.
- Purchased via the shop.

---

## 18. Stage System

### Stage Design (from Vampire Survivors)

- Each stage is a **large, scrollable map** (some infinite, some bounded).
- Stages have **unique enemy rosters** and spawn schedules.
- Stages contain **destructible objects** (light sources, containers) that drop pickups.
- Some stages have **floor items** placed at fixed locations on the map.
- Stages have **unique visual themes** and may have special mechanics.

### Stage Unlocking

- Stages unlock **sequentially** or through specific achievements.
- Later stages have higher base difficulty.

### Design Decision for Neo Survivor

Stages as **cyberpunk districts / planets:**
- Each with unique enemy types, visual themes, and environmental hazards.
- 3D environments with verticality and neon aesthetics.
- Destructible neon signs, hover cars, etc. as pickup sources.

---

## 19. Character Unlock / Gacha System

### Gacha System (from HoloCure)

| Aspect | Detail |
|--------|--------|
| **Cost** | 1,000 coins per pull |
| **Multi-pull** | Up to 10 at once |
| **Banners** | Grouped by faction/generation |
| **Duplicates** | Increase G-Rank: +1 HP, +1% ATK, +1% SPD per dupe |
| **Max G-Rank** | 20 (= +20 HP, +20% ATK, +20% SPD) |
| **Drop Rate** | Equal probability for all characters in a banner |

### Achievement Unlocks (from Vampire Survivors)

- Complete specific challenges to unlock characters.
- Examples: survive X minutes, defeat Y enemies, reach level Z.

### Design Decision for Neo Survivor

- **Free gacha** using in-game currency only (no real money — App Store compliance).
- Achievement-based unlocks for core characters.
- Gacha for cosmetic variants / alternate characters.
- Duplicate system for incremental stat bonuses.

---

## 20. Hub / Housing System

### Holo House (from HoloCure)

| Feature | Description |
|---------|-------------|
| **Main Hub** | Interactive area between runs |
| **Fishing Mini-game** | Rhythm-based fishing; catch fish for cooking/selling |
| **Cooking** | Combine caught fish into stat-boosting meals |
| **Furniture** | Decorative customization of the house |
| **Construction Shop** | Buy furniture with coins |
| **Workers** | Assign characters to tasks |

### Design Decision for Neo Survivor

Implement as a **"Cyber Hideout"**:
- 3D interactive hub area.
- Mini-games for bonus resources.
- Character customization station.
- Upgrade terminals for permanent progression.
- Social features (leaderboards, friend visits).

---

## 21. Difficulty Scaling & Modifiers

### Curse System (from Vampire Survivors)

- **Curse stat** increases enemy HP, speed, damage, and spawn count.
- Also increases XP and Gold rewards proportionally.
- Can be increased via PowerUps, items, or character bonuses.
- Acts as a **voluntary difficulty multiplier**.

### Self-Imposed Challenges (from HoloCure)

| Modifier | Effect |
|----------|--------|
| Marketing | More enemies spawn |
| Weapon Limit | Restrict number of equipped weapons (5→0) |
| Item Limit | Restrict number of equipped items (6→0) |
| Collab Ban | Prevent weapon combinations |
| Supers Ban | Block super item drops |
| G-Rank Off | Disable gacha stat bonuses |
| Hardcore | Maximum difficulty mode |

### Enemy Scaling Formula

- Base stats × Time multiplier × Curse multiplier = Final enemy stats.
- Boss HP additionally scales with **player level**.

---

## 22. Limit Break / Endgame Scaling

### Limit Break (from Vampire Survivors)

Once all weapon and item slots are maxed:

1. No more new weapons/items offered on level-up.
2. Instead, **Limit Break upgrades** are offered.
3. Each Limit Break upgrade enhances a **specific stat** of one equipped weapon.
4. Weapons can be upgraded **beyond their normal max level**.
5. Provides infinite scaling potential for endgame.

### Awakened Weapons (from HoloCure)

- When a character's **main weapon** reaches max level, it gains **"Awakened"** status.
- Awakened weapons have unique properties and new visual design.
- Can be further enhanced via the enhancement system (with coin cost and decreasing success rate).

### Design Decision for Neo Survivor

Combine both:
- **Limit Break** for all weapons after all slots are filled.
- **Awakened state** for the character's starting weapon with unique visuals.
- Provides clear endgame power fantasy.

---

## 23. Endgame Kill Screen / Reaper Mechanic

### The Reaper (from Vampire Survivors)

| Aspect | Detail |
|--------|--------|
| **Trigger** | Spawns at exactly 30:00 |
| **Damage** | 65,535 (instant kill) |
| **Behavior** | Rushes directly to the player |
| **Escalation** | Additional Reapers spawn every ~60 seconds after 30:00 |
| **Counterplay** | Clock Lancet (freeze) and Laurel (invincibility) can delay but not prevent death |
| **True Kill Screen** | If the Reaper is somehow defeated, an invincible "White Hand" spawns for unavoidable death |

### Purpose

- Provides a **definitive end** to survival runs.
- Creates dramatic tension as the timer approaches 30:00.
- Motivates players to maximize build efficiency within the time limit.

### Design Decision for Neo Survivor

Implement as a **"System Purge"** or **"Firewall Reaper"**:
- Massive cybernetic entity spawns at 30:00.
- Instakill mechanic with dramatic visual effects.
- Neon death animation fitting the cyberpunk aesthetic.
- Progressive escalation if player survives.

---

## 24. UI/UX Systems

### In-Run HUD

| Element | Position | Description |
|---------|----------|-------------|
| Timer | Top center | Elapsed time in MM:SS |
| Level & XP Bar | Top or bottom | Current level and XP progress |
| HP Bar | Near character | Current / Max HP |
| Special Gauge | Below portrait | Cooldown for special attack |
| Weapon Icons | Side panel | Equipped weapons with level indicators |
| Item Icons | Side panel | Equipped items with level indicators |
| Kill Counter | Corner | Total enemies defeated |
| Currency Counter | Corner | Coins collected this run |
| Mini-map | Corner | Optional enemy/pickup radar |
| Reroll/Skip/Banish | Level-up screen | Utility buttons with remaining uses |

### Level-Up Screen

- Pauses gameplay.
- Shows 3–4 random options with descriptions.
- Displays weapon/item current and next level stats.
- Reroll, Skip, Banish, Hold buttons available.

### Results Screen

- Total enemies killed.
- Total XP gained.
- Total currency earned.
- Weapons/items obtained.
- Time survived.
- Achievements unlocked.

### Mobile Considerations (App Store)

- **Virtual joystick** for movement (auto-attack eliminates need for attack buttons).
- **One button** for special attack activation.
- **Tap-to-select** for level-up choices.
- **Swipe gestures** for menus.
- Portrait and landscape support.

---

## 25. Monetization Considerations (App Store)

### Recommended Model (Player-Friendly)

| Method | Description |
|--------|-------------|
| **Premium Purchase** | One-time buy ($4.99–$9.99) |
| **Cosmetic IAP** | Character skins, weapon skins, visual effects |
| **Battle Pass** | Seasonal content with free and premium tiers |
| **No Pay-to-Win** | All gameplay-affecting items earnable through play |
| **No Loot Boxes with Real Money** | Gacha uses in-game currency only |

### What NOT to Do

- No energy/stamina systems limiting play.
- No real-money gacha for gameplay characters.
- No stat-boosting purchases.
- No ads in gameplay.

---

## Appendix A: System Comparison Matrix

| System | Vampire Survivors | HoloCure | Neo Survivor (Planned) |
|--------|-------------------|----------|------------------------|
| Perspective | 2D top-down | 2D top-down | **3D third-person** |
| Auto-attack | Yes | Yes | Yes |
| Weapon slots | 6 | 6 | 6 |
| Item slots | 6 | 6 | 6 |
| Max weapon level | 8 | 7 | 7 |
| Evolution system | Weapon + Item + Chest | Collab (2 weapons + Anvil) | 3-tier evolution |
| Super evolution | N/A | Super Collab | Ascended Weapons |
| Arcana/Modifiers | 22 Arcana + 6 Darkana | N/A | Cyber Augments (20+) |
| Stamps | N/A | 3 slots, 3 levels | Weapon Mods |
| Special attack | N/A | Yes, per character | Ultimate Ability |
| Kill screen | Reaper at 30:00 | N/A (Stage boss) | Firewall Reaper |
| Meta currency | Gold Coins | HoloCoins | Credits (TBD) |
| Character unlock | Achievements | Gacha + Achievements | Both |
| Hub area | N/A | Holo House | Cyber Hideout |
| Limit Break | Yes | Enhancement system | Both |
| Game modes | Survival, Hurry | Stage, Endless, Time | Survival, Mission, Endless, Time Attack |

---

## Appendix B: Research Sources

- [Vampire Survivors Wiki (vampire.survivors.wiki)](https://vampire.survivors.wiki)
- [Vampire Survivors Wiki (Fandom)](https://vampire-survivors.fandom.com)
- [HoloCure Wiki (wiki.gg)](https://holocure.wiki.gg)
- [HoloCure Wiki (Fandom)](https://holocure.fandom.com)
- [Vampire Survivors - Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors)
- [HoloCure - Wikipedia](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!)
- [Steam Community Guides - Vampire Survivors](https://steamcommunity.com/app/1794680/guides/)
- [Steam Community Guides - HoloCure](https://steamcommunity.com/app/2420510/guides/)
- [BlueStacks Game Guides](https://www.bluestacks.com/blog/game-guides/vampire-survivors.html)
- [GameRant Beginner Tips](https://gamerant.com/beginner-tips-vampire-survivors/)
- [Game Truth Build Guide](https://www.gametruth.com/guides/vampire-survivors-build-guide-best-weapons-and-evolutions-2025/)
- [SAMURAI GAMERS HoloCure Guides](https://samurai-gamers.com/holocure/upgrade-list-2/)
