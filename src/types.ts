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

export type UnlockCondition =
  | { type: 'character_unlocked'; characterId: string; description: string }
  | { type: 'survive_time'; seconds: number; characterId?: string; description: string }
  | { type: 'reach_level'; level: number; stageId?: string; description: string }
  | { type: 'weapon_level'; weaponId: string; level: number; description: string }
  | { type: 'total_kills'; count: number; description: string }
  | { type: 'total_hp_recovered'; amount: number; description: string }
  | { type: 'max_weapons_held'; count: number; description: string }
  | { type: 'any_weapon_max_level'; description: string }
  | { type: 'any_weapon_evolved'; description: string };

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
  unlockCondition?: UnlockCondition | null;
}

export interface WeaponInstance {
  definitionId: string;
  level: number;
}

export type EnemyBehavior = 'chase' | 'ranged' | 'teleport_chase';
export type EnemyOnDeath = 'none' | 'explode' | 'split';
export type EnemyAura = 'none' | 'heal_allies' | 'buff_damage';

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
  isBoss?: boolean;
  bossScale?: number;
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
}

export interface EnemyInstance {
  id: string;
  definitionId: string;
  position: Vec3;
  hp: number;
  maxHp: number;
  shieldHp?: number;
  shieldBrokeAt?: number;
  lastTeleport?: number;
  lastProjectile?: number;
}

export interface EnemyProjectileInstance {
  id: string;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  speed: number;
  age: number;
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
  | 'moveSpeed' | 'magnet' | 'luck' | 'growth'
  | 'critChance' | 'lifesteal';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: 'healing' | 'stat' | 'utility';
  maxLevel: number;
  stats: Partial<Record<StatKey, number>>;
  unlockCondition?: UnlockCondition | null;
}

export interface ItemInstance {
  definitionId: string;
  level: number;
}

export type ChestType = 'bronze' | 'silver';

export interface ChestInstance {
  id: string;
  position: Vec3;
  type: ChestType;
}

export type FloorItemType = 'heal' | 'magnet' | 'xp_bomb' | 'nuke' | 'gold_bag';

export interface FloorItemInstance {
  id: string;
  type: FloorItemType;
  position: Vec3;
}

export type GamePhase = 'menu' | 'playing' | 'levelup' | 'paused' | 'gameover' | 'augment';

export interface LevelUpOption {
  type: 'new_weapon' | 'upgrade_weapon' | 'new_item' | 'upgrade_item' | 'limit_break';
  weaponId?: string;
  itemId?: string;
  level: number;
}

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
