import { describe, it, expect, beforeEach } from 'vitest';
import { distance, normalize, directionTo, generateId, resetIdCounter } from '../math';

describe('distance', () => {
  it('returns 0 for same point', () => {
    const p = { x: 1, y: 2, z: 3 };
    expect(distance(p, p)).toBe(0);
  });

  it('returns 5 for (0,0,0) to (3,0,4)', () => {
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 4 })).toBe(5);
  });
});

describe('normalize', () => {
  it('normalizes (3,0,4) to (0.6, 0, 0.8)', () => {
    const result = normalize({ x: 3, y: 0, z: 4 });
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBe(0);
    expect(result.z).toBeCloseTo(0.8);
  });

  it('returns zero vector for zero input', () => {
    const result = normalize({ x: 0, y: 0, z: 0 });
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe('directionTo', () => {
  it('returns normalized direction', () => {
    const from = { x: 0, y: 0, z: 0 };
    const to = { x: 3, y: 0, z: 4 };
    const dir = directionTo(from, to);
    expect(dir.x).toBeCloseTo(0.6);
    expect(dir.y).toBe(0);
    expect(dir.z).toBeCloseTo(0.8);
  });
});

describe('generateId', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('returns incrementing string IDs', () => {
    expect(generateId()).toBe('1');
    expect(generateId()).toBe('2');
    expect(generateId()).toBe('3');
  });
});
