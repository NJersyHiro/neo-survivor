import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useMetaStore } from '../stores/useMetaStore';
import { CHARACTERS, ALL_CHARACTER_IDS } from '../data/characters';
import { WEAPONS, BASE_WEAPON_IDS } from '../data/weapons';
import { ALL_ITEM_IDS, ITEMS } from '../data/items';
import { STAGES, ALL_STAGE_IDS } from '../data/stages';
import { SaveManager } from '../game/SaveManager';
import ShopScreen from './ShopScreen';
import CodexScreen from './CodexScreen';
import { SoundManager } from '../game/SoundManager';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function GameModeSelector() {
  const selectedGameMode = useMetaStore((s) => s.selectedGameMode);

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      <button
        onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().setGameMode('survival'); }}
        style={{
          background: selectedGameMode === 'survival' ? '#00ffff' : 'transparent',
          color: selectedGameMode === 'survival' ? '#000' : '#00ffff',
          border: '2px solid #00ffff',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: "'Courier New', monospace",
          cursor: 'pointer',
          boxShadow: selectedGameMode === 'survival' ? '0 0 12px #00ffff' : 'none',
        }}
      >
        SURVIVAL
      </button>
      <button
        onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().setGameMode('endless'); }}
        style={{
          background: selectedGameMode === 'endless' ? '#ff4444' : 'transparent',
          color: selectedGameMode === 'endless' ? '#000' : '#ff4444',
          border: '2px solid #ff4444',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: "'Courier New', monospace",
          cursor: 'pointer',
          boxShadow: selectedGameMode === 'endless' ? '0 0 12px #ff4444' : 'none',
        }}
      >
        ENDLESS
      </button>
    </div>
  );
}

export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const stats = useMetaStore((s) => s.stats);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const selectedCharacterId = useMetaStore((s) => s.selectedCharacterId);
  const unlockedStageIds = useMetaStore((s) => s.unlockedStageIds);
  const selectedStageId = useMetaStore((s) => s.selectedStageId);
  const hyperModeStageIds = useMetaStore((s) => s.hyperModeStageIds);
  const unlockedWeaponIds = useMetaStore((s) => s.unlockedWeaponIds);
  const unlockedItemIds = useMetaStore((s) => s.unlockedItemIds);
  const [tab, setTab] = useState<'play' | 'shop' | 'achievements'>('play');
  const [showCodex, setShowCodex] = useState(false);
  const [hyperEnabled, setHyperEnabled] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    characters: true, weapons: false, items: false, stages: false,
  });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Swipe to change tabs — only on tab bar, not on scrollable content
  const TABS = ['play', 'shop', 'achievements'] as const;
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onTabSwipeStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) swipeStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTabSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    setTab((prev) => {
      const idx = TABS.indexOf(prev);
      if (dx < 0 && idx < TABS.length - 1) return TABS[idx + 1]!;
      if (dx > 0 && idx > 0) return TABS[idx - 1]!;
      return prev;
    });
  }, []);

  useEffect(() => {
    void useMetaStore.getState().load();
  }, []);

  if (phase !== 'menu') return null;

  // Show codex as full overlay when open
  if (showCodex) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 300, display: 'flex', flexDirection: 'column',
        background: '#000', fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', marginTop: 'calc(var(--sat) + 8px)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => { SoundManager.buttonClick(); setShowCodex(false); }}
            style={{
              background: 'transparent', border: '1px solid #666',
              color: '#888', borderRadius: 4, padding: '6px 12px',
              fontSize: 12, fontWeight: 'bold', fontFamily: "'Courier New', monospace",
              cursor: 'pointer',
            }}
          >
            BACK
          </button>
          <div style={{
            color: '#00ffff', fontSize: 18, fontWeight: 'bold',
            textShadow: '0 0 10px #00ffff',
          }}>
            CODEX
          </div>
          <div style={{ width: 60 }} />
        </div>
        <CodexScreen />
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTabSwipeStart}
      onTouchEnd={onTabSwipeEnd}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: '#000', fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginTop: 'calc(var(--sat) + 16px)',
        flexShrink: 0,
      }}>
        {TABS.map((t) => (
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
          flex: 1, width: '100%', overflow: 'auto',
          WebkitOverflowScrolling: 'touch' as const,
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
          {/* Game Mode Selector */}
          <GameModeSelector />

          <button onClick={() => { SoundManager.unlock(); SoundManager.buttonClick(); useMetaStore.getState().setHyperModeActive(hyperEnabled && hyperModeStageIds.includes(selectedStageId)); useGameStore.getState().startRun(); }} style={{
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
                  {!isUnlocked && def.unlockCondition && (
                    <div style={{ color: '#888', fontSize: 8, marginTop: 2 }}>
                      {def.unlockCondition.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage Select */}
          <div style={{
            color: '#00ffff', fontSize: 14, fontWeight: 'bold',
            textShadow: '0 0 8px #00ffff', textAlign: 'center',
          }}>
            STAGE
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
            width: '100%', maxWidth: 420, padding: '0 4px',
          }}>
            {ALL_STAGE_IDS.map((id) => {
              const def = STAGES[id]!;
              const isUnlocked = unlockedStageIds.includes(id);
              const isSelected = selectedStageId === id;
              return (
                <div
                  key={id}
                  onClick={() => {
                    if (isUnlocked) {
                      SoundManager.buttonClick();
                      useMetaStore.getState().selectStage(id);
                    }
                  }}
                  style={{
                    background: isSelected ? '#112233' : '#111122',
                    border: `2px solid ${isSelected ? '#00ffff' : isUnlocked ? '#444' : '#222'}`,
                    borderRadius: 6, padding: '6px 4px', textAlign: 'center',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.4,
                    boxShadow: isSelected ? '0 0 10px #00ffff' : 'none',
                  }}
                >
                  <div style={{ color: isUnlocked ? '#fff' : '#666', fontSize: 10, fontWeight: 'bold' }}>
                    {def.name}
                  </div>
                  {!isUnlocked && def.unlockCondition && (
                    <div style={{ color: '#888', fontSize: 8, marginTop: 2 }}>
                      {def.unlockCondition.description}
                    </div>
                  )}
                  {hyperModeStageIds.includes(id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundManager.buttonClick();
                        setHyperEnabled(!hyperEnabled);
                      }}
                      style={{
                        background: hyperEnabled ? '#ff0000' : 'transparent',
                        color: hyperEnabled ? '#fff' : '#ff0000',
                        border: '1px solid #ff0000',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fontFamily: "'Courier New', monospace",
                        cursor: 'pointer',
                        marginTop: 4,
                      }}
                    >
                      HYPER
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
                useMetaStore.setState({
                  unlockedIds: [...ALL_CHARACTER_IDS],
                  unlockedWeaponIds: [...BASE_WEAPON_IDS],
                  unlockedItemIds: [...ALL_ITEM_IDS],
                  unlockedStageIds: [...ALL_STAGE_IDS],
                });
                const s = useMetaStore.getState();
                void SaveManager.save({
                  version: 3, credits: s.credits, upgrades: s.upgrades,
                  stats: { ...s.stats }, unlockedIds: [...ALL_CHARACTER_IDS],
                  selectedCharacterId: s.selectedCharacterId,
                  characterLevels: { ...s.characterLevels },
                  unlockedWeaponIds: [...BASE_WEAPON_IDS],
                  unlockedItemIds: [...ALL_ITEM_IDS],
                  unlockedStageIds: [...ALL_STAGE_IDS],
                  hyperModeStageIds: [...(s.hyperModeStageIds ?? [])],
                  selectedStageId: s.selectedStageId ?? 'neon_district',
                  perCharacterStats: { ...(s.perCharacterStats ?? {}) },
                  perWeaponStats: { ...(s.perWeaponStats ?? {}) },
                  perStageStats: { ...(s.perStageStats ?? {}) },
                  encounteredEnemyIds: [...(s.encounteredEnemyIds ?? [])],
                  selectedGameMode: s.selectedGameMode,
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
            <button
              onClick={() => {
                SoundManager.buttonClick();
                if (confirm('Reset all progress?')) {
                  useMetaStore.getState().resetAll();
                }
              }}
              style={{
                background: 'transparent', color: '#ff0000', border: '1px solid #ff0000',
                borderRadius: 4, padding: '6px 12px', fontSize: 11,
                fontFamily: "'Courier New', monospace", cursor: 'pointer',
              }}
            >
              RESET ALL
            </button>
          </div>
        </div>
      )}

      {/* SHOP Tab */}
      {tab === 'shop' && <ShopScreen />}

      {/* ACHIEVEMENTS Tab */}
      {tab === 'achievements' && (
        <div style={{
          flex: 1, width: '100%', overflow: 'auto',
          WebkitOverflowScrolling: 'touch' as const,
          padding: '24px 16px', paddingBottom: 'calc(var(--sab) + 24px)',
          maxWidth: 500,
        }}>
          {/* CODEX BUTTON */}
          <button
            onClick={() => { SoundManager.buttonClick(); setShowCodex(true); }}
            style={{
              width: '100%', background: '#0a0a2e',
              border: '2px solid #00ffff', borderRadius: 8,
              padding: '14px 16px', marginBottom: 20,
              color: '#00ffff', fontSize: 16, fontWeight: 'bold',
              fontFamily: "'Courier New', monospace", cursor: 'pointer',
              textShadow: '0 0 8px #00ffff',
              boxShadow: '0 0 12px rgba(0, 255, 255, 0.2)',
            }}
          >
            CODEX
          </button>

          {/* CHARACTER UNLOCKS header */}
          <div onClick={() => toggleSection('characters')} style={{
            color: '#ffaa00', fontSize: 16, fontWeight: 'bold', marginBottom: 8,
            textShadow: '0 0 10px #ffaa00', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>CHARACTER UNLOCKS</span>
            <span>{openSections.characters ? '▼' : '▶'}</span>
          </div>
          {openSections.characters && (
            <>
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
            </>
          )}

          {/* WEAPON UNLOCKS */}
          <div onClick={() => toggleSection('weapons')} style={{
            color: '#ff6644', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8,
            textShadow: '0 0 10px #ff6644', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>WEAPON UNLOCKS ({unlockedWeaponIds.length}/{BASE_WEAPON_IDS.length})</span>
            <span>{openSections.weapons ? '▼' : '▶'}</span>
          </div>
          {openSections.weapons && (
            <>
              {BASE_WEAPON_IDS.filter((id) => WEAPONS[id]?.unlockCondition).map((id) => {
                const def = WEAPONS[id]!;
                const isUnlocked = unlockedWeaponIds.includes(id);
                return (
                  <div key={id} style={{
                    background: '#111122',
                    border: `1px solid ${isUnlocked ? '#00ff88' : '#333'}`,
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ color: isUnlocked ? '#fff' : '#888', fontSize: 13, fontWeight: 'bold' }}>
                        {def.name}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                        {def.unlockCondition!.description}
                      </div>
                    </div>
                    <div style={{ color: isUnlocked ? '#00ff88' : '#666', fontSize: 12, fontWeight: 'bold' }}>
                      {isUnlocked ? '✓' : '✗'}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ITEM UNLOCKS */}
          <div onClick={() => toggleSection('items')} style={{
            color: '#aa88ff', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8,
            textShadow: '0 0 10px #aa88ff', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>ITEM UNLOCKS ({unlockedItemIds.length}/{ALL_ITEM_IDS.length})</span>
            <span>{openSections.items ? '▼' : '▶'}</span>
          </div>
          {openSections.items && (
            <>
              {ALL_ITEM_IDS.filter((id) => ITEMS[id]?.unlockCondition).map((id) => {
                const def = ITEMS[id]!;
                const isUnlocked = unlockedItemIds.includes(id);
                return (
                  <div key={id} style={{
                    background: '#111122',
                    border: `1px solid ${isUnlocked ? '#00ff88' : '#333'}`,
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ color: isUnlocked ? '#fff' : '#888', fontSize: 13, fontWeight: 'bold' }}>
                        {def.name}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                        {def.unlockCondition!.description}
                      </div>
                    </div>
                    <div style={{ color: isUnlocked ? '#00ff88' : '#666', fontSize: 12, fontWeight: 'bold' }}>
                      {isUnlocked ? '✓' : '✗'}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* STAGE UNLOCKS */}
          <div onClick={() => toggleSection('stages')} style={{
            color: '#44aaff', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8,
            textShadow: '0 0 10px #44aaff', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>STAGE UNLOCKS ({unlockedStageIds.length}/{ALL_STAGE_IDS.length})</span>
            <span>{openSections.stages ? '▼' : '▶'}</span>
          </div>
          {openSections.stages && (
            <>
              {ALL_STAGE_IDS.filter((id) => STAGES[id]?.unlockCondition).map((id) => {
                const def = STAGES[id]!;
                const isUnlocked = unlockedStageIds.includes(id);
                return (
                  <div key={id} style={{
                    background: '#111122',
                    border: `1px solid ${isUnlocked ? '#00ff88' : '#333'}`,
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ color: isUnlocked ? '#fff' : '#888', fontSize: 13, fontWeight: 'bold' }}>
                        {def.name}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                        {def.unlockCondition!.description}
                      </div>
                    </div>
                    <div style={{ color: isUnlocked ? '#00ff88' : '#666', fontSize: 12, fontWeight: 'bold' }}>
                      {isUnlocked ? '✓' : '✗'}
                    </div>
                  </div>
                );
              })}
            </>
          )}

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
              ['Total Damage Taken', Math.round(stats.totalDamageTaken)],
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
