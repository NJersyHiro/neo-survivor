import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { distance } from '../utils/math';
import { SoundManager } from '../game/SoundManager';

const MAX_CHESTS = 20;
const PICKUP_RADIUS = 1.5;
const _dummy = new THREE.Object3D();

export default function Chests() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 0.8, 0.6), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#ffaa00',
      emissive: '#ff8800',
      emissiveIntensity: 0.8,
    }),
    []
  );

  useFrame(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const mesh = meshRef.current;
    if (!mesh) return;

    const chests = state.chests;
    const playerPos = state.player.position;

    // Check pickup
    for (const chest of chests) {
      const dist = distance(playerPos, chest.position);
      if (dist < PICKUP_RADIUS) {
        SoundManager.chestPickup();
        state.collectChest(chest.id);
      }
    }

    // Update instanced mesh
    const currentChests = useGameStore.getState().chests;
    for (let i = 0; i < MAX_CHESTS; i++) {
      if (i < currentChests.length) {
        const c = currentChests[i]!;
        _dummy.position.set(c.position.x, 0.4, c.position.z);
        const scale = c.type === 'silver' ? 1.2 : 0.8;
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);

        // Set color per chest type
        if (c.type === 'silver') {
          mesh.setColorAt(i, new THREE.Color('#ffffff'));
        } else {
          mesh.setColorAt(i, new THREE.Color('#ffaa00'));
        }
      } else {
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_CHESTS]} frustumCulled={false} />
  );
}
