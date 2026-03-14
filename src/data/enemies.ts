import type { EnemyDefinition } from '../types';

export const ENEMIES: Record<string, EnemyDefinition> = {
  // === Neon District (Stage 1) — No special mechanics ===
  nd_drone: {
    id: 'nd_drone', name: 'Street Drone', hp: 20, damage: 5, speed: 2.5,
    xpValue: 1, color: '#ff3366', emissive: '#ff1144', scale: 0.5,
  },
  nd_speeder: {
    id: 'nd_speeder', name: 'Neon Runner', hp: 12, damage: 4, speed: 5.0,
    xpValue: 2, color: '#00ff88', emissive: '#00cc66', scale: 0.35,
  },
  nd_enforcer: {
    id: 'nd_enforcer', name: 'Enforcer', hp: 80, damage: 10, speed: 1.2,
    xpValue: 5, color: '#8844ff', emissive: '#6622cc', scale: 0.8,
  },
  nd_turret: {
    id: 'nd_turret', name: 'Street Turret', hp: 30, damage: 3, speed: 1.0,
    xpValue: 3, color: '#ffaa00', emissive: '#cc8800', scale: 0.6,
    behavior: 'ranged', projectileDamage: 8, projectileSpeed: 8,
    projectileInterval: 2.0, attackRange: 10,
  },
  nd_elite: {
    id: 'nd_elite', name: 'Neon Elite', hp: 120, damage: 12, speed: 2.0,
    xpValue: 8, color: '#ff00ff', emissive: '#cc00cc', scale: 0.7,
  },
  nd_boss: {
    id: 'nd_boss', name: 'Circuit Breaker', hp: 800, damage: 15, speed: 1.5,
    xpValue: 50, color: '#ff8800', emissive: '#ff6600', scale: 1.2,
    isBoss: true, bossScale: 2.5,
  },

  // === Data Mines (Stage 2) — Enemies gain abilities ===
  dm_crawler: {
    id: 'dm_crawler', name: 'Crawler', hp: 30, damage: 7, speed: 2.8,
    xpValue: 2, color: '#44ff44', emissive: '#22cc22', scale: 0.5,
  },
  dm_glitch: {
    id: 'dm_glitch', name: 'Glitch', hp: 18, damage: 5, speed: 4.5,
    xpValue: 3, color: '#00ffff', emissive: '#00cccc', scale: 0.4,
    behavior: 'teleport_chase', teleportInterval: 4,
  },
  dm_golem: {
    id: 'dm_golem', name: 'Data Golem', hp: 150, damage: 12, speed: 1.0,
    xpValue: 8, color: '#666699', emissive: '#444477', scale: 0.9,
    shieldHp: 50, shieldRegenDelay: 3,
  },
  dm_laser: {
    id: 'dm_laser', name: 'Laser Node', hp: 45, damage: 4, speed: 0.8,
    xpValue: 5, color: '#ff4444', emissive: '#cc2222', scale: 0.55,
    behavior: 'ranged', projectileDamage: 12, projectileSpeed: 10,
    projectileInterval: 1.8, attackRange: 12,
  },
  dm_virus: {
    id: 'dm_virus', name: 'Virus Elite', hp: 180, damage: 15, speed: 2.2,
    xpValue: 12, color: '#88ff00', emissive: '#66cc00', scale: 0.7,
  },
  dm_boss: {
    id: 'dm_boss', name: 'Data Worm', hp: 1500, damage: 20, speed: 1.8,
    xpValue: 80, color: '#00ff00', emissive: '#00cc00', scale: 1.5,
    isBoss: true, bossScale: 3.0,
  },

  // === Orbital Station (Stage 3) — Faster, deadlier ===
  os_probe: {
    id: 'os_probe', name: 'Probe', hp: 40, damage: 9, speed: 3.2,
    xpValue: 3, color: '#aaaaff', emissive: '#8888cc', scale: 0.45,
  },
  os_interceptor: {
    id: 'os_interceptor', name: 'Interceptor', hp: 25, damage: 7, speed: 5.5,
    xpValue: 4, color: '#ff88ff', emissive: '#cc66cc', scale: 0.4,
  },
  os_mech: {
    id: 'os_mech', name: 'Heavy Mech', hp: 250, damage: 15, speed: 1.0,
    xpValue: 12, color: '#888888', emissive: '#666666', scale: 1.0,
    onDeath: 'explode', explosionDamage: 20, explosionRadius: 2.0,
  },
  os_sentry: {
    id: 'os_sentry', name: 'Plasma Sentry', hp: 60, damage: 5, speed: 0.6,
    xpValue: 7, color: '#ff6644', emissive: '#cc4422', scale: 0.6,
    behavior: 'ranged', projectileDamage: 15, projectileSpeed: 12,
    projectileInterval: 1.5, attackRange: 14,
  },
  os_commander: {
    id: 'os_commander', name: 'Commander', hp: 300, damage: 18, speed: 2.5,
    xpValue: 15, color: '#ffdd00', emissive: '#ccaa00', scale: 0.8,
    aura: 'buff_damage', auraValue: 0.25, auraRadius: 3,
  },
  os_boss: {
    id: 'os_boss', name: 'Station Core', hp: 3000, damage: 25, speed: 1.2,
    xpValue: 120, color: '#ffffff', emissive: '#aaaaaa', scale: 1.8,
    isBoss: true, bossScale: 3.5,
  },

  // === Core Nexus (Stage 4) — Maximum danger ===
  cn_fragment: {
    id: 'cn_fragment', name: 'Fragment', hp: 50, damage: 12, speed: 3.0,
    xpValue: 4, color: '#ff2222', emissive: '#cc0000', scale: 0.45,
    aura: 'heal_allies', auraValue: 2, auraRadius: 3,
  },
  cn_phaser: {
    id: 'cn_phaser', name: 'Phase Runner', hp: 35, damage: 10, speed: 6.0,
    xpValue: 6, color: '#22ffff', emissive: '#00cccc', scale: 0.4,
    behavior: 'teleport_chase', teleportInterval: 3,
  },
  cn_firewall: {
    id: 'cn_firewall', name: 'Firewall', hp: 400, damage: 20, speed: 0.8,
    xpValue: 15, color: '#ff4400', emissive: '#cc3300', scale: 1.1,
    shieldHp: 100, shieldRegenDelay: 2,
  },
  cn_sniper: {
    id: 'cn_sniper', name: 'Code Sniper', hp: 80, damage: 8, speed: 0.5,
    xpValue: 10, color: '#4444ff', emissive: '#2222cc', scale: 0.55,
    behavior: 'ranged', projectileDamage: 20, projectileSpeed: 14,
    projectileInterval: 1.2, attackRange: 16,
  },
  cn_kernel: {
    id: 'cn_kernel', name: 'Kernel Elite', hp: 500, damage: 25, speed: 2.0,
    xpValue: 20, color: '#ffff00', emissive: '#cccc00', scale: 0.85,
    aura: 'buff_damage', auraValue: 0.40, auraRadius: 3,
  },
  cn_boss: {
    id: 'cn_boss', name: 'Nexus Guardian', hp: 6000, damage: 30, speed: 1.5,
    xpValue: 200, color: '#ff0044', emissive: '#cc0033', scale: 2.0,
    isBoss: true, bossScale: 4.0,
  },

  // === Kill Screen Entities ===
  system_purge: {
    id: 'system_purge', name: 'System Purge', hp: 65535, damage: 65535, speed: 4.0,
    xpValue: 0, color: '#ffffff', emissive: '#ff0000', scale: 3.0,
    isReaper: true,
  },
  null_entity: {
    id: 'null_entity', name: 'Null Entity', hp: 999999, damage: 65535, speed: 4.0,
    xpValue: 0, color: '#000000', emissive: '#ff0000', scale: 3.0,
    isReaper: true,
  },
};

// Backward-compatible aliases for old enemy IDs
ENEMIES['drone'] = ENEMIES['nd_drone']!;
ENEMIES['speeder'] = ENEMIES['nd_speeder']!;
ENEMIES['tank'] = ENEMIES['nd_enforcer']!;
ENEMIES['sentinel'] = ENEMIES['nd_boss']!;

export const SWARMER_ID = 'nd_drone';
