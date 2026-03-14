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

  it('applies shop upgrades with no items', () => {
    const stats = computePlayerStats([], { power_core: 3 });
    expect(stats.might).toBe(60); // 20 * 3
  });

  it('stacks shop upgrades with item bonuses', () => {
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 2 }];
    const stats = computePlayerStats(items, { power_core: 2 });
    expect(stats.might).toBe(60); // item: 10*2=20, shop: 20*2=40
  });

  it('ignores special upgrades (null statKey)', () => {
    const stats = computePlayerStats([], { extra_reroll: 3, revival_kit: 1 });
    expect(stats.might).toBe(0);
    expect(stats.armor).toBe(0);
  });

  it('applies character base stats', () => {
    const charStats = { might: 25, area: -20 };
    const stats = computePlayerStats([], undefined, charStats);
    expect(stats.might).toBe(25);
    expect(stats.area).toBe(-20);
  });

  it('applies character upgrade level bonuses', () => {
    const stats = computePlayerStats([], undefined, {}, 3);
    expect(stats.might).toBe(6);
    expect(stats.moveSpeed).toBe(6);
  });

  it('stacks character stats with items and shop upgrades', () => {
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 2 }];
    const charStats = { might: 10 };
    const stats = computePlayerStats(items, { power_core: 1 }, charStats, 2);
    expect(stats.might).toBe(54); // char: 10, items: 20, charUpgrade: 4, shop: 20
    expect(stats.moveSpeed).toBe(4);
  });

  it('should compute critChance from items', () => {
    const items: ItemInstance[] = [{ definitionId: 'crit_module', level: 3 }];
    const stats = computePlayerStats(items);
    expect(stats.critChance).toBe(24); // 8 * 3
  });

  it('should compute lifesteal from items', () => {
    const items: ItemInstance[] = [{ definitionId: 'reflux_core', level: 2 }];
    const stats = computePlayerStats(items);
    expect(stats.lifesteal).toBe(10); // 5 * 2
  });
});
