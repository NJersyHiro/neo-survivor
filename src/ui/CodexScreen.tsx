import { useState, useRef, useCallback } from 'react';
import { useMetaStore } from '../stores/useMetaStore';
import { ENEMIES } from '../data/enemies';
import { WEAPONS, BASE_WEAPON_IDS, EVOLVED_WEAPON_IDS } from '../data/weapons';
import { ITEMS, ALL_ITEM_IDS } from '../data/items';
import { STAGES, ALL_STAGE_IDS } from '../data/stages';

const CODEX_TABS = ['enemies', 'weapons', 'items', 'stages'] as const;
type CodexTab = typeof CODEX_TABS[number];

const TAB_COLORS: Record<CodexTab, string> = {
  enemies: '#ff3366',
  weapons: '#00ffff',
  items: '#ff00ff',
  stages: '#44aaff',
};

// Real enemy IDs (exclude backward-compatible aliases)
const REAL_ENEMY_IDS = Object.keys(ENEMIES).filter(
  (id) => !['drone', 'speeder', 'tank', 'sentinel'].includes(id)
);

const STAGE_PREFIXES: Record<string, string> = {
  nd: 'neon_district',
  dm: 'data_mines',
  os: 'orbital_station',
  cn: 'core_nexus',
};

function getEnemyStage(enemyId: string): string | null {
  const prefix = enemyId.split('_')[0] ?? '';
  return STAGE_PREFIXES[prefix] ?? null;
}

function EnemiesTab() {
  const encounteredIds = useMetaStore((s) => s.encounteredEnemyIds);

  // Group enemies by stage
  const grouped: Record<string, string[]> = {};
  for (const id of REAL_ENEMY_IDS) {
    const stageId = getEnemyStage(id);
    const key = stageId ?? 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(id);
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {ALL_STAGE_IDS.map((stageId) => {
        const stage = STAGES[stageId];
        const enemies = grouped[stageId] ?? [];
        if (enemies.length === 0) return null;
        return (
          <div key={stageId} style={{ marginBottom: 16 }}>
            <div style={{
              color: '#ffaa00', fontSize: 13, fontWeight: 'bold', marginBottom: 8,
              borderBottom: '1px solid #333', paddingBottom: 4,
            }}>
              {stage?.name ?? stageId}
            </div>
            {enemies.map((id) => {
              const encountered = encounteredIds.includes(id);
              const def = ENEMIES[id]!;
              return (
                <div key={id} style={{
                  background: '#111122', border: `1px solid ${encountered ? '#444' : '#222'}`,
                  borderRadius: 6, padding: 10, marginBottom: 6,
                  opacity: encountered ? 1 : 0.4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      color: encountered ? def.color : '#555',
                      fontSize: 13, fontWeight: 'bold',
                    }}>
                      {encountered ? def.name : '???'}
                    </div>
                    {def.isBoss && encountered && (
                      <div style={{ color: '#ff8800', fontSize: 10, fontWeight: 'bold' }}>BOSS</div>
                    )}
                    {def.isReaper && encountered && (
                      <div style={{ color: '#ff0000', fontSize: 10, fontWeight: 'bold' }}>REAPER</div>
                    )}
                  </div>
                  {encountered && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ color: '#888', fontSize: 11 }}>HP: {def.hp}</span>
                      <span style={{ color: '#888', fontSize: 11 }}>DMG: {def.damage}</span>
                      <span style={{ color: '#888', fontSize: 11 }}>SPD: {def.speed}</span>
                      {def.behavior && def.behavior !== 'chase' && (
                        <span style={{ color: '#ffaa00', fontSize: 11 }}>{def.behavior.toUpperCase()}</span>
                      )}
                      {def.shieldHp != null && (
                        <span style={{ color: '#00aaff', fontSize: 11 }}>SHIELD: {def.shieldHp}</span>
                      )}
                      {def.aura && def.aura !== 'none' && (
                        <span style={{ color: '#ff00ff', fontSize: 11 }}>AURA: {def.aura}</span>
                      )}
                      {def.onDeath && def.onDeath !== 'none' && (
                        <span style={{ color: '#ff4400', fontSize: 11 }}>ON DEATH: {def.onDeath}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {/* Other enemies (system_purge, null_entity) */}
      {(grouped['other'] ?? []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            color: '#ff0000', fontSize: 13, fontWeight: 'bold', marginBottom: 8,
            borderBottom: '1px solid #333', paddingBottom: 4,
          }}>
            SPECIAL
          </div>
          {(grouped['other'] ?? []).map((id) => {
            const encountered = encounteredIds.includes(id);
            const def = ENEMIES[id]!;
            return (
              <div key={id} style={{
                background: '#111122', border: `1px solid ${encountered ? '#444' : '#222'}`,
                borderRadius: 6, padding: 10, marginBottom: 6,
                opacity: encountered ? 1 : 0.4,
              }}>
                <div style={{ color: encountered ? def.color : '#555', fontSize: 13, fontWeight: 'bold' }}>
                  {encountered ? def.name : '???'}
                </div>
                {encountered && (
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                    SPD: {def.speed} | Unstoppable
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ color: '#555', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        {encounteredIds.length} / {REAL_ENEMY_IDS.length} encountered
      </div>
    </div>
  );
}

function WeaponsTab() {
  const unlockedWeaponIds = useMetaStore((s) => s.unlockedWeaponIds);

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{
        color: '#00ffff', fontSize: 13, fontWeight: 'bold', marginBottom: 8,
        borderBottom: '1px solid #333', paddingBottom: 4,
      }}>
        BASE WEAPONS
      </div>
      {BASE_WEAPON_IDS.map((id) => {
        const unlocked = unlockedWeaponIds.includes(id);
        const def = WEAPONS[id]!;
        const evolvedId = def.evolvesInto;
        const evolvedDef = evolvedId ? WEAPONS[evolvedId] : null;
        const evoItemDef = def.evolutionItemId ? ITEMS[def.evolutionItemId] : null;

        return (
          <div key={id} style={{
            background: '#111122', border: `1px solid ${unlocked ? '#444' : '#222'}`,
            borderRadius: 6, padding: 10, marginBottom: 6,
            opacity: unlocked ? 1 : 0.4,
          }}>
            <div style={{ color: unlocked ? '#fff' : '#555', fontSize: 13, fontWeight: 'bold' }}>
              {unlocked ? def.name : '???'}
            </div>
            {unlocked && (
              <>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{def.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ color: '#ff3366', fontSize: 11 }}>DMG: {def.baseDamage}</span>
                  <span style={{ color: '#00ff88', fontSize: 11 }}>CD: {def.cooldown}s</span>
                  <span style={{ color: '#ffaa00', fontSize: 11 }}>{def.category.toUpperCase()}</span>
                </div>
                {evolvedDef && (
                  <div style={{
                    marginTop: 8, padding: '6px 8px', background: '#0a0a1a',
                    border: '1px solid #ffd700', borderRadius: 4,
                  }}>
                    <div style={{ color: '#ffd700', fontSize: 11, fontWeight: 'bold' }}>
                      EVOLUTION
                    </div>
                    <div style={{ color: '#aaa', fontSize: 10, marginTop: 2 }}>
                      {def.name} (Lv 8) + {evoItemDef?.name ?? def.evolutionItemId}
                    </div>
                    <div style={{ color: '#ffd700', fontSize: 10, marginTop: 1 }}>
                      → {evolvedDef.name}
                    </div>
                    <div style={{ color: '#888', fontSize: 10, marginTop: 1 }}>
                      {evolvedDef.description}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <div style={{
        color: '#ffd700', fontSize: 13, fontWeight: 'bold', marginTop: 16, marginBottom: 8,
        borderBottom: '1px solid #333', paddingBottom: 4,
      }}>
        EVOLVED WEAPONS
      </div>
      {EVOLVED_WEAPON_IDS.map((id) => {
        const def = WEAPONS[id]!;
        // Find the base weapon that evolves into this
        const baseWeapon = BASE_WEAPON_IDS.find((bId) => WEAPONS[bId]?.evolvesInto === id);
        const baseDef = baseWeapon ? WEAPONS[baseWeapon] : null;
        const baseUnlocked = baseWeapon ? unlockedWeaponIds.includes(baseWeapon) : false;

        return (
          <div key={id} style={{
            background: '#111122', border: `1px solid ${baseUnlocked ? '#ffd700' : '#222'}`,
            borderRadius: 6, padding: 10, marginBottom: 6,
            opacity: baseUnlocked ? 1 : 0.4,
          }}>
            <div style={{ color: baseUnlocked ? '#ffd700' : '#555', fontSize: 13, fontWeight: 'bold' }}>
              {baseUnlocked ? def.name : '???'}
            </div>
            {baseUnlocked && (
              <>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{def.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ color: '#ff3366', fontSize: 11 }}>DMG: {def.baseDamage}</span>
                  <span style={{ color: '#00ff88', fontSize: 11 }}>CD: {def.cooldown}s</span>
                  <span style={{ color: '#ffaa00', fontSize: 11 }}>{def.category.toUpperCase()}</span>
                </div>
                {baseDef && (
                  <div style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>
                    From: {baseDef.name}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <div style={{ color: '#555', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        {unlockedWeaponIds.length} / {BASE_WEAPON_IDS.length} unlocked
      </div>
    </div>
  );
}

function ItemsTab() {
  const unlockedItemIds = useMetaStore((s) => s.unlockedItemIds);

  return (
    <div style={{ padding: '12px 16px' }}>
      {ALL_ITEM_IDS.map((id) => {
        const unlocked = unlockedItemIds.includes(id);
        const def = ITEMS[id]!;
        const statEntries = Object.entries(def.stats);

        return (
          <div key={id} style={{
            background: '#111122', border: `1px solid ${unlocked ? '#444' : '#222'}`,
            borderRadius: 6, padding: 10, marginBottom: 6,
            opacity: unlocked ? 1 : 0.4,
          }}>
            <div style={{ color: unlocked ? '#ff00ff' : '#555', fontSize: 13, fontWeight: 'bold' }}>
              {unlocked ? def.name : '???'}
            </div>
            {unlocked && (
              <>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{def.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  {statEntries.map(([stat, val]) => (
                    <span key={stat} style={{ color: '#00ff88', fontSize: 11 }}>
                      {stat}: {val! > 0 ? '+' : ''}{val}/lv
                    </span>
                  ))}
                  <span style={{ color: '#ffaa00', fontSize: 11 }}>Max Lv {def.maxLevel}</span>
                </div>
                {/* Show which weapon this item evolves */}
                {(() => {
                  const evolveWeapon = BASE_WEAPON_IDS.find((wId) => WEAPONS[wId]?.evolutionItemId === id);
                  if (!evolveWeapon) return null;
                  const wDef = WEAPONS[evolveWeapon]!;
                  const evolvedDef = wDef.evolvesInto ? WEAPONS[wDef.evolvesInto] : null;
                  if (!evolvedDef) return null;
                  return (
                    <div style={{ color: '#ffd700', fontSize: 10, marginTop: 4 }}>
                      Evolves {wDef.name} → {evolvedDef.name}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        );
      })}
      <div style={{ color: '#555', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        {unlockedItemIds.length} / {ALL_ITEM_IDS.length} unlocked
      </div>
    </div>
  );
}

function StagesTab() {
  const unlockedStageIds = useMetaStore((s) => s.unlockedStageIds);
  const encounteredIds = useMetaStore((s) => s.encounteredEnemyIds);
  const perStageStats = useMetaStore((s) => s.perStageStats);

  return (
    <div style={{ padding: '12px 16px' }}>
      {ALL_STAGE_IDS.map((id) => {
        const unlocked = unlockedStageIds.includes(id);
        const def = STAGES[id]!;
        const stageStats = perStageStats[id];
        const stageEnemies = REAL_ENEMY_IDS.filter((eId) => getEnemyStage(eId) === id);

        return (
          <div key={id} style={{
            background: '#111122', border: `1px solid ${unlocked ? '#444' : '#222'}`,
            borderRadius: 6, padding: 12, marginBottom: 8,
            opacity: unlocked ? 1 : 0.4,
          }}>
            <div style={{ color: unlocked ? '#44aaff' : '#555', fontSize: 14, fontWeight: 'bold' }}>
              {unlocked ? def.name : '???'}
            </div>
            {unlocked && (
              <>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{def.description}</div>
                {stageStats && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ color: '#00ff88', fontSize: 11 }}>Best Lv: {stageStats.bestLevel}</span>
                    <span style={{ color: '#00ff88', fontSize: 11 }}>
                      Best Time: {Math.floor(stageStats.bestTime / 60)}m {Math.floor(stageStats.bestTime % 60)}s
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: '#ffaa00', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                    ENEMIES ({stageEnemies.filter((eId) => encounteredIds.includes(eId)).length}/{stageEnemies.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {stageEnemies.map((eId) => {
                      const encountered = encounteredIds.includes(eId);
                      const eDef = ENEMIES[eId]!;
                      return (
                        <span key={eId} style={{
                          color: encountered ? eDef.color : '#333',
                          fontSize: 10, background: '#0a0a1a',
                          padding: '2px 6px', borderRadius: 3,
                          border: `1px solid ${encountered ? '#333' : '#1a1a1a'}`,
                        }}>
                          {encountered ? eDef.name : '???'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CodexScreen() {
  const [activeTab, setActiveTab] = useState<CodexTab>('enemies');

  // Swipe to change codex sub-tabs
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) swipeStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    setActiveTab((prev) => {
      const idx = CODEX_TABS.indexOf(prev);
      if (dx < 0 && idx < CODEX_TABS.length - 1) return CODEX_TABS[idx + 1]!;
      if (dx > 0 && idx > 0) return CODEX_TABS[idx - 1]!;
      return prev;
    });
  }, []);

  return (
    <div
      onTouchStart={onSwipeStart}
      onTouchEnd={onSwipeEnd}
      style={{
        flex: 1, width: '100%', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 0, flexShrink: 0,
        borderBottom: '1px solid #333',
      }}>
        {CODEX_TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: activeTab === t ? `2px solid ${TAB_COLORS[t]}` : '2px solid transparent',
            color: activeTab === t ? TAB_COLORS[t] : '#555',
            fontSize: 11, fontWeight: 'bold', fontFamily: "'Courier New', monospace",
            padding: '8px 4px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflow: 'auto',
        WebkitOverflowScrolling: 'touch' as const,
        paddingBottom: 'calc(var(--sab) + 16px)',
      }}>
        {activeTab === 'enemies' && <EnemiesTab />}
        {activeTab === 'weapons' && <WeaponsTab />}
        {activeTab === 'items' && <ItemsTab />}
        {activeTab === 'stages' && <StagesTab />}
      </div>
    </div>
  );
}
