import type { UnlockCondition } from '../types';

export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: UnlockCondition | null;
  enemyPrefix: string;
  groundColor: string;
}

export const STAGES: Record<string, StageDefinition> = {
  neon_district: {
    id: 'neon_district', name: 'Neon District',
    description: 'City streets bathed in neon light.',
    unlockCondition: null,
    enemyPrefix: 'nd', groundColor: '#1a0a2e',
  },
  data_mines: {
    id: 'data_mines', name: 'Data Mines',
    description: 'Underground server caves crackling with energy.',
    unlockCondition: { type: 'reach_level', level: 20, stageId: 'neon_district', description: 'Reach Level 20 in Neon District' },
    enemyPrefix: 'dm', groundColor: '#0a1e0a',
  },
  orbital_station: {
    id: 'orbital_station', name: 'Orbital Station',
    description: 'Space station corridors with zero-gravity zones.',
    unlockCondition: { type: 'reach_level', level: 40, stageId: 'data_mines', description: 'Reach Level 40 in Data Mines' },
    enemyPrefix: 'os', groundColor: '#0a0a2e',
  },
  core_nexus: {
    id: 'core_nexus', name: 'Core Nexus',
    description: 'The digital void at the center of everything.',
    unlockCondition: { type: 'reach_level', level: 60, stageId: 'orbital_station', description: 'Reach Level 60 in Orbital Station' },
    enemyPrefix: 'cn', groundColor: '#2e0a0a',
  },
};

export const ALL_STAGE_IDS = Object.keys(STAGES);
