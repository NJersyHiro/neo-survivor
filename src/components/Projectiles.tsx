import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';
import { ENEMIES } from '../data/enemies';
import { getWeaponDamage, findNearestEnemy, getWeaponCooldown } from '../game/WeaponSystem';
import { generateId, distance, directionTo } from '../utils/math';
import type { ProjectileInstance } from '../types';

const MAX_PROJECTILES = 200;
const PROJECTILE_LIFETIME = 3.0;
const MULTI_SPREAD = 0.5; // radians

const tmpMatrix = new THREE.Matrix4();
const tmpVec = new THREE.Vector3();

export default function Projectiles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cooldownsRef = useRef<Map<string, number>>(new Map());

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1);
    const { weapons, player, enemies } = store;
    const cooldowns = cooldownsRef.current;

    // --- Per-weapon fire logic ---
    for (const weapon of weapons) {
      const def = WEAPONS[weapon.definitionId];
      if (!def) continue;

      const currentCd = cooldowns.get(weapon.definitionId) ?? 0;
      const newCd = currentCd - clampedDelta;
      cooldowns.set(weapon.definitionId, newCd);

      if (newCd > 0) continue;

      // Reset cooldown
      cooldowns.set(weapon.definitionId, getWeaponCooldown(weapon.definitionId, weapon.level));

      const damage = getWeaponDamage(weapon.definitionId, weapon.level, player.might);

      if (def.category === 'melee') {
        // Damage all enemies within area
        for (const enemy of enemies) {
          const dist = distance(player.position, enemy.position);
          if (dist <= def.area) {
            const enemyDef = ENEMIES[enemy.definitionId];
            const willDie = enemy.hp - damage <= 0;
            store.damageEnemy(enemy.id, damage);
            if (willDie && enemyDef) {
              store.addXPGem({
                id: generateId(),
                position: { ...enemy.position },
                value: enemyDef.xpValue,
              });
            }
          }
        }
      } else {
        // Ranged or multishot
        const nearest = findNearestEnemy(player.position, enemies);
        if (!nearest) continue;

        const dir = directionTo(player.position, nearest.position);
        const baseAngle = Math.atan2(dir.z, dir.x);
        const amount = def.amount;

        for (let i = 0; i < amount; i++) {
          let angle = baseAngle;
          if (amount > 1) {
            const offset = -MULTI_SPREAD / 2 + (MULTI_SPREAD / (amount - 1)) * i;
            angle = baseAngle + offset;
          }

          const vx = Math.cos(angle) * def.projectileSpeed;
          const vz = Math.sin(angle) * def.projectileSpeed;

          const proj: ProjectileInstance = {
            id: generateId(),
            weaponId: weapon.definitionId,
            position: { ...player.position },
            velocity: { x: vx, y: 0, z: vz },
            damage,
            pierce: def.pierce,
            pierceCount: 0,
            area: def.area,
            lifetime: PROJECTILE_LIFETIME,
            age: 0,
          };
          store.addProjectile(proj);
        }
      }
    }

    // --- Move projectiles + age ---
    const currentProjectiles = useGameStore.getState().projectiles;
    const toRemove: string[] = [];

    for (const proj of currentProjectiles) {
      proj.position.x += proj.velocity.x * clampedDelta;
      proj.position.z += proj.velocity.z * clampedDelta;
      proj.age += clampedDelta;

      if (proj.age >= proj.lifetime) {
        toRemove.push(proj.id);
        continue;
      }

      // --- Collision with enemies ---
      const currentEnemies = useGameStore.getState().enemies;
      for (const enemy of currentEnemies) {
        const dist = distance(proj.position, enemy.position);
        if (dist < proj.area + 0.5) {
          const enemyDef = ENEMIES[enemy.definitionId];
          const willDie = enemy.hp - proj.damage <= 0;
          store.damageEnemy(enemy.id, proj.damage);
          if (willDie && enemyDef) {
            store.addXPGem({
              id: generateId(),
              position: { ...enemy.position },
              value: enemyDef.xpValue,
            });
          }

          proj.pierceCount += 1;
          if (proj.pierceCount >= proj.pierce) {
            toRemove.push(proj.id);
            break;
          }
        }
      }
    }

    for (const id of toRemove) {
      store.removeProjectile(id);
    }

    // --- Update instanced mesh ---
    const mesh = meshRef.current;
    if (!mesh) return;

    const finalProjectiles = useGameStore.getState().projectiles;
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      if (i < finalProjectiles.length) {
        const p = finalProjectiles[i]!;
        tmpVec.set(p.position.x, p.position.y + 0.3, p.position.z);
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PROJECTILES]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={1} />
    </instancedMesh>
  );
}
