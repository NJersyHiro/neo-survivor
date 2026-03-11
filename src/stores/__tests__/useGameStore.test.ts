import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, xpForLevel } from '../useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('initializes with correct defaults', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe('menu');
    expect(state.player.hp).toBe(100);
    expect(state.player.maxHp).toBe(100);
    expect(state.player.level).toBe(1);
    expect(state.player.speed).toBe(5);
    expect(state.weapons).toEqual([]);
    expect(state.enemies).toEqual([]);
    expect(state.elapsedTime).toBe(0);
    expect(state.killCount).toBe(0);
  });

  it('startRun sets phase playing with starting weapon', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.weapons).toHaveLength(1);
    expect(state.weapons[0]?.definitionId).toBe('plasma_bolt');
    expect(state.weapons[0]?.level).toBe(1);
  });

  it('addXP triggers level-up when threshold reached', () => {
    useGameStore.getState().startRun();
    const xpNeeded = xpForLevel(1);
    useGameStore.getState().addXP(xpNeeded);
    const state = useGameStore.getState();
    expect(state.phase).toBe('levelup');
    expect(state.player.level).toBe(2);
    expect(state.levelUpOptions.length).toBeGreaterThan(0);
    expect(state.levelUpOptions.length).toBeLessThanOrEqual(3);
  });

  it('takeDamage kills player at 0 HP', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(100);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(0);
    expect(state.phase).toBe('gameover');
  });

  it('takeDamage reduces HP considering armor', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(10);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(90);
  });

  it('spawnEnemy and removeEnemy work', () => {
    useGameStore.getState().startRun();
    const enemy = {
      id: '1',
      definitionId: 'drone',
      position: { x: 5, y: 0, z: 5 },
      hp: 20,
      maxHp: 20,
    };
    useGameStore.getState().spawnEnemy(enemy);
    expect(useGameStore.getState().enemies).toHaveLength(1);
    expect(useGameStore.getState().enemies[0]?.id).toBe('1');

    useGameStore.getState().removeEnemy('1');
    expect(useGameStore.getState().enemies).toHaveLength(0);
  });

  it('tick advances elapsed time', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().tick(1.5);
    expect(useGameStore.getState().elapsedTime).toBeCloseTo(1.5);
  });

  it('tick triggers gameover at 300 seconds', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().tick(300);
    const state = useGameStore.getState();
    expect(state.phase).toBe('gameover');
    expect(state.elapsedTime).toBe(300);
  });

  it('movePlayer clamps to bounds', () => {
    useGameStore.getState().startRun();
    // Move far right: dx=1, dz=0, delta=100 → x = 0 + 1*5*100 = 500, clamped to 24
    useGameStore.getState().movePlayer(1, 0, 100);
    expect(useGameStore.getState().player.position.x).toBe(24);
  });

  it('selectLevelUpOption adds new weapon', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().selectLevelUpOption({
      type: 'new_weapon',
      weaponId: 'neon_whip',
      level: 1,
    });
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.weapons).toHaveLength(2);
  });

  it('selectLevelUpOption upgrades existing weapon', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().selectLevelUpOption({
      type: 'upgrade_weapon',
      weaponId: 'plasma_bolt',
      level: 2,
    });
    const state = useGameStore.getState();
    expect(state.weapons[0]?.level).toBe(2);
  });

  it('damageEnemy reduces enemy HP', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: '1',
      definitionId: 'drone',
      position: { x: 0, y: 0, z: 0 },
      hp: 20,
      maxHp: 20,
    });
    useGameStore.getState().damageEnemy('1', 5);
    expect(useGameStore.getState().enemies[0]?.hp).toBe(15);
  });
});
