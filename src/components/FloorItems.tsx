import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { getComputedStats } from '../hooks/useComputedStats';
import { FLOOR_ITEMS } from '../data/floorItems';
import { ENEMIES } from '../data/enemies';
import { SoundManager } from '../game/SoundManager';
import type { FloorItemType } from '../types';

const MAX_FLOOR_ITEMS = 50;
const PICKUP_RADIUS = 1.8;
const MAGNET_RADIUS = 4.0;
const MAGNET_SPEED = 10;

const _dummy = new THREE.Object3D();

const materials: Record<FloorItemType, THREE.MeshStandardMaterial> = {
  heal: new THREE.MeshStandardMaterial({ color: '#00ff44', emissive: '#00ff44', emissiveIntensity: 0.8 }),
  magnet: new THREE.MeshStandardMaterial({ color: '#4488ff', emissive: '#4488ff', emissiveIntensity: 0.8 }),
  xp_bomb: new THREE.MeshStandardMaterial({ color: '#00ff88', emissive: '#00ff88', emissiveIntensity: 0.8 }),
  gold_bag: new THREE.MeshStandardMaterial({ color: '#ffdd00', emissive: '#ffdd00', emissiveIntensity: 0.8 }),
  nuke: new THREE.MeshStandardMaterial({ color: '#ff4444', emissive: '#ff4444', emissiveIntensity: 0.8 }),
};

const geometries: Record<FloorItemType, THREE.BufferGeometry> = {
  heal: new THREE.OctahedronGeometry(0.3, 0),
  magnet: new THREE.TorusGeometry(0.25, 0.08, 6, 8),
  xp_bomb: new THREE.IcosahedronGeometry(0.25, 0),
  gold_bag: new THREE.BoxGeometry(0.3, 0.3, 0.3),
  nuke: new THREE.ConeGeometry(0.25, 0.5, 6),
};

export default function FloorItemRenderer() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Record<FloorItemType, THREE.InstancedMesh | null>>({
    heal: null, magnet: null, xp_bomb: null, gold_bag: null, nuke: null,
  });

  const typeKeys = useMemo(() => Object.keys(FLOOR_ITEMS) as FloorItemType[], []);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const items = state.floorItems;
    const playerPos = state.player.position;
    const stats = getComputedStats();
    const magnetRadius = MAGNET_RADIUS * (1 + stats.magnet / 100);

    const collectedIds: string[] = [];
    let totalXP = 0;
    let totalCredits = 0;
    let totalHeal = 0;
    let collectAllGems = false;
    let nukeTriggered = false;

    for (const item of items) {
      const dx = playerPos.x - item.position.x;
      const dz = playerPos.z - item.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < PICKUP_RADIUS) {
        collectedIds.push(item.id);
        switch (item.type) {
          case 'heal':
            totalHeal += Math.floor(state.player.maxHp * 0.3);
            break;
          case 'magnet':
            collectAllGems = true;
            break;
          case 'xp_bomb':
            totalXP += 25 * (1 + stats.growth / 100);
            break;
          case 'gold_bag':
            totalCredits += 5 + Math.floor(Math.random() * 11);
            break;
          case 'nuke':
            nukeTriggered = true;
            break;
        }
      } else if (dist < magnetRadius) {
        const nx = dx / dist;
        const nz = dz / dist;
        item.position.x += nx * MAGNET_SPEED * delta;
        item.position.z += nz * MAGNET_SPEED * delta;
      }
    }

    if (collectedIds.length > 0) {
      SoundManager.pickupXP();

      for (const id of collectedIds) {
        state.removeFloorItem(id);
      }
      if (totalHeal > 0) {
        state.healPlayer(totalHeal);
      }
      if (totalXP > 0) {
        state.addXP(totalXP);
      }
      if (totalCredits > 0) {
        useGameStore.setState((s) => ({
          creditsEarned: s.creditsEarned + totalCredits,
        }));
      }
      if (collectAllGems) {
        useGameStore.setState((s) => ({
          xpGems: s.xpGems.map((g) => ({
            ...g,
            position: { x: playerPos.x, y: 0, z: playerPos.z },
          })),
        }));
      }
      if (nukeTriggered) {
        useGameStore.setState((s) => {
          let killCount = 0;
          let creditGain = 0;
          const alive = s.enemies.filter((e) => {
            const eDef = ENEMIES[e.definitionId];
            if (eDef?.isBoss || eDef?.isReaper) return true;
            killCount++;
            creditGain += 1;
            return false;
          });
          return {
            enemies: alive,
            killCount: s.killCount + killCount,
            creditsEarned: s.creditsEarned + creditGain,
          };
        });
      }
    }

    // Update instanced meshes per type
    const currentItems = useGameStore.getState().floorItems;

    for (const type of typeKeys) {
      const mesh = meshRefs.current[type];
      if (!mesh) continue;
      let idx = 0;
      const now = Date.now();
      for (const item of currentItems) {
        if (item.type !== type) continue;
        _dummy.position.set(
          item.position.x,
          0.4 + Math.sin(now * 0.003 + idx) * 0.1,
          item.position.z,
        );
        _dummy.rotation.y = now * 0.002;
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        mesh.setMatrixAt(idx, _dummy.matrix);
        idx++;
      }
      for (let i = idx; i < MAX_FLOOR_ITEMS; i++) {
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {typeKeys.map((type) => (
        <instancedMesh
          key={type}
          ref={(el) => { meshRefs.current[type] = el; }}
          args={[geometries[type], materials[type], MAX_FLOOR_ITEMS]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
