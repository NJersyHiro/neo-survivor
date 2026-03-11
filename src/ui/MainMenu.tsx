import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import ShopScreen from './ShopScreen';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const credits = useMetaStore((s) => s.credits);
  const stats = useMetaStore((s) => s.stats);
  const [tab, setTab] = useState<'play' | 'shop'>('play');

  useEffect(() => {
    void useMetaStore.getState().load();
  }, []);

  if (phase !== 'menu') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.95)', fontFamily: "'Courier New', monospace",
      overflow: 'auto',
    }}>
      {/* Credits */}
      <div style={{
        position: 'absolute', top: 16, right: 24, color: '#ffff00',
        fontSize: 18, fontWeight: 'bold', textShadow: '0 0 10px #ffff00',
      }}>
        {credits} CR
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
        {(['play', 'shop'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid #00ffff' : '2px solid transparent',
            color: tab === t ? '#00ffff' : '#666',
            fontSize: 18, fontWeight: 'bold', fontFamily: "'Courier New', monospace",
            padding: '12px 32px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'play' ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 24,
        }}>
          <div style={{
            color: '#00ffff', fontSize: 48, fontWeight: 'bold',
            textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
            letterSpacing: 4, textAlign: 'center',
          }}>
            NEO SURVIVOR
          </div>
          <button onClick={() => useGameStore.getState().startRun()} style={{
            background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
            padding: '16px 64px', fontSize: 24, fontWeight: 'bold',
            fontFamily: "'Courier New', monospace", cursor: 'pointer',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff', marginTop: 16,
          }}>
            START RUN
          </button>
          <div style={{ display: 'flex', gap: 24, marginTop: 32, color: '#888', fontSize: 14 }}>
            <span>Runs: {stats.totalRuns}</span>
            <span>Kills: {stats.totalKills}</span>
            <span>Time: {formatTime(stats.totalTimePlayed)}</span>
          </div>
        </div>
      ) : (
        <ShopScreen />
      )}
    </div>
  );
}
