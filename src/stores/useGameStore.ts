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
import { WEAPONS, STARTING_WEAPON_ID, ALL_WEAPON_IDS } from '../data/weapons';

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
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  xpGems: XPGemInstance[];
  levelUpOptions: LevelUpOption[];

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
  addProjectile: (proj: ProjectileInstance) => void;
  removeProjectile: (id: string) => void;
  addXPGem: (gem: XPGemInstance) => void;
  removeXPGem: (id: string) => void;
  movePlayer: (dx: number, dz: number, delta: number) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function generateLevelUpOptions(weapons: WeaponInstance[]): LevelUpOption[] {
  const options: LevelUpOption[] = [];

  // Offer upgrades for owned weapons below max level
  for (const w of weapons) {
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
    for (const id of ALL_WEAPON_IDS) {
      if (!ownedIds.has(id)) {
        options.push({
          type: 'new_weapon',
          weaponId: id,
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
  enemies: [],
  projectiles: [],
  xpGems: [],
  levelUpOptions: [],

  reset: () =>
    set({
      phase: 'menu',
      elapsedTime: 0,
      killCount: 0,
      player: createInitialPlayer(),
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
      player: createInitialPlayer(),
      weapons: [{ definitionId: STARTING_WEAPON_ID, level: 1 }],
      enemies: [],
      projectiles: [],
      xpGems: [],
      levelUpOptions: [],
    }),

  setPhase: (phase) => set({ phase }),

  tick: (delta) =>
    set((state) => {
      const newTime = state.elapsedTime + delta;
      if (newTime >= 300) {
        return { elapsedTime: 300, phase: 'gameover' };
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
        const options = generateLevelUpOptions(state.weapons);
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
        player.hp = 0;
        return { player, phase: 'gameover' };
      }

      return { player };
    }),

  selectLevelUpOption: (option) =>
    set((state) => {
      const weapons = [...state.weapons];

      if (option.type === 'new_weapon') {
        weapons.push({ definitionId: option.weaponId, level: 1 });
      } else {
        const idx = weapons.findIndex((w) => w.definitionId === option.weaponId);
        if (idx !== -1) {
          weapons[idx] = { ...weapons[idx]!, level: option.level };
        }
      }

      return { weapons, phase: 'playing', levelUpOptions: [] };
    }),

  spawnEnemy: (enemy) =>
    set((state) => ({ enemies: [...state.enemies, enemy] })),

  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    })),

  damageEnemy: (id, damage) =>
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === id ? { ...e, hp: e.hp - damage } : e
      ),
    })),

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

  movePlayer: (dx, dz, delta) =>
    set((state) => {
      const player = { ...state.player };
      const position = { ...player.position };
      position.x = Math.max(-24, Math.min(24, position.x + dx * player.speed * delta));
      position.z = Math.max(-24, Math.min(24, position.z + dz * player.speed * delta));
      player.position = position;
      return { player };
    }),
}));
