import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { ENEMIES } from '../data/enemies';
import { getWaveEntry, getSpawnPositions } from '../game/WaveManager';
import { generateId, distance, directionTo } from '../utils/math';
import { SoundManager } from '../game/SoundManager';
import type { EnemyInstance } from '../types';

const MAX_INSTANCES = 300;
const CONTACT_DISTANCE = 0.8;
const AURA_TICK_INTERVAL = 1.0;

const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();
const tmpColor = new THREE.Color();

function selectWeightedEnemy(enemies: { id: string; weight: number }[]): string {
  const totalWeight = enemies.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of enemies) {
    roll -= e.weight;
    if (roll <= 0) return e.id;
  }
  return enemies[enemies.length - 1]!.id;
}

export default function Enemies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spawnTimerRef = useRef(0);
  const prevTimeRef = useRef(0);
  const prevMinuteRef = useRef(-1);
  const lastHitSoundRef = useRef(0);
  const auraTimerRef = useRef(0);
  const reaperTimerRef = useRef(0);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1);
    const { elapsedTime, hyperModeEnabled } = store;

    const stageId = useMetaStore.getState().selectedStageId;

    // --- Spawn logic ---
    const waveEntry = getWaveEntry(stageId, elapsedTime);
    const effectiveInterval = hyperModeEnabled
      ? waveEntry.spawnInterval * 0.5
      : waveEntry.spawnInterval;

    spawnTimerRef.current += clampedDelta;
    if (spawnTimerRef.current >= effectiveInterval) {
      spawnTimerRef.current -= effectiveInterval;
      const count = Math.min(waveEntry.maxSpawnCount, MAX_INSTANCES - store.enemies.length);
      if (count > 0) {
        const positions = getSpawnPositions(waveEntry.spawnPattern, store.player.position, count);
        for (let i = 0; i < count; i++) {
          if (store.enemies.length >= MAX_INSTANCES) break;
          const enemyId = selectWeightedEnemy(waveEntry.enemies);
          const enemyDef = ENEMIES[enemyId];
          if (!enemyDef) continue;
          const hp = Math.floor(
            enemyDef.hp *
              waveEntry.hpMultiplier *
              (1 + elapsedTime / 120) *
              (hyperModeEnabled ? 1.5 : 1)
          );
          const newEnemy: EnemyInstance = {
            id: generateId(),
            definitionId: enemyId,
            position: positions[i]!,
            hp,
            maxHp: hp,
          };
          if (enemyDef.shieldHp != null) {
            newEnemy.shieldHp = enemyDef.shieldHp;
          }
          store.spawnEnemy(newEnemy);
          useMetaStore.getState().addEncounteredEnemy(enemyId);
        }
      }
    }

    // --- Boss spawn logic (per-minute check) ---
    const currentMinute = Math.floor(elapsedTime / 60);
    if (currentMinute !== prevMinuteRef.current) {
      prevMinuteRef.current = currentMinute;
      const bossWaveEntry = getWaveEntry(stageId, currentMinute * 60);
      if (bossWaveEntry.bossId) {
        const bossDef = ENEMIES[bossWaveEntry.bossId];
        if (bossDef) {
          const [bossPos] = getSpawnPositions('ring', store.player.position, 1);
          const bossHp = Math.floor(
            bossDef.hp *
              bossWaveEntry.hpMultiplier *
              (1 + elapsedTime / 120) *
              (hyperModeEnabled ? 1.5 : 1)
          );
          const bossEnemy: EnemyInstance = {
            id: generateId(),
            definitionId: bossWaveEntry.bossId,
            position: bossPos!,
            hp: bossHp,
            maxHp: bossHp,
          };
          store.spawnEnemy(bossEnemy);
          useMetaStore.getState().addEncounteredEnemy(bossWaveEntry.bossId);
          SoundManager.bossSpawn();
        }
      }
    }

    // --- Kill screen / System Purge logic ---
    const prevTime = prevTimeRef.current;
    prevTimeRef.current = elapsedTime;

    if (elapsedTime >= 1800) {
      // First System Purge: spawn when crossing 1800 for the first time
      if (prevTime < 1800) {
        reaperTimerRef.current = 0;
        const [reaperPos] = getSpawnPositions('ring', store.player.position, 1);
        const reaperDef = ENEMIES['system_purge']!;
        store.spawnEnemy({
          id: generateId(),
          definitionId: 'system_purge',
          position: reaperPos!,
          hp: reaperDef.hp,
          maxHp: reaperDef.hp,
        });
        useMetaStore.getState().addEncounteredEnemy('system_purge');
      } else {
        // Additional System Purges every 60s after 1800
        reaperTimerRef.current += clampedDelta;
        if (reaperTimerRef.current >= 60) {
          reaperTimerRef.current -= 60;
          const [reaperPos] = getSpawnPositions('ring', store.player.position, 1);
          const reaperDef = ENEMIES['system_purge']!;
          store.spawnEnemy({
            id: generateId(),
            definitionId: 'system_purge',
            position: reaperPos!,
            hp: reaperDef.hp,
            maxHp: reaperDef.hp,
          });
        }
      }
    }

    // --- Re-read state after spawns ---
    const { enemies, player } = useGameStore.getState();

    // --- Aura tick accumulation ---
    auraTimerRef.current += clampedDelta;
    const doAuraTick = auraTimerRef.current >= AURA_TICK_INTERVAL;
    if (doAuraTick) {
      auraTimerRef.current -= AURA_TICK_INTERVAL;
    }

    // --- Movement + behavior + contact damage ---
    for (const enemy of enemies) {
      const enemyDef = ENEMIES[enemy.definitionId];
      if (!enemyDef) continue;

      const effectiveSpeed = hyperModeEnabled ? enemyDef.speed * 2 : enemyDef.speed;
      const behavior = enemyDef.behavior ?? 'chase';

      if (behavior === 'teleport_chase') {
        const teleportInterval = enemyDef.teleportInterval ?? 5;
        const lastTeleport = enemy.lastTeleport ?? 0;
        if (elapsedTime - lastTeleport >= teleportInterval) {
          enemy.lastTeleport = elapsedTime;
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 5;
          enemy.position.x = player.position.x + Math.cos(angle) * dist;
          enemy.position.z = player.position.z + Math.sin(angle) * dist;
        } else {
          // still chase while waiting for teleport
          const dir = directionTo(enemy.position, player.position);
          enemy.position.x += dir.x * effectiveSpeed * clampedDelta;
          enemy.position.z += dir.z * effectiveSpeed * clampedDelta;
        }
      } else if (behavior === 'ranged') {
        const attackRange = enemyDef.attackRange ?? 10;
        const dist = distance(enemy.position, player.position);
        if (dist <= attackRange) {
          // In range: stop and fire
          const projInterval = enemyDef.projectileInterval ?? 2.0;
          const lastProj = enemy.lastProjectile ?? 0;
          if (elapsedTime - lastProj >= projInterval) {
            enemy.lastProjectile = elapsedTime;
            const dir = directionTo(enemy.position, player.position);
            const projSpeed = enemyDef.projectileSpeed ?? 8;
            store.addEnemyProjectile({
              id: generateId(),
              position: { ...enemy.position },
              velocity: { x: dir.x * projSpeed, y: 0, z: dir.z * projSpeed },
              damage: enemyDef.projectileDamage ?? enemyDef.damage,
              speed: projSpeed,
              age: 0,
            });
          }
        } else {
          // Outside range: chase
          const dir = directionTo(enemy.position, player.position);
          enemy.position.x += dir.x * effectiveSpeed * clampedDelta;
          enemy.position.z += dir.z * effectiveSpeed * clampedDelta;
        }
      } else {
        // chase (default)
        const dir = directionTo(enemy.position, player.position);
        enemy.position.x += dir.x * effectiveSpeed * clampedDelta;
        enemy.position.z += dir.z * effectiveSpeed * clampedDelta;
      }

      // --- Shield regeneration ---
      if (enemyDef.shieldHp != null && enemyDef.shieldRegenDelay != null) {
        if ((enemy.shieldHp ?? 0) <= 0 && enemy.shieldBrokeAt != null) {
          if (elapsedTime - enemy.shieldBrokeAt >= enemyDef.shieldRegenDelay) {
            enemy.shieldHp = enemyDef.shieldHp;
            enemy.shieldBrokeAt = undefined;
          }
        }
      }

      // --- Aura: heal_allies ---
      if (doAuraTick && enemyDef.aura === 'heal_allies' && enemyDef.auraValue != null && enemyDef.auraRadius != null) {
        const healAmount = enemyDef.auraValue * AURA_TICK_INTERVAL;
        for (const other of enemies) {
          if (other.id === enemy.id) continue;
          if (distance(enemy.position, other.position) <= enemyDef.auraRadius) {
            other.hp = Math.min(other.hp + healAmount, other.maxHp);
          }
        }
      }

      // --- Contact damage ---
      const dist = distance(enemy.position, player.position);
      if (dist < CONTACT_DISTANCE) {
        let dmg = enemyDef.damage;

        // Check buff_damage aura from nearby enemies
        for (const other of enemies) {
          if (other.id === enemy.id) continue;
          const otherDef = ENEMIES[other.definitionId];
          if (
            otherDef?.aura === 'buff_damage' &&
            otherDef.auraValue != null &&
            otherDef.auraRadius != null &&
            distance(enemy.position, other.position) <= otherDef.auraRadius
          ) {
            dmg *= 1 + otherDef.auraValue;
          }
        }

        if (enemyDef.isReaper) {
          store.takeDamage(dmg, true);
        } else {
          store.takeDamage(dmg * clampedDelta);
        }

        const now = elapsedTime;
        if (now - lastHitSoundRef.current >= 1) {
          lastHitSoundRef.current = now;
          SoundManager.playerHit();
        }
      }
    }

    // --- Tick enemy projectiles ---
    store.tickEnemyProjectiles(clampedDelta);

    // --- Update instanced mesh ---
    const mesh = meshRef.current;
    if (!mesh) return;

    // Set up instanceColor buffer attribute if not present
    if (!mesh.instanceColor) {
      const colorArray = new Float32Array(MAX_INSTANCES * 3);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    }

    const currentEnemies = useGameStore.getState().enemies;
    for (let i = 0; i < MAX_INSTANCES; i++) {
      if (i < currentEnemies.length) {
        const e = currentEnemies[i]!;
        const enemyDef = ENEMIES[e.definitionId];
        const scale = enemyDef?.isBoss
          ? (enemyDef.bossScale ?? enemyDef.scale)
          : (enemyDef?.scale ?? 0.5);
        tmpVec.set(e.position.x, e.position.y + scale * 0.5, e.position.z);
        tmpMatrix.makeTranslation(tmpVec.x, tmpVec.y, tmpVec.z);
        tmpMatrix.scale(tmpVec.set(scale, scale, scale));

        // Per-enemy color: use shield color if shielded, otherwise enemy definition color
        const isShielded = (e.shieldHp ?? 0) > 0;
        if (isShielded) {
          tmpColor.set('#00aaff');
        } else {
          tmpColor.set(enemyDef?.color ?? '#ff3366');
        }
        mesh.setColorAt(i, tmpColor);
      } else {
        tmpMatrix.makeTranslation(0, -100, 0);
        tmpColor.set('#000000');
        mesh.setColorAt(i, tmpColor);
      }
      mesh.setMatrixAt(i, tmpMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors emissive="#ffffff" emissiveIntensity={0.3} toneMapped={false} />
    </instancedMesh>
  );
}
