import { create } from 'zustand';
import type {
  GamePhase,
  PlayerState,
  WeaponInstance,
  ItemInstance,
  EnemyInstance,
  ProjectileInstance,
  XPGemInstance,
  LevelUpOption,
  ChestInstance,
} from '../types';
import { WEAPONS, STARTING_WEAPON_ID, BASE_WEAPON_IDS } from '../data/weapons';
import { ITEMS, ALL_ITEM_IDS } from '../data/items';
import { computePlayerStats } from '../game/StatsEngine';
import { checkEvolution } from '../game/EvolutionSystem';
import { useMetaStore } from './useMetaStore';
import { ENEMIES } from '../data/enemies';

export function xpForLevel(level: number): number {
  return Math.floor(10 * Math.pow(1.2, level - 1));
}

function createInitialPlayer(): PlayerState {
  return {
    position: { x: 0, y: 0, z: 0 },
    hp: 100,
    maxHp: 100,
    speed: 5,
    might: 1,
    armor: 0,
    xp: 0,
    xpToNextLevel: xpForLevel(1),
    level: 1,
  };
}

interface GameState {
  phase: GamePhase;
  elapsedTime: number;
  killCount: number;
  player: PlayerState;
  weapons: WeaponInstance[];
  items: ItemInstance[];
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  xpGems: XPGemInstance[];
  levelUpOptions: LevelUpOption[];
  chests: ChestInstance[];
  rerollCount: number;
  skipCount: number;
  banishCount: number;
  banishedIds: string[];
  creditsEarned: number;
  reviveCount: number;

  reset: () => void;
  startRun: () => void;
  setPhase: (phase: GamePhase) => void;
  tick: (delta: number) => void;
  addXP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  selectLevelUpOption: (option: LevelUpOption) => void;
  reroll: () => void;
  skip: () => void;
  banish: (id: string) => void;
  spawnEnemy: (enemy: EnemyInstance) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, damage: number) => void;
  addProjectile: (proj: ProjectileInstance) => void;
  removeProjectile: (id: string) => void;
  addXPGem: (gem: XPGemInstance) => void;
  removeXPGem: (id: string) => void;
  addChest: (chest: ChestInstance) => void;
  removeChest: (id: string) => void;
  collectChest: (id: string) => void;
  movePlayer: (dx: number, dz: number, delta: number) => void;
  healPlayer: (amount: number) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function generateLevelUpOptions(
  weapons: WeaponInstance[],
  items: ItemInstance[],
  banishedIds: string[]
): LevelUpOption[] {
  const options: LevelUpOption[] = [];
  const banishedSet = new Set(banishedIds);

  // Offer upgrades for owned weapons below max level (filter banished)
  for (const w of weapons) {
    if (banishedSet.has(w.definitionId)) continue;
    const def = WEAPONS[w.definitionId];
    if (def && w.level < def.maxLevel) {
      options.push({
        type: 'upgrade_weapon',
        weaponId: w.definitionId,
        level: w.level + 1,
      });
    }
  }

  // Offer new weapons if slots < 6
  if (weapons.length < 6) {
    const ownedIds = new Set(weapons.map((w) => w.definitionId));
    for (const id of BASE_WEAPON_IDS) {
      if (!ownedIds.has(id) && !banishedSet.has(id)) {
        options.push({
          type: 'new_weapon',
          weaponId: id,
          level: 1,
        });
      }
    }
  }

  // Offer upgrades for owned items below max level (filter banished)
  for (const item of items) {
    if (banishedSet.has(item.definitionId)) continue;
    const def = ITEMS[item.definitionId];
    if (def && item.level < def.maxLevel) {
      options.push({
        type: 'upgrade_item',
        itemId: item.definitionId,
        level: item.level + 1,
      });
    }
  }

  // Offer new items if slots < 6
  if (items.length < 6) {
    const ownedItemIds = new Set(items.map((i) => i.definitionId));
    for (const id of ALL_ITEM_IDS) {
      if (!ownedItemIds.has(id) && !banishedSet.has(id)) {
        options.push({
          type: 'new_item',
          itemId: id,
          level: 1,
        });
      }
    }
  }

  return shuffleArray(options).slice(0, 3);
}

export const useGameStore = create<GameState>()((set) => ({
  phase: 'menu',
  elapsedTime: 0,
  killCount: 0,
  player: createInitialPlayer(),
  weapons: [],
  items: [],
  enemies: [],
  projectiles: [],
  xpGems: [],
  chests: [],
  levelUpOptions: [],
  rerollCount: 3,
  skipCount: 3,
  banishCount: 3,
  banishedIds: [],
  creditsEarned: 0,
  reviveCount: 0,

  reset: () =>
    set({
      phase: 'menu',
      elapsedTime: 0,
      killCount: 0,
      player: createInitialPlayer(),
      weapons: [],
      items: [],
      enemies: [],
      projectiles: [],
      xpGems: [],
      chests: [],
      levelUpOptions: [],
      rerollCount: 3,
      skipCount: 3,
      banishCount: 3,
      banishedIds: [],
      creditsEarned: 0,
      reviveCount: 0,
    }),

  startRun: () => {
    const meta = useMetaStore.getState();
    const extraRerolls = meta.getUpgradeLevel('extra_reroll');
    const revives = meta.getUpgradeLevel('revival_kit');
    set({
      phase: 'playing',
      elapsedTime: 0,
      killCount: 0,
      player: createInitialPlayer(),
      weapons: [{ definitionId: STARTING_WEAPON_ID, level: 1 }],
      items: [],
      enemies: [],
      projectiles: [],
      xpGems: [],
      chests: [],
      levelUpOptions: [],
      rerollCount: 3 + extraRerolls,
      skipCount: 3,
      banishCount: 3,
      banishedIds: [],
      creditsEarned: 0,
      reviveCount: revives,
    });
  },

  setPhase: (phase) => set({ phase }),

  tick: (delta) =>
    set((state) => {
      const newTime = state.elapsedTime + delta;
      if (newTime >= 900) {
        return { elapsedTime: 900, phase: 'gameover' };
      }
      return { elapsedTime: newTime };
    }),

  addXP: (amount) =>
    set((state) => {
      const player = { ...state.player };
      player.xp += amount;

      if (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level += 1;
        player.xpToNextLevel = xpForLevel(player.level);
        const options = generateLevelUpOptions(state.weapons, state.items, state.banishedIds);
        return { player, phase: 'levelup', levelUpOptions: options };
      }

      return { player };
    }),

  takeDamage: (amount) =>
    set((state) => {
      const player = { ...state.player };
      const effectiveDamage = Math.max(0, amount - player.armor);
      player.hp -= effectiveDamage;

      if (player.hp <= 0) {
        if (state.reviveCount > 0) {
          const shopUpgrades = useMetaStore.getState().upgrades;
          const stats = computePlayerStats(state.items, shopUpgrades);
          const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
          player.hp = Math.floor(effectiveMaxHp * 0.3);
          return { player, reviveCount: state.reviveCount - 1 };
        }
        player.hp = 0;
        return { player, phase: 'gameover' };
      }

      return { player };
    }),

  selectLevelUpOption: (option) =>
    set((state) => {
      if (option.type === 'new_item' && option.itemId) {
        const items = [...state.items];
        items.push({ definitionId: option.itemId, level: 1 });
        return { items, phase: 'playing', levelUpOptions: [] };
      } else if (option.type === 'upgrade_item' && option.itemId) {
        const items = state.items.map((i) =>
          i.definitionId === option.itemId ? { ...i, level: option.level } : i
        );
        return { items, phase: 'playing', levelUpOptions: [] };
      }

      const weapons = [...state.weapons];

      if (option.type === 'new_weapon' && option.weaponId) {
        weapons.push({ definitionId: option.weaponId, level: 1 });
      } else if (option.type === 'upgrade_weapon' && option.weaponId) {
        const idx = weapons.findIndex((w) => w.definitionId === option.weaponId);
        if (idx !== -1) {
          weapons[idx] = { ...weapons[idx]!, level: option.level };
        }
      }

      return { weapons, phase: 'playing', levelUpOptions: [] };
    }),

  reroll: () =>
    set((state) => {
      if (state.rerollCount <= 0 || state.phase !== 'levelup') return {};
      const options = generateLevelUpOptions(state.weapons, state.items, state.banishedIds);
      return { levelUpOptions: options, rerollCount: state.rerollCount - 1 };
    }),

  skip: () =>
    set((state) => {
      if (state.skipCount <= 0 || state.phase !== 'levelup') return {};
      return { phase: 'playing', levelUpOptions: [], skipCount: state.skipCount - 1 };
    }),

  banish: (id) =>
    set((state) => {
      if (state.banishCount <= 0) return {};
      return {
        banishedIds: [...state.banishedIds, id],
        banishCount: state.banishCount - 1,
      };
    }),

  spawnEnemy: (enemy) =>
    set((state) => ({ enemies: [...state.enemies, enemy] })),

  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    })),

  damageEnemy: (id, damage) =>
    set((state) => {
      const enemies = state.enemies.map((e) =>
        e.id === id ? { ...e, hp: e.hp - damage } : e
      );
      const dead = enemies.filter((e) => e.hp <= 0);
      const alive = enemies.filter((e) => e.hp > 0);

      let creditGain = 0;
      for (const d of dead) {
        const def = ENEMIES[d.definitionId];
        if (def?.isBoss) {
          creditGain += 25 + Math.floor(Math.random() * 26);
        } else {
          creditGain += 1 + Math.floor(Math.random() * 3);
        }
      }

      return {
        enemies: alive,
        killCount: state.killCount + dead.length,
        creditsEarned: state.creditsEarned + creditGain,
      };
    }),

  addProjectile: (proj) =>
    set((state) => ({ projectiles: [...state.projectiles, proj] })),

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

  addChest: (chest) =>
    set((state) => ({ chests: [...state.chests, chest] })),

  removeChest: (id) =>
    set((state) => ({ chests: state.chests.filter((c) => c.id !== id) })),

  collectChest: (id) =>
    set((state) => {
      const chest = state.chests.find((c) => c.id === id);
      if (!chest) return {};

      const chests = state.chests.filter((c) => c.id !== id);
      const evolution = checkEvolution(state.weapons, state.items, chest.type);

      if (evolution) {
        // Replace base weapon with evolved weapon
        const weapons = state.weapons.map((w) =>
          w.definitionId === evolution.baseWeaponId
            ? { definitionId: evolution.evolvedWeaponId, level: 1 }
            : w
        );
        // Remove consumed item
        const items = state.items.filter((i) => i.definitionId !== evolution.consumedItemId);
        return { chests, weapons, items };
      }

      // No evolution: level up a random owned weapon or item by 1
      const upgradeable = [
        ...state.weapons.filter((w) => {
          const def = WEAPONS[w.definitionId];
          return def && w.level < def.maxLevel;
        }).map((w) => ({ type: 'weapon' as const, id: w.definitionId })),
        ...state.items.filter((i) => {
          const def = ITEMS[i.definitionId];
          return def && i.level < def.maxLevel;
        }).map((i) => ({ type: 'item' as const, id: i.definitionId })),
      ];

      if (upgradeable.length === 0) return { chests };

      const pick = upgradeable[Math.floor(Math.random() * upgradeable.length)]!;
      if (pick.type === 'weapon') {
        const weapons = state.weapons.map((w) =>
          w.definitionId === pick.id ? { ...w, level: w.level + 1 } : w
        );
        return { chests, weapons };
      } else {
        const items = state.items.map((i) =>
          i.definitionId === pick.id ? { ...i, level: i.level + 1 } : i
        );
        return { chests, items };
      }
    }),

  movePlayer: (dx, dz, delta) =>
    set((state) => {
      const player = { ...state.player };
      const position = { ...player.position };
      position.x = Math.max(-24, Math.min(24, position.x + dx * player.speed * delta));
      position.z = Math.max(-24, Math.min(24, position.z + dz * player.speed * delta));
      player.position = position;
      return { player };
    }),

  healPlayer: (amount) =>
    set((state) => {
      const player = { ...state.player };
      const shopUpgrades = useMetaStore.getState().upgrades;
      const stats = computePlayerStats(state.items, shopUpgrades);
      const effectiveMaxHp = player.maxHp * (1 + stats.maxHp / 100);
      player.hp = Math.min(player.hp + amount, effectiveMaxHp);
      return { player };
    }),
}));
