import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  if (phase !== 'playing' && phase !== 'levelup') return null;

  const hpPercent = Math.max(0, hp / maxHp) * 100;
  const xpPercent = Math.max(0, xp / xpToNextLevel) * 100;
  const hpLow = hp / maxHp < 0.3;

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
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <div style={{ color: '#ff3366', fontSize: 14, marginBottom: 4 }}>
          HP: {Math.ceil(hp)} / {maxHp}
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
          top: 16,
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

      {/* Top-right: Kills */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#ffff00',
          fontSize: 16,
          fontWeight: 'bold',
        }}
      >
        KILLS: {killCount}
      </div>

      {/* Bottom-left: Weapons */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
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
    </div>
  );
}
