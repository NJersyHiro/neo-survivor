import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { computePlayerStats } from '../game/StatsEngine';
import { CHARACTERS } from '../data/characters';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  const meta = useMetaStore.getState();
  const shopUpgrades = meta.upgrades;
  const characterId = meta.selectedCharacterId;
  const characterDef = CHARACTERS[characterId];
  const characterLevel = meta.characterLevels[characterId] ?? 0;

  return computePlayerStats(
    items,
    shopUpgrades,
    characterDef?.baseStats,
    characterLevel,
  );
}
