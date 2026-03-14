import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore, xpForLevel } from '../useGameStore';
import { useMetaStore } from '../useMetaStore';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useMetaStore.setState({
      selectedCharacterId: 'kai',
      unlockedIds: ['kai'],
      characterLevels: {},
      unlockedWeaponIds: ['plasma_bolt'],
      unlockedItemIds: ['energy_cell', 'shield_matrix', 'magnet_implant'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct defaults', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe('menu');
    expect(state.player.hp).toBe(100);
    expect(state.player.maxHp).toBe(100);
    expect(state.player.level).toBe(1);
    expect(state.player.speed).toBe(3.3);
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
    const startHp = useGameStore.getState().player.hp;
    useGameStore.getState().takeDamage(startHp);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(0);
    expect(state.phase).toBe('gameover');
  });

  it('takeDamage reduces HP considering armor', () => {
    useGameStore.getState().startRun();
    const startHp = useGameStore.getState().player.hp;
    useGameStore.getState().takeDamage(10);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(startHp - 10);
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

  it('tick triggers gameover at 1800 seconds', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().tick(1800);
    const state = useGameStore.getState();
    expect(state.phase).toBe('gameover');
    expect(state.elapsedTime).toBe(1800);
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

  it('startRun initializes items and tool counts', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.items).toEqual([]);
    expect(state.rerollCount).toBe(3);
    expect(state.skipCount).toBe(3);
    expect(state.banishCount).toBe(3);
    expect(state.banishedIds).toEqual([]);
  });

  it('selectLevelUpOption adds new item', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().selectLevelUpOption({
      type: 'new_item', itemId: 'energy_cell', level: 1,
    });
    const state = useGameStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.definitionId).toBe('energy_cell');
    expect(state.phase).toBe('playing');
  });

  it('selectLevelUpOption upgrades existing item', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().selectLevelUpOption({
      type: 'new_item', itemId: 'energy_cell', level: 1,
    });
    useGameStore.getState().selectLevelUpOption({
      type: 'upgrade_item', itemId: 'energy_cell', level: 2,
    });
    expect(useGameStore.getState().items[0]?.level).toBe(2);
  });

  it('skip resumes playing and decrements count', () => {
    useGameStore.getState().startRun();
    const xpNeeded = xpForLevel(1);
    useGameStore.getState().addXP(xpNeeded);
    expect(useGameStore.getState().phase).toBe('levelup');
    useGameStore.getState().skip();
    expect(useGameStore.getState().phase).toBe('playing');
    expect(useGameStore.getState().skipCount).toBe(2);
  });

  it('reroll generates new options and decrements count', () => {
    useGameStore.getState().startRun();
    const xpNeeded = xpForLevel(1);
    useGameStore.getState().addXP(xpNeeded);
    expect(useGameStore.getState().phase).toBe('levelup');
    useGameStore.getState().reroll();
    expect(useGameStore.getState().rerollCount).toBe(2);
    expect(useGameStore.getState().levelUpOptions.length).toBeGreaterThan(0);
  });

  it('banish adds ID to banished list', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().banish('neon_whip');
    expect(useGameStore.getState().banishedIds).toContain('neon_whip');
    expect(useGameStore.getState().banishCount).toBe(2);
  });

  it('startRun initializes creditsEarned and reviveCount', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.creditsEarned).toBe(0);
    expect(state.reviveCount).toBe(0);
  });

  it('damageEnemy accumulates credits on kill', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: '1', definitionId: 'drone',
      position: { x: 0, y: 0, z: 0 }, hp: 10, maxHp: 10,
    });
    useGameStore.getState().damageEnemy('1', 20);
    expect(useGameStore.getState().creditsEarned).toBeGreaterThan(0);
  });

  it('takeDamage triggers revival instead of gameover when reviveCount > 0', () => {
    useGameStore.getState().startRun();
    useGameStore.setState({ reviveCount: 1 });
    useGameStore.getState().takeDamage(200);
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.player.hp).toBeGreaterThan(0);
    expect(state.reviveCount).toBe(0);
  });

  it('takeDamage triggers gameover when no revives left', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(200);
    expect(useGameStore.getState().phase).toBe('gameover');
  });

  it('damageEnemy removes dead enemies and increments killCount', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: '1',
      definitionId: 'drone',
      position: { x: 0, y: 0, z: 0 },
      hp: 10,
      maxHp: 10,
    });
    useGameStore.getState().spawnEnemy({
      id: '2',
      definitionId: 'drone',
      position: { x: 5, y: 0, z: 5 },
      hp: 10,
      maxHp: 10,
    });
    expect(useGameStore.getState().killCount).toBe(0);

    // Kill enemy 1
    useGameStore.getState().damageEnemy('1', 20);
    expect(useGameStore.getState().enemies).toHaveLength(1);
    expect(useGameStore.getState().killCount).toBe(1);

    // Kill enemy 2
    useGameStore.getState().damageEnemy('2', 10);
    expect(useGameStore.getState().enemies).toHaveLength(0);
    expect(useGameStore.getState().killCount).toBe(2);
  });

  it('startRun uses selected character starting weapon', () => {
    useMetaStore.setState({
      selectedCharacterId: 'vex',
      unlockedIds: ['kai', 'vex'],
      characterLevels: {},
    });
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.weapons[0]?.definitionId).toBe('neon_whip');
  });

  it('startRun applies character maxHp with upgrade level', () => {
    useMetaStore.setState({
      selectedCharacterId: 'tank',
      unlockedIds: ['kai', 'tank'],
      characterLevels: { tank: 2 },
    });
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    // Tank: baseMaxHp = 130 + 2*2 = 134
    // No shop upgrades, so effectiveMaxHp = 134
    expect(state.player.maxHp).toBe(134);
    expect(state.player.hp).toBe(134);
  });

  it('startRun initializes per-run counters to zero', () => {
    useGameStore.getState().startRun();
    const state = useGameStore.getState();
    expect(state.damageTaken).toBe(0);
    expect(state.bossKills).toBe(0);
    expect(state.xpGemsCollected).toBe(0);
  });

  it('takeDamage increments damageTaken counter', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().takeDamage(25);
    expect(useGameStore.getState().damageTaken).toBe(25);
  });

  it('damageEnemy increments bossKills on boss death', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnEnemy({
      id: 'b1', definitionId: 'sentinel',
      position: { x: 0, y: 0, z: 0 }, hp: 10, maxHp: 10,
    });
    useGameStore.getState().damageEnemy('b1', 20);
    expect(useGameStore.getState().bossKills).toBe(1);
  });

  it('damageEnemy applies crit damage when Math.random returns 0', () => {
    useGameStore.getState().startRun();
    // crit_module gives critChance: 8 per level
    useGameStore.setState({
      items: [{ definitionId: 'crit_module', level: 1 }],
    });
    useGameStore.getState().spawnEnemy({
      id: '1', definitionId: 'drone',
      position: { x: 0, y: 0, z: 0 }, hp: 100, maxHp: 100,
    });
    // Mock Math.random to return 0 → guaranteed crit (0 * 100 = 0 < 8)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().damageEnemy('1', 10);
    // Crit doubles damage: 10 * 2 = 20, so hp should be 80
    expect(useGameStore.getState().enemies[0]?.hp).toBe(80);
  });

  it('damageEnemy heals player via lifesteal', () => {
    useGameStore.getState().startRun();
    // Set player to 50 HP and give them a lifesteal item (reflux_core: lifesteal 5 per level)
    useGameStore.setState({
      player: { ...useGameStore.getState().player, hp: 50 },
      items: [{ definitionId: 'reflux_core', level: 1 }],
    });
    useGameStore.getState().spawnEnemy({
      id: '1', definitionId: 'drone',
      position: { x: 0, y: 0, z: 0 }, hp: 1000, maxHp: 1000,
    });
    // Mock Math.random to return 0.99 to avoid crit triggering
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const hpBefore = useGameStore.getState().player.hp;
    useGameStore.getState().damageEnemy('1', 100);
    const hpAfter = useGameStore.getState().player.hp;
    expect(hpAfter).toBeGreaterThan(hpBefore);
    expect(useGameStore.getState().hpRecovered).toBeGreaterThan(0);
  });

  it('generateLevelUpOptions filters by unlocked weapons only', () => {
    useMetaStore.setState({
      selectedCharacterId: 'kai',
      unlockedIds: ['kai'],
      characterLevels: {},
      unlockedWeaponIds: ['plasma_bolt'],
      unlockedItemIds: ['energy_cell'],
    });
    useGameStore.getState().startRun();
    // Trigger a level-up
    const xpNeeded = xpForLevel(1);
    useGameStore.getState().addXP(xpNeeded);
    const state = useGameStore.getState();
    expect(state.phase).toBe('levelup');
    // No new_weapon option should offer anything other than plasma_bolt
    // plasma_bolt is already owned so no new_weapon options expected
    const newWeaponOptions = state.levelUpOptions.filter(
      (o) => o.type === 'new_weapon' && o.weaponId !== 'plasma_bolt'
    );
    expect(newWeaponOptions).toHaveLength(0);
  });
});
