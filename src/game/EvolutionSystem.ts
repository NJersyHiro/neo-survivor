import type { WeaponInstance, ItemInstance, ChestType } from '../types';
import { WEAPONS } from '../data/weapons';

export interface EvolutionResult {
  baseWeaponId: string;
  evolvedWeaponId: string;
  consumedItemId: string;
}

export function checkEvolution(
  weapons: WeaponInstance[],
  items: ItemInstance[],
  chestType: ChestType
): EvolutionResult | null {
  if (chestType !== 'silver') return null;

  const itemIds = new Set(items.map(i => i.definitionId));

  for (const weapon of weapons) {
    const def = WEAPONS[weapon.definitionId];
    if (!def?.evolvesInto || !def.evolutionItemId) continue;
    if (weapon.level < def.maxLevel) continue;
    if (!itemIds.has(def.evolutionItemId)) continue;

    return {
      baseWeaponId: weapon.definitionId,
      evolvedWeaponId: def.evolvesInto,
      consumedItemId: def.evolutionItemId,
    };
  }

  return null;
}
