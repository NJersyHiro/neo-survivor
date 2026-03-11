import type { Vec3, EnemyInstance } from '../types';
import { WEAPONS } from '../data/weapons';
import { distance } from '../utils/math';

export function getWeaponDamage(weaponId: string, level: number, might: number): number {
  const def = WEAPONS[weaponId];
  if (!def) return 0;
  const base = def.baseDamage + def.damagePerLevel * (level - 1);
  return Math.floor(base * (1 + might / 100));
}

export function findNearestEnemy(position: Vec3, enemies: EnemyInstance[]): EnemyInstance | null {
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
  return def.cooldown * (1 - 0.05 * (level - 1));
}
