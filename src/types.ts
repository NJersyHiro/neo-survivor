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
  evolutionItemId?: string;
  evolvesInto?: string;
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

export type StatKey =
  | 'might' | 'armor' | 'maxHp' | 'recovery'
  | 'speed' | 'area' | 'cooldown' | 'amount'
  | 'moveSpeed' | 'magnet' | 'luck' | 'growth';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: 'healing' | 'stat' | 'utility';
  maxLevel: number;
  stats: Partial<Record<StatKey, number>>;
}

export interface ItemInstance {
  definitionId: string;
  level: number;
}

export type GamePhase = 'menu' | 'playing' | 'levelup' | 'paused' | 'gameover';

export interface LevelUpOption {
  type: 'new_weapon' | 'upgrade_weapon' | 'new_item' | 'upgrade_item';
  weaponId?: string;
  itemId?: string;
  level: number;
}
