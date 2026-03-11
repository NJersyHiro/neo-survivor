import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { ENEMIES } from '../data/enemies';
import { getSpawnCount, getSpawnPosition, SPAWN_INTERVAL } from '../game/WaveManager';
import { generateId, distance, directionTo } from '../utils/math';

const MAX_INSTANCES = 300;
const CONTACT_DISTANCE = 0.8;
const drone = ENEMIES.drone!;

const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();

export default function Enemies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spawnTimerRef = useRef(0);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1);

    // --- Spawn logic ---
    spawnTimerRef.current += clampedDelta;
    if (spawnTimerRef.current >= SPAWN_INTERVAL) {
      spawnTimerRef.current -= SPAWN_INTERVAL;
      const count = getSpawnCount(store.elapsedTime);
      for (let i = 0; i < count; i++) {
        if (store.enemies.length >= MAX_INSTANCES) break;
        const pos = getSpawnPosition(store.player.position);
        const hpScale = 1 + store.elapsedTime / 120;
        const hp = Math.floor(drone.hp * hpScale);
        store.spawnEnemy({
          id: generateId(),
          definitionId: 'drone',
          position: pos,
          hp,
          maxHp: hp,
        });
        // Re-read store since spawnEnemy mutates
        const updated = useGameStore.getState();
        if (updated.enemies.length >= MAX_INSTANCES) break;
      }
    }

    // --- Movement + contact damage ---
    const { enemies, player } = useGameStore.getState();
    for (const enemy of enemies) {
      const dir = directionTo(enemy.position, player.position);
      enemy.position.x += dir.x * drone.speed * clampedDelta;
      enemy.position.z += dir.z * drone.speed * clampedDelta;

      const dist = distance(enemy.position, player.position);
      if (dist < CONTACT_DISTANCE) {
        store.takeDamage(drone.damage * clampedDelta);
      }
    }

    // --- Update instanced mesh ---
    const mesh = meshRef.current;
    if (!mesh) return;

    const currentEnemies = useGameStore.getState().enemies;
    for (let i = 0; i < MAX_INSTANCES; i++) {
      if (i < currentEnemies.length) {
        const e = currentEnemies[i]!;
        tmpVec.set(e.position.x, e.position.y + drone.scale * 0.5, e.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(drone.scale, drone.scale, drone.scale));
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_INSTANCES]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={drone.color} emissive={drone.emissive} emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
