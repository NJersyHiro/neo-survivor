import { useGameStore } from '../stores/useGameStore';

export interface AugmentModifiers {
  mightMultiplier: number;       // glass_cannon, berserker_chip
  damageTakenMultiplier: number; // glass_cannon
  critMultiplier: number;        // critical_overload (3x instead of 2x)
  extraPierce: number;           // ricochet_protocol
  areaMultiplier: number;        // quantum_field
  cooldownMultiplier: number;    // overclock_burst
  creditMultiplier: number;      // scavenger_core
  magnetMultiplier: number;      // magnetic_storm
  speedMultiplier: number;       // adrenaline_rush (conditional)
  extraAmount: number;           // rapid_fire (multishot only)
  extraLifesteal: number;        // vampiric_edge
  xpMultiplier: number;          // xp_amplifier
  dropRateMultiplier: number;    // lucky_star
  recoveryPerSecond: number;     // second_wind
  extraArmor: number;            // shield_generator
  maxHpMultiplier: number;       // fortify
  hasNanoHeal: boolean;          // nano_heal
  hasDataSurge: boolean;         // data_surge
  hasChainLightning: boolean;    // chain_lightning
  hasTreasureHunter: boolean;    // treasure_hunter
}

const DEFAULT_MODIFIERS: AugmentModifiers = {
  mightMultiplier: 1,
  damageTakenMultiplier: 1,
  critMultiplier: 2,
  extraPierce: 0,
  areaMultiplier: 1,
  cooldownMultiplier: 1,
  creditMultiplier: 1,
  magnetMultiplier: 1,
  speedMultiplier: 1,
  extraAmount: 0,
  extraLifesteal: 0,
  xpMultiplier: 1,
  dropRateMultiplier: 1,
  recoveryPerSecond: 0,
  extraArmor: 0,
  maxHpMultiplier: 1,
  hasNanoHeal: false,
  hasDataSurge: false,
  hasChainLightning: false,
  hasTreasureHunter: false,
};

export function getAugmentModifiers(): AugmentModifiers {
  const augments = useGameStore.getState().activeAugments;
  if (augments.length === 0) return DEFAULT_MODIFIERS;

  const set = new Set(augments);
  const player = useGameStore.getState().player;
  const hpPercent = player.hp / player.maxHp;

  const mods = { ...DEFAULT_MODIFIERS };

  if (set.has('glass_cannon')) {
    mods.mightMultiplier *= 1.4;
    mods.damageTakenMultiplier *= 1.2;
  }
  if (set.has('berserker_chip') && hpPercent < 0.3) {
    mods.mightMultiplier *= 1.3;
  }
  if (set.has('critical_overload')) {
    mods.critMultiplier = 3;
  }
  if (set.has('ricochet_protocol')) {
    mods.extraPierce = 2;
  }
  if (set.has('quantum_field')) {
    mods.areaMultiplier = 1.3;
  }
  if (set.has('overclock_burst')) {
    mods.cooldownMultiplier = 0.85;
  }
  if (set.has('scavenger_core')) {
    mods.creditMultiplier = 1.5;
  }
  if (set.has('magnetic_storm')) {
    mods.magnetMultiplier = 2;
  }
  if (set.has('adrenaline_rush') && hpPercent < 0.5) {
    mods.speedMultiplier = 1.2;
  }
  if (set.has('rapid_fire')) {
    mods.extraAmount = 1;
  }
  if (set.has('vampiric_edge')) {
    mods.extraLifesteal = 3;
  }
  if (set.has('xp_amplifier')) {
    mods.xpMultiplier = 1.25;
  }
  if (set.has('lucky_star')) {
    mods.dropRateMultiplier = 2;
  }
  if (set.has('second_wind')) {
    mods.recoveryPerSecond = 0.01; // 1% max HP per second
  }
  if (set.has('shield_generator')) {
    mods.extraArmor = 3;
  }
  if (set.has('fortify')) {
    mods.maxHpMultiplier = 1.2;
  }
  if (set.has('nano_heal')) {
    mods.hasNanoHeal = true;
  }
  if (set.has('data_surge')) {
    mods.hasDataSurge = true;
  }
  if (set.has('chain_lightning')) {
    mods.hasChainLightning = true;
  }
  if (set.has('treasure_hunter')) {
    mods.hasTreasureHunter = true;
  }

  return mods;
}
