import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { CHARACTERS, ALL_CHARACTER_IDS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import ShopScreen from './ShopScreen';
import { SoundManager } from '../game/SoundManager';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const credits = useMetaStore((s) => s.credits);
  const stats = useMetaStore((s) => s.stats);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const selectedCharacterId = useMetaStore((s) => s.selectedCharacterId);
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
        position: 'absolute', top: 'calc(var(--sat) + 16px)', right: 24, color: '#ffff00',
        fontSize: 18, fontWeight: 'bold', textShadow: '0 0 10px #ffff00',
      }}>
        {credits} CR
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 'calc(var(--sat) + 16px)' }}>
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
          justifyContent: 'center', gap: 24, width: '100%', padding: '0 16px',
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
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff', marginTop: 16,
          }}>
            START RUN
          </button>

          {/* Character Selection */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
            padding: '8px 0', justifyContent: 'center', flexWrap: 'wrap',
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
                    background: isUnlocked ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${isSelected ? '#00ffff' : isUnlocked ? '#444' : '#222'}`,
                    borderRadius: 8, padding: '10px 12px', width: 100, textAlign: 'center',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.5,
                    boxShadow: isSelected ? '0 0 15px #00ffff' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    color: isUnlocked ? '#fff' : '#666', fontSize: 13, fontWeight: 'bold',
                    marginBottom: 4,
                  }}>
                    {def.name}
                  </div>
                  <div style={{ color: '#00ffff', fontSize: 10, marginBottom: 4 }}>
                    {weaponName}
                  </div>
                  {!isUnlocked && (
                    <>
                      <div style={{ color: '#888', fontSize: 9, marginBottom: 4 }}>
                        {def.unlockCondition?.description ?? ''}
                      </div>
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
                          borderRadius: 4, padding: '2px 8px', fontSize: 10,
                          fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                          cursor: credits >= def.creditCost ? 'pointer' : 'default',
                          opacity: credits >= def.creditCost ? 1 : 0.5,
                        }}
                      >
                        {def.creditCost} CR
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 16, color: '#888', fontSize: 14 }}>
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
