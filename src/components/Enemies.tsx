import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { ENEMIES } from '../data/enemies';
import { getSpawnCount, getSpawnPosition, getEnemyTypeForTime, SPAWN_INTERVAL } from '../game/WaveManager';
import { shouldSpawnBoss } from '../game/BossManager';
import { generateId, distance, directionTo } from '../utils/math';
import { SoundManager } from '../game/SoundManager';

const MAX_INSTANCES = 300;
const CONTACT_DISTANCE = 0.8;
const drone = ENEMIES.drone!;

const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();

export default function Enemies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spawnTimerRef = useRef(0);
  const prevTimeRef = useRef(0);
  const lastHitSoundRef = useRef(0);

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
        const enemyType = getEnemyTypeForTime(store.elapsedTime);
        const enemyDef = ENEMIES[enemyType];
        if (!enemyDef) continue;
        const hpScale = 1 + store.elapsedTime / 120;
        const hp = Math.floor(enemyDef.hp * hpScale);
        store.spawnEnemy({
          id: generateId(),
          definitionId: enemyType,
          position: pos,
          hp,
          maxHp: hp,
        });
        // Re-read store since spawnEnemy mutates
        const updated = useGameStore.getState();
        if (updated.enemies.length >= MAX_INSTANCES) break;
      }
    }

    // --- Boss spawn logic ---
    if (shouldSpawnBoss(store.elapsedTime, prevTimeRef.current)) {
      const bossdef = ENEMIES.sentinel;
      if (bossdef) {
        const pos = getSpawnPosition(store.player.position);
        store.spawnEnemy({
          id: generateId(),
          definitionId: 'sentinel',
          position: pos,
          hp: bossdef.hp,
          maxHp: bossdef.hp,
        });
        SoundManager.bossSpawn();
      }
    }
    prevTimeRef.current = store.elapsedTime;

    // --- Movement + contact damage ---
    const { enemies, player } = useGameStore.getState();
    for (const enemy of enemies) {
      const enemyDef = ENEMIES[enemy.definitionId] ?? drone;
      const dir = directionTo(enemy.position, player.position);
      enemy.position.x += dir.x * enemyDef.speed * clampedDelta;
      enemy.position.z += dir.z * enemyDef.speed * clampedDelta;

      const dist = distance(enemy.position, player.position);
      if (dist < CONTACT_DISTANCE) {
        store.takeDamage(enemyDef.damage * clampedDelta);
        const now = store.elapsedTime;
        if (now - lastHitSoundRef.current >= 1) {
          lastHitSoundRef.current = now;
          SoundManager.playerHit();
        }
      }
    }

    // --- Update instanced mesh ---
    const mesh = meshRef.current;
    if (!mesh) return;

    const currentEnemies = useGameStore.getState().enemies;
    for (let i = 0; i < MAX_INSTANCES; i++) {
      if (i < currentEnemies.length) {
        const e = currentEnemies[i]!;
        const enemyDef = ENEMIES[e.definitionId];
        const scale = enemyDef?.isBoss ? (enemyDef.bossScale ?? enemyDef.scale) : (enemyDef?.scale ?? 0.5);
        tmpVec.set(e.position.x, e.position.y + scale * 0.5, e.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(scale, scale, scale));
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={drone.color} emissive={drone.emissive} emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
