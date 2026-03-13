import { useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { WEAPONS } from '../data/weapons';
import { CHARACTERS } from '../data/characters';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ResultsScreen() {
  const phase = useGameStore((s) => s.phase);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const killCount = useGameStore((s) => s.killCount);
  const level = useGameStore((s) => s.player.level);
  const weapons = useGameStore((s) => s.weapons);
  const creditsEarned = useGameStore((s) => s.creditsEarned);
  const damageTaken = useGameStore((s) => s.damageTaken);
  const bossKills = useGameStore((s) => s.bossKills);
  const xpGemsCollected = useGameStore((s) => s.xpGemsCollected);
  const [unlockedNames, setUnlockedNames] = useState<string[]>([]);

  if (phase !== 'gameover') return null;

  const survived = elapsedTime >= 900;
  const titleText = survived ? 'SYSTEM SURVIVED' : 'SYSTEM TERMINATED';
  const titleColor = survived ? '#00ff88' : '#ff3366';
  const runEndBonus = Math.floor(50 + killCount * 0.5 + elapsedTime * 0.2);
  const totalCredits = creditsEarned + runEndBonus;

  const handleEnd = (action: 'retry' | 'menu') => {
    useMetaStore.getState().recordRunStats(killCount, elapsedTime, totalCredits, {
      damageTaken,
      bossKills,
      xpGemsCollected,
      playerLevel: level,
    });
    const newlyUnlocked = useMetaStore.getState().checkUnlocks();
    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map((id) => CHARACTERS[id]?.name ?? id);
      setUnlockedNames(names);
      setTimeout(() => {
        setUnlockedNames([]);
        if (action === 'retry') {
          useGameStore.getState().startRun();
        } else {
          useGameStore.getState().reset();
        }
      }, 2000);
      return;
    }
    if (action === 'retry') {
      useGameStore.getState().startRun();
    } else {
      useGameStore.getState().reset();
    }
  };

  if (unlockedNames.length > 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(0, 0, 0, 0.95)',
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{
          color: '#ffff00', fontSize: 28, fontWeight: 'bold', marginBottom: 16,
          textShadow: '0 0 20px #ffff00, 0 0 40px #ffff00',
        }}>
          CHARACTER UNLOCKED!
        </div>
        {unlockedNames.map((name) => (
          <div key={name} style={{
            color: '#00ffff', fontSize: 36, fontWeight: 'bold',
            textShadow: '0 0 20px #00ffff',
          }}>
            {name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(0, 0, 0, 0.85)',
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        color: titleColor, fontSize: 40, fontWeight: 'bold', marginBottom: 16,
        textShadow: `0 0 20px ${titleColor}, 0 0 40px ${titleColor}`,
        textAlign: 'center', width: '100%',
      }}>
        {titleText}
      </div>

      <div style={{ color: '#00ffff', fontSize: 22, marginBottom: 32 }}>
        Time: {formatTime(elapsedTime)}
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #ffff00',
          borderRadius: 8, padding: '16px 32px', textAlign: 'center',
        }}>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>KILLS</div>
          <div style={{ color: '#ffff00', fontSize: 36, fontWeight: 'bold' }}>{killCount}</div>
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88',
          borderRadius: 8, padding: '16px 32px', textAlign: 'center',
        }}>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>LEVEL</div>
          <div style={{ color: '#00ff88', fontSize: 36, fontWeight: 'bold' }}>{level}</div>
        </div>
      </div>

      <div style={{
        color: '#ffff00', fontSize: 18, marginBottom: 32,
        textShadow: '0 0 10px #ffff00',
      }}>
        +{totalCredits} CR (drops: {creditsEarned} + bonus: {runEndBonus})
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {weapons.map((w) => {
          const def = WEAPONS[w.definitionId];
          return (
            <div key={w.definitionId} style={{
              background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ffff',
              borderRadius: 4, padding: '8px 12px', textAlign: 'center',
              color: '#fff', fontSize: 13,
            }}>
              <div>{def?.name ?? w.definitionId}</div>
              <div style={{ color: '#00ff88', fontSize: 11, marginTop: 4 }}>Lv {w.level}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={() => handleEnd('retry')} style={{
          background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
          padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
          boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
        }}>
          RETRY
        </button>
        <button onClick={() => handleEnd('menu')} style={{
          background: 'transparent', color: '#00ffff',
          border: '2px solid #00ffff', borderRadius: 8,
          padding: '12px 48px', fontSize: 20, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
        }}>
          MENU
        </button>
      </div>
    </div>
  );
}
