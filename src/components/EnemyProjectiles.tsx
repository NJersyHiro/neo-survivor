import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';

const MAX_ENEMY_PROJECTILES = 100;
const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();

export default function EnemyProjectiles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const projectiles = useGameStore.getState().enemyProjectiles;

    for (let i = 0; i < MAX_ENEMY_PROJECTILES; i++) {
      if (i < projectiles.length) {
        const p = projectiles[i]!;
        tmpVec.set(p.position.x, 0.3, p.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(0.2, 0.2, 0.2));
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_ENEMY_PROJECTILES]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.8} />
    </instancedMesh>
  );
}
