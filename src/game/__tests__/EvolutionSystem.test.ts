import { describe, it, expect } from 'vitest';
import { checkEvolution } from '../EvolutionSystem';
import type { WeaponInstance, ItemInstance } from '../../types';

describe('checkEvolution', () => {
  it('returns evolution when weapon is max level and has matching item', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 8 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).not.toBeNull();
    expect(result!.evolvedWeaponId).toBe('plasma_storm');
    expect(result!.baseWeaponId).toBe('plasma_bolt');
    expect(result!.consumedItemId).toBe('energy_cell');
  });

  it('returns null for bronze chest', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 8 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'bronze');
    expect(result).toBeNull();
  });

  it('returns null when weapon not max level', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 5 }];
    const items: ItemInstance[] = [{ definitionId: 'energy_cell', level: 3 }];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).toBeNull();
  });

  it('returns null when matching item not owned', () => {
    const weapons: WeaponInstance[] = [{ definitionId: 'plasma_bolt', level: 8 }];
    const items: ItemInstance[] = [];
    const result = checkEvolution(weapons, items, 'silver');
    expect(result).toBeNull();
  });
});
