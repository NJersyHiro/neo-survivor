import { describe, it, expect } from 'vitest';
import { computePlayerStats } from '../StatsEngine';
import type { ItemInstance } from '../../types';

describe('computePlayerStats', () => {
  it('returns zero stats with no items', () => {
    const stats = computePlayerStats([]);
    expect(stats.might).toBe(0);
    expect(stats.armor).toBe(0);
    expect(stats.maxHp).toBe(0);
    expect(stats.recovery).toBe(0);
    expect(stats.speed).toBe(0);
    expect(stats.area).toBe(0);
    expect(stats.cooldown).toBe(0);
    expect(stats.amount).toBe(0);
    expect(stats.moveSpeed).toBe(0);
    expect(stats.magnet).toBe(0);
    expect(stats.luck).toBe(0);
    expect(stats.growth).toBe(0);
  });

  it('computes correct stats for a single item (energy_cell level 3 → might 30)', () => {
    const items: ItemInstance[] = [
      { definitionId: 'energy_cell', level: 3 },
    ];
    const stats = computePlayerStats(items);
    expect(stats.might).toBe(30);
    expect(stats.armor).toBe(0);
  });

  it('stacks multiple items correctly', () => {
    const items: ItemInstance[] = [
      { definitionId: 'energy_cell', level: 2 },     // might +10*2 = 20
      { definitionId: 'shield_matrix', level: 3 },   // armor +1*3 = 3
      { definitionId: 'holo_armor', level: 1 },       // maxHp +15*1 = 15
      { definitionId: 'nano_repair', level: 4 },      // recovery +0.3*4 = 1.2
    ];
    const stats = computePlayerStats(items);
    expect(stats.might).toBe(20);
    expect(stats.armor).toBe(3);
    expect(stats.maxHp).toBe(15);
    expect(stats.recovery).toBeCloseTo(1.2);
    expect(stats.moveSpeed).toBe(0);
  });
});
