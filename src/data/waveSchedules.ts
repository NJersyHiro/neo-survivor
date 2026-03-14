import type { WaveEntry, StageWaveSchedule } from '../types';

function createStageSchedule(ids: {
  swarmer: string; fast: string; tank: string;
  ranged: string; elite: string; boss: string;
}): WaveEntry[] {
  return [
    // Min 0
    { enemies: [{ id: ids.swarmer, weight: 1 }], spawnInterval: 2.0, maxSpawnCount: 3, hpMultiplier: 1.0, spawnPattern: 'ring' },
    // Min 1
    { enemies: [{ id: ids.swarmer, weight: 1 }], spawnInterval: 1.8, maxSpawnCount: 4, hpMultiplier: 1.0, spawnPattern: 'ring' },
    // Min 2
    { enemies: [{ id: ids.swarmer, weight: 3 }, { id: ids.fast, weight: 1 }], spawnInterval: 1.6, maxSpawnCount: 5, hpMultiplier: 1.0, spawnPattern: 'ring' },
    // Min 3
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }], spawnInterval: 1.5, maxSpawnCount: 5, hpMultiplier: 1.0, spawnPattern: 'ring', bossId: ids.boss },
    // Min 4
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }], spawnInterval: 1.4, maxSpawnCount: 6, hpMultiplier: 1.0, spawnPattern: 'ring' },
    // Min 5
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }], spawnInterval: 1.3, maxSpawnCount: 6, hpMultiplier: 1.0, spawnPattern: 'cluster', bossId: ids.boss },
    // Min 6
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.2, maxSpawnCount: 7, hpMultiplier: 1.1, spawnPattern: 'ring' },
    // Min 7
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.2, maxSpawnCount: 7, hpMultiplier: 1.1, spawnPattern: 'cluster' },
    // Min 8
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.fast, weight: 2 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.1, maxSpawnCount: 8, hpMultiplier: 1.1, spawnPattern: 'ring' },
    // Min 9
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 2 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 8, hpMultiplier: 1.2, spawnPattern: 'cluster' },
    // Min 10
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 8, hpMultiplier: 1.2, spawnPattern: 'ring', bossId: ids.boss },
    // Min 11
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 1.0, maxSpawnCount: 9, hpMultiplier: 1.2, spawnPattern: 'line' },
    // Min 12
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 9, hpMultiplier: 1.3, spawnPattern: 'ring' },
    // Min 13
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 10, hpMultiplier: 1.3, spawnPattern: 'cluster' },
    // Min 14
    { enemies: [{ id: ids.swarmer, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.9, maxSpawnCount: 10, hpMultiplier: 1.3, spawnPattern: 'line' },
    // Min 15
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 10, hpMultiplier: 1.4, spawnPattern: 'ring', bossId: ids.boss },
    // Min 16
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 11, hpMultiplier: 1.4, spawnPattern: 'cluster' },
    // Min 17
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.8, maxSpawnCount: 11, hpMultiplier: 1.4, spawnPattern: 'line' },
    // Min 18
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.7, maxSpawnCount: 12, hpMultiplier: 1.5, spawnPattern: 'ring' },
    // Min 19
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 1 }], spawnInterval: 0.7, maxSpawnCount: 12, hpMultiplier: 1.5, spawnPattern: 'cluster' },
    // Min 20
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.7, maxSpawnCount: 13, hpMultiplier: 1.5, spawnPattern: 'ring', bossId: ids.boss },
    // Min 21
    { enemies: [{ id: ids.fast, weight: 2 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.6, maxSpawnCount: 13, hpMultiplier: 1.6, spawnPattern: 'line' },
    // Min 22
    { enemies: [{ id: ids.swarmer, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 2 }], spawnInterval: 0.6, maxSpawnCount: 14, hpMultiplier: 1.6, spawnPattern: 'cluster' },
    // Min 23
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.6, maxSpawnCount: 14, hpMultiplier: 1.7, spawnPattern: 'ring' },
    // Min 24
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 15, hpMultiplier: 1.7, spawnPattern: 'line' },
    // Min 25
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 15, hpMultiplier: 1.8, spawnPattern: 'ring', bossId: ids.boss },
    // Min 26
    { enemies: [{ id: ids.fast, weight: 1 }, { id: ids.tank, weight: 1 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.5, maxSpawnCount: 16, hpMultiplier: 1.8, spawnPattern: 'cluster' },
    // Min 27
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.ranged, weight: 1 }, { id: ids.elite, weight: 3 }], spawnInterval: 0.4, maxSpawnCount: 16, hpMultiplier: 1.9, spawnPattern: 'line' },
    // Min 28
    { enemies: [{ id: ids.tank, weight: 1 }, { id: ids.elite, weight: 4 }], spawnInterval: 0.4, maxSpawnCount: 18, hpMultiplier: 1.9, spawnPattern: 'ring' },
    // Min 29
    { enemies: [{ id: ids.tank, weight: 2 }, { id: ids.elite, weight: 4 }], spawnInterval: 0.4, maxSpawnCount: 20, hpMultiplier: 2.0, spawnPattern: 'cluster', bossId: ids.boss },
  ];
}

export const WAVE_SCHEDULES: Record<string, StageWaveSchedule> = {
  neon_district: {
    stageId: 'neon_district',
    waves: createStageSchedule({ swarmer: 'nd_drone', fast: 'nd_speeder', tank: 'nd_enforcer', ranged: 'nd_turret', elite: 'nd_elite', boss: 'nd_boss' }),
  },
  data_mines: {
    stageId: 'data_mines',
    waves: createStageSchedule({ swarmer: 'dm_crawler', fast: 'dm_glitch', tank: 'dm_golem', ranged: 'dm_laser', elite: 'dm_virus', boss: 'dm_boss' }),
  },
  orbital_station: {
    stageId: 'orbital_station',
    waves: createStageSchedule({ swarmer: 'os_probe', fast: 'os_interceptor', tank: 'os_mech', ranged: 'os_sentry', elite: 'os_commander', boss: 'os_boss' }),
  },
  core_nexus: {
    stageId: 'core_nexus',
    waves: createStageSchedule({ swarmer: 'cn_fragment', fast: 'cn_phaser', tank: 'cn_firewall', ranged: 'cn_sniper', elite: 'cn_kernel', boss: 'cn_boss' }),
  },
};
