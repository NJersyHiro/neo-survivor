import type { Vec3 } from '../types';

export function distance(a: Vec3, b: Vec3): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: 0, z: v.z / len };
}

export function directionTo(from: Vec3, to: Vec3): Vec3 {
  return normalize({ x: to.x - from.x, y: 0, z: to.z - from.z });
}

let idCounter = 0;

export function generateId(): string {
  idCounter += 1;
  return String(idCounter);
}

export function resetIdCounter(): void {
  idCounter = 0;
}
