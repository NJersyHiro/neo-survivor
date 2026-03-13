import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS, EVOLVED_WEAPON_IDS } from '../data/weapons';
import { ITEMS } from '../data/items';
import { getComputedStats } from '../hooks/useComputedStats';
import { SoundManager } from '../game/SoundManager';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function abbreviate(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 3) + parts[1]!.charAt(0)).toUpperCase();
  }
  return name.slice(0, 4).toUpperCase();
}

export default function HUD() {
  const phase = useGameStore((s) => s.phase);
  const hp = useGameStore((s) => s.player.hp);
  const maxHp = useGameStore((s) => s.player.maxHp);
  const level = useGameStore((s) => s.player.level);
  const xp = useGameStore((s) => s.player.xp);
  const xpToNextLevel = useGameStore((s) => s.player.xpToNextLevel);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const killCount = useGameStore((s) => s.killCount);
  const weapons = useGameStore((s) => s.weapons);
  const items = useGameStore((s) => s.items);

  const [evolutionMsg, setEvolutionMsg] = useState<string | null>(null);
  const prevEvolvedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentEvolvedIds = new Set(
      weapons
        .map((w) => w.definitionId)
        .filter((id) => EVOLVED_WEAPON_IDS.includes(id))
    );

    for (const id of currentEvolvedIds) {
      if (!prevEvolvedIdsRef.current.has(id)) {
        const def = WEAPONS[id];
        setEvolutionMsg(`EVOLVED: ${def?.name ?? id}!`);
        const timer = setTimeout(() => setEvolutionMsg(null), 3000);
        prevEvolvedIdsRef.current = currentEvolvedIds;
        return () => clearTimeout(timer);
      }
    }

    prevEvolvedIdsRef.current = currentEvolvedIds;
  }, [weapons]);

  if (phase !== 'playing' && phase !== 'levelup') return null;

  const stats = getComputedStats();
  const effectiveMaxHp = maxHp * (1 + stats.maxHp / 100);
  const hpPercent = Math.min(100, Math.max(0, hp / effectiveMaxHp) * 100);
  const xpPercent = Math.max(0, xp / xpToNextLevel) * 100;
  const hpLow = hp / effectiveMaxHp < 0.3;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Top-left: HP + Level */}
      <div style={{ position: 'absolute', top: 'calc(var(--sat) + 16px)', left: 16 }}>
        <div style={{ color: '#ff3366', fontSize: 14, marginBottom: 4 }}>
          HP: {Math.ceil(hp)} / {Math.round(effectiveMaxHp)}
        </div>
        <div
          style={{
            width: 200,
            height: 8,
            background: '#333',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: hpLow ? '#ff0000' : '#ff3366',
              transition: 'width 0.2s',
            }}
          />
        </div>
        <div style={{ color: '#00ff88', fontSize: 14, marginBottom: 4 }}>
          Lv {level}
        </div>
        <div
          style={{
            width: 200,
            height: 8,
            background: '#333',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${xpPercent}%`,
              height: '100%',
              background: '#00ff88',
              transition: 'width 0.2s',
            }}
          />
        </div>
      </div>

      {/* Top-center: Timer */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--sat) + 4px)',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#00ffff',
          fontSize: 28,
          fontWeight: 'bold',
          textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
        }}
      >
        {formatTime(elapsedTime)}
      </div>

      {/* Top-right: Kills + Menu */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--sat) + 16px)',
          right: 16,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ color: '#ffff00', fontSize: 16, fontWeight: 'bold' }}>
          KILLS: {killCount}
        </div>
        <button
          onClick={() => {
            SoundManager.buttonClick();
            useGameStore.getState().reset();
          }}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#888', border: '1px solid #444',
            borderRadius: 4, padding: '4px 10px', fontSize: 11,
            fontWeight: 'bold', fontFamily: "'Courier New', monospace",
            cursor: 'pointer',
          }}
        >
          MENU
        </button>
      </div>

      {/* Evolution notification banner */}
      {evolutionMsg && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(var(--sat) + 60px)',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#ffd700',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 0 10px #ffd700, 0 0 20px #ffd700',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #ffd700',
            borderRadius: 8,
            padding: '8px 24px',
            whiteSpace: 'nowrap',
          }}
        >
          {evolutionMsg}
        </div>
      )}

      {/* Bottom-left: Weapons */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(var(--sab) + 48px)',
          left: 16,
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        {weapons.map((w) => {
          const def = WEAPONS[w.definitionId];
          return (
            <div
              key={w.definitionId}
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid #00ffff',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#fff',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              <div>{def?.name ?? w.definitionId}</div>
              <div style={{ color: '#00ff88', fontSize: 10 }}>Lv {w.level}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom-left: Passive Items (below weapons) */}
      {items.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(var(--sab) + 16px)',
            left: 16,
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {items.map((item) => {
            const def = ITEMS[item.definitionId];
            const abbr = def ? abbreviate(def.name) : item.definitionId.slice(0, 4).toUpperCase();
            return (
              <div
                key={item.definitionId}
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid #ff00ff',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: '#ff00ff',
                  fontSize: 11,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {abbr} {item.level}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
