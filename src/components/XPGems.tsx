import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { getComputedStats } from '../hooks/useComputedStats';

const MAX_GEMS = 400;
const MAGNET_RADIUS = 3.0;
const MAGNET_SPEED = 12;
const PICKUP_RADIUS = 1.5;

const _dummy = new THREE.Object3D();

export default function XPGemRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#00ff88',
        emissive: '#00ff88',
        emissiveIntensity: 0.6,
      }),
    []
  );

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const mesh = meshRef.current;
    if (!mesh) return;

    const gems = state.xpGems;
    const playerPos = state.player.position;
    const stats = getComputedStats();
    const magnetRadius = MAGNET_RADIUS * (1 + stats.magnet / 100);

    let totalXP = 0;
    const collectedIds: string[] = [];

    for (const gem of gems) {
      const dx = playerPos.x - gem.position.x;
      const dz = playerPos.z - gem.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < PICKUP_RADIUS) {
        totalXP += gem.value * (1 + stats.growth / 100);
        collectedIds.push(gem.id);
      } else if (dist < magnetRadius) {
        const nx = dx / dist;
        const nz = dz / dist;
        gem.position.x += nx * MAGNET_SPEED * delta;
        gem.position.z += nz * MAGNET_SPEED * delta;
      }
    }

    if (totalXP > 0) {
      state.addXP(totalXP);
    }
    for (const id of collectedIds) {
      state.removeXPGem(id);
    }

    // Merge oldest excess gems if over limit
    const currentGems = useGameStore.getState().xpGems;
    if (currentGems.length > MAX_GEMS) {
      const excess = currentGems.length - MAX_GEMS;
      let mergedValue = 0;
      const removeIds: string[] = [];
      for (let i = 0; i < excess; i++) {
        mergedValue += currentGems[i]!.value;
        removeIds.push(currentGems[i]!.id);
      }
      // Give the merged value to the first surviving gem
      if (currentGems[excess]) {
        currentGems[excess]!.value += mergedValue;
      }
      for (const id of removeIds) {
        state.removeXPGem(id);
      }
    }

    // Update instanced mesh
    const updatedGems = useGameStore.getState().xpGems;
    for (let i = 0; i < MAX_GEMS; i++) {
      if (i < updatedGems.length) {
        const gem = updatedGems[i]!;
        const scale = gem.value >= 5 ? 0.25 : 0.15;
        _dummy.position.set(gem.position.x, 0.3, gem.position.z);
        _dummy.scale.setScalar(scale);
        _dummy.rotation.y += delta * 2;
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      } else {
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_GEMS]}
      frustumCulled={false}
    />
  );
}
