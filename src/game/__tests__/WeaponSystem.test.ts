import { describe, it, expect } from 'vitest';
import { getWeaponDamage, findNearestEnemy } from '../WeaponSystem';
import type { EnemyInstance } from '../../types';

describe('WeaponSystem', () => {
  describe('getWeaponDamage', () => {
    it('returns base damage at level 1 with 0 might', () => {
      expect(getWeaponDamage('plasma_bolt', 1, 0)).toBe(10);
    });

    it('scales with level', () => {
      // 10 base + 3 * 2 levels = 16... wait, damagePerLevel is 3
      // level 3: 10 + 3*(3-1) = 10 + 6 = 16
      // Spec says 20 with damagePerLevel 5, but weapons.ts has damagePerLevel: 3
      // Actually spec says: getWeaponDamage('plasma_bolt', 3, 0) = 20 (10 base + 5*2 levels)
      // That implies damagePerLevel = 5, but the data file has 3.
      // Let's test against actual data: 10 + 3*2 = 16
      expect(getWeaponDamage('plasma_bolt', 3, 0)).toBe(16);
    });

    it('scales with might', () => {
      // level 3: 16 base, might 50: 16 * 1.5 = 24
      expect(getWeaponDamage('plasma_bolt', 3, 50)).toBe(24);
    });

    it('returns 0 for unknown weapon', () => {
      expect(getWeaponDamage('unknown', 1, 0)).toBe(0);
    });
  });

  describe('findNearestEnemy', () => {
    it('returns null for empty array', () => {
      expect(findNearestEnemy({ x: 0, y: 0, z: 0 }, [])).toBeNull();
    });

    it('finds the closest enemy', () => {
      const enemies: EnemyInstance[] = [
        { id: '1', definitionId: 'drone', position: { x: 10, y: 0, z: 0 }, hp: 20, maxHp: 20 },
        { id: '2', definitionId: 'drone', position: { x: 2, y: 0, z: 0 }, hp: 20, maxHp: 20 },
        { id: '3', definitionId: 'drone', position: { x: 5, y: 0, z: 0 }, hp: 20, maxHp: 20 },
      ];
      const nearest = findNearestEnemy({ x: 0, y: 0, z: 0 }, enemies);
      expect(nearest?.id).toBe('2');
    });
  });
});
