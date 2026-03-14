import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';

const OFFSET = new THREE.Vector3(0, 20, 14);
const LERP_SPEED = 5;
const _target = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

export default function Camera() {
  const { camera } = useThree();

  useFrame((_state, delta) => {
    const { phase, player } = useGameStore.getState();
    if (phase !== 'playing' && phase !== 'levelup' && phase !== 'augment' && phase !== 'paused') return;

    const { x, y, z } = player.position;
    _target.set(x + OFFSET.x, y + OFFSET.y, z + OFFSET.z);
    camera.position.lerp(_target, 1 - Math.exp(-LERP_SPEED * delta));

    _lookAt.set(x, y, z);
    camera.lookAt(_lookAt);
  });

  return null;
}
