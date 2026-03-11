import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';

export default function GameLoop() {
  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase === 'playing') {
      state.tick(delta);
    }
  });

  return null;
}
