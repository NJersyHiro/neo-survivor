import { useGameStore } from '../stores/useGameStore';
import { computePlayerStats } from '../game/StatsEngine';

export function getComputedStats() {
  const items = useGameStore.getState().items;
  return computePlayerStats(items);
}
