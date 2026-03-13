import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';
import { getComputedStats } from '../hooks/useComputedStats';

export default function GameLoop() {
  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase === 'playing') {
      const clampedDelta = Math.min(delta, 0.1);
      state.tick(clampedDelta);

      const stats = getComputedStats();
      if (stats.recovery > 0) {
        state.healPlayer(stats.recovery * clampedDelta);
      }

      state.tickRazorWire(clampedDelta);
    }
  });

  return null;
}
