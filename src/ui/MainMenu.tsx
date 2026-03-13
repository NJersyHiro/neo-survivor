import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { CHARACTERS, ALL_CHARACTER_IDS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { SaveManager } from '../game/SaveManager';
import ShopScreen from './ShopScreen';
import { SoundManager } from '../game/SoundManager';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const scrollStyle: React.CSSProperties = {
  flex: 1, width: '100%', overflow: 'auto',
  WebkitOverflowScrolling: 'touch' as const,
};

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const credits = useMetaStore((s) => s.credits);
  const stats = useMetaStore((s) => s.stats);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const selectedCharacterId = useMetaStore((s) => s.selectedCharacterId);
  const [tab, setTab] = useState<'play' | 'shop' | 'achievements'>('play');

  useEffect(() => {
    void useMetaStore.getState().load();
  }, []);

  if (phase !== 'menu') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#000', fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
    }}>
      {/* Credits */}
      <div style={{
        position: 'absolute', top: 'calc(var(--sat) + 16px)', right: 24, color: '#ffff00',
        fontSize: 18, fontWeight: 'bold', textShadow: '0 0 10px #ffff00', zIndex: 1,
      }}>
        {credits} CR
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginTop: 'calc(var(--sat) + 16px)',
        flexShrink: 0,
      }}>
        {(['play', 'shop', 'achievements'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid #00ffff' : '2px solid transparent',
            color: tab === t ? '#00ffff' : '#666',
            fontSize: 14, fontWeight: 'bold', fontFamily: "'Courier New', monospace",
            padding: '12px 16px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* PLAY Tab */}
      {tab === 'play' && (
        <div style={{
          ...scrollStyle,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, padding: '20px 16px',
        }}>
          <div style={{
            color: '#00ffff', fontSize: 48, fontWeight: 'bold',
            textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
            letterSpacing: 4, textAlign: 'center',
          }}>
            NEO SURVIVOR
          </div>
          <button onClick={() => { SoundManager.unlock(); SoundManager.buttonClick(); useGameStore.getState().startRun(); }} style={{
            background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
            padding: '16px 64px', fontSize: 24, fontWeight: 'bold',
            fontFamily: "'Courier New', monospace", cursor: 'pointer',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
          }}>
            START RUN
          </button>

          {/* Character Selection */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
            width: '100%', maxWidth: 420, padding: '0 4px',
          }}>
            {ALL_CHARACTER_IDS.map((id) => {
              const def = CHARACTERS[id]!;
              const isUnlocked = unlockedIds.includes(id);
              const isSelected = selectedCharacterId === id;
              const weaponName = WEAPONS[def.startingWeaponId]?.name ?? def.startingWeaponId;

              return (
                <div
                  key={id}
                  onClick={() => {
                    if (isUnlocked) {
                      SoundManager.buttonClick();
                      useMetaStore.getState().selectCharacter(id);
                    }
                  }}
                  style={{
                    background: isSelected ? '#112233' : '#111122',
                    border: `2px solid ${isSelected ? '#00ffff' : isUnlocked ? '#444' : '#333'}`,
                    borderRadius: 8, padding: '8px 6px', textAlign: 'center',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    boxShadow: isSelected ? '0 0 12px #00ffff' : 'none',
                    opacity: isUnlocked ? 1 : 0.5,
                  }}
                >
                  <div style={{
                    color: isUnlocked ? '#fff' : '#888', fontSize: 12, fontWeight: 'bold',
                    marginBottom: 2,
                  }}>
                    {def.name}
                  </div>
                  <div style={{ color: '#00ffff', fontSize: 9, marginBottom: isUnlocked ? 0 : 4 }}>
                    {weaponName}
                  </div>
                  {!isUnlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundManager.buttonClick();
                        useMetaStore.getState().unlockCharacter(id);
                      }}
                      disabled={credits < def.creditCost}
                      style={{
                        background: credits >= def.creditCost ? '#ffff00' : 'transparent',
                        color: credits >= def.creditCost ? '#000' : '#ff4444',
                        border: `1px solid ${credits >= def.creditCost ? '#ffff00' : '#ff4444'}`,
                        borderRadius: 4, padding: '2px 6px', fontSize: 9,
                        fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                        cursor: credits >= def.creditCost ? 'pointer' : 'default',
                        opacity: credits >= def.creditCost ? 1 : 0.6,
                        width: '100%',
                      }}
                    >
                      {def.creditCost} CR
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 24, color: '#888', fontSize: 13 }}>
            <span>Runs: {stats.totalRuns}</span>
            <span>Kills: {stats.totalKills}</span>
            <span>Time: {formatTime(stats.totalTimePlayed)}</span>
          </div>

          {/* Debug */}
          <div style={{ marginTop: 16, marginBottom: 'calc(var(--sab) + 16px)', display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                SoundManager.buttonClick();
                useMetaStore.setState({ unlockedIds: [...ALL_CHARACTER_IDS] });
                const s = useMetaStore.getState();
                void SaveManager.save({
                  version: 2, credits: s.credits, upgrades: s.upgrades,
                  stats: { ...s.stats }, unlockedIds: [...ALL_CHARACTER_IDS],
                  selectedCharacterId: s.selectedCharacterId,
                  characterLevels: { ...s.characterLevels },
                });
              }}
              style={{
                background: 'transparent', color: '#ff4444', border: '1px solid #ff4444',
                borderRadius: 4, padding: '6px 12px', fontSize: 11,
                fontFamily: "'Courier New', monospace", cursor: 'pointer',
              }}
            >
              UNLOCK ALL
            </button>
            <button
              onClick={() => {
                SoundManager.buttonClick();
                useMetaStore.getState().addCredits(10000);
              }}
              style={{
                background: 'transparent', color: '#ffff00', border: '1px solid #ffff00',
                borderRadius: 4, padding: '6px 12px', fontSize: 11,
                fontFamily: "'Courier New', monospace", cursor: 'pointer',
              }}
            >
              +10000 CR
            </button>
          </div>
        </div>
      )}

      {/* SHOP Tab */}
      {tab === 'shop' && <ShopScreen />}

      {/* ACHIEVEMENTS Tab */}
      {tab === 'achievements' && (
        <div style={{
          ...scrollStyle,
          padding: '24px 16px', paddingBottom: 'calc(var(--sab) + 24px)',
          maxWidth: 500,
        }}>
          <div style={{
            color: '#ffaa00', fontSize: 18, fontWeight: 'bold', marginBottom: 16,
            textShadow: '0 0 10px #ffaa00', textAlign: 'center',
          }}>
            CHARACTER UNLOCKS
          </div>

          {ALL_CHARACTER_IDS.filter((id) => CHARACTERS[id]?.unlockCondition).map((id) => {
            const def = CHARACTERS[id]!;
            const cond = def.unlockCondition!;
            const isUnlocked = unlockedIds.includes(id);
            const current = stats[cond.stat as keyof typeof stats] as number ?? 0;
            const progress = Math.min(current / cond.threshold, 1);

            return (
              <div key={id} style={{
                background: '#111122',
                border: `1px solid ${isUnlocked ? '#00ff88' : '#333'}`,
                borderRadius: 8, padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
                    {def.name}
                  </div>
                  {isUnlocked ? (
                    <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 'bold' }}>UNLOCKED</div>
                  ) : (
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {Math.floor(current)} / {cond.threshold}
                    </div>
                  )}
                </div>
                <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
                  {cond.description}
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 8, background: 'rgba(255,255,255,0.08)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(isUnlocked ? 1 : progress) * 100}%`, height: '100%',
                    background: isUnlocked ? '#00ff88' : '#ffaa00',
                    borderRadius: 4, transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })}

          {/* Lifetime Stats */}
          <div style={{
            color: '#00ffff', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12,
            textShadow: '0 0 8px #00ffff',
          }}>
            LIFETIME STATS
          </div>
          <div style={{
            background: '#111122', border: '1px solid #333',
            borderRadius: 8, padding: 14,
          }}>
            {[
              ['Total Runs', stats.totalRuns],
              ['Total Kills', stats.totalKills],
              ['Total Time', formatTime(stats.totalTimePlayed)],
              ['Total Damage Taken', stats.totalDamageTaken],
              ['Total Boss Kills', stats.totalBossKills],
              ['Total XP Gems', stats.totalXPGemsCollected],
              ['Best Survival Time', formatTime(stats.bestTime)],
              ['Best Level', stats.bestLevel],
            ].map(([label, value]) => (
              <div key={label as string} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid #222',
              }}>
                <span style={{ color: '#888', fontSize: 13 }}>{label}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
