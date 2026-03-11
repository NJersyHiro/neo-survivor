import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { useGameStore } from '../stores/useGameStore';

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const input = useInput();

  useFrame((_state, delta) => {
    const { dx, dz } = input.current;
    const store = useGameStore.getState();

    if (store.phase === 'playing') {
      if (dx !== 0 || dz !== 0) {
        store.movePlayer(dx, dz, delta);
      }
    }

    const { x, y, z } = store.player.position;
    if (meshRef.current) {
      meshRef.current.position.set(x, y, z);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Capsule body */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Direction indicator */}
      <mesh position={[0, 0.5, -0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}
