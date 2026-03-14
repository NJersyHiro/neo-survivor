import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { ENEMIES } from '../data/enemies';
import { getWaveEntry, getSpawnPositions } from '../game/WaveManager';
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
  const lastHitSoundRef = useRef(0);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1);

    // --- Spawn logic ---
    const waveEntry = getWaveEntry('neon_district', store.elapsedTime);
    spawnTimerRef.current += clampedDelta;
    if (spawnTimerRef.current >= waveEntry.spawnInterval) {
      spawnTimerRef.current -= waveEntry.spawnInterval;
      const count = Math.min(waveEntry.maxSpawnCount, MAX_INSTANCES - store.enemies.length);
      if (count > 0) {
        const positions = getSpawnPositions(waveEntry.spawnPattern, store.player.position, count);
        // pick enemy id from weighted list
        const totalWeight = waveEntry.enemies.reduce((s, e) => s + e.weight, 0);
        for (let i = 0; i < count; i++) {
          if (store.enemies.length >= MAX_INSTANCES) break;
          let roll = Math.random() * totalWeight;
          let enemyId = waveEntry.enemies[0]!.id;
          for (const entry of waveEntry.enemies) {
            roll -= entry.weight;
            if (roll <= 0) { enemyId = entry.id; break; }
          }
          const enemyDef = ENEMIES[enemyId];
          if (!enemyDef) continue;
          const hp = Math.floor(enemyDef.hp * waveEntry.hpMultiplier);
          store.spawnEnemy({
            id: generateId(),
            definitionId: enemyId,
            position: positions[i]!,
            hp,
            maxHp: hp,
          });
        }
      }

      // --- Boss spawn logic ---
      if (waveEntry.bossId) {
        const bossdef = ENEMIES[waveEntry.bossId];
        if (bossdef) {
          const [bossPos] = getSpawnPositions('ring', store.player.position, 1);
          store.spawnEnemy({
            id: generateId(),
            definitionId: waveEntry.bossId,
            position: bossPos!,
            hp: Math.floor(bossdef.hp * waveEntry.hpMultiplier),
            maxHp: Math.floor(bossdef.hp * waveEntry.hpMultiplier),
          });
          SoundManager.bossSpawn();
        }
      }
    }

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
