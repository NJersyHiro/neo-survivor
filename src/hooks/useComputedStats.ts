import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { computePlayerStats } from '../game/StatsEngine';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  const shopUpgrades = useMetaStore.getState().upgrades;
  return computePlayerStats(items, shopUpgrades);
}
