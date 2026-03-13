import { useMetaStore } from '../stores/useMetaStore';
import { UPGRADES, ALL_UPGRADE_IDS, getUpgradeCost } from '../data/upgrades';
import { CHARACTERS, ALL_CHARACTER_IDS, MAX_CHARACTER_LEVEL, getCharacterUpgradeCost } from '../data/characters';
import { SoundManager } from '../game/SoundManager';

export default function ShopScreen() {
  const credits = useMetaStore((s) => s.credits);
  const upgrades = useMetaStore((s) => s.upgrades);
  const unlockedIds = useMetaStore((s) => s.unlockedIds);
  const characterLevels = useMetaStore((s) => s.characterLevels);

  return (
    <div style={{
      flex: 1, padding: '24px 16px', paddingBottom: 'calc(var(--sab) + 24px)',
      width: '100%', maxWidth: 600, overflow: 'auto',
      WebkitOverflowScrolling: 'touch' as const,
    }}>
      {/* Credits */}
      <div style={{
        color: '#ffff00', fontSize: 18, fontWeight: 'bold',
        textShadow: '0 0 10px #ffff00', textAlign: 'center', marginBottom: 16,
      }}>
        {credits} CR
      </div>
      {/* Stat Upgrades */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {ALL_UPGRADE_IDS.map((id) => {
          const def = UPGRADES[id]!;
          const level = upgrades[id] ?? 0;
          const isMaxed = level >= def.maxLevel;
          const cost = isMaxed ? 0 : getUpgradeCost(id, level + 1);
          const canAfford = credits >= cost;

          return (
            <div key={id} style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${isMaxed ? '#00ff88' : '#00ffff'}`,
              borderRadius: 8, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {def.name}
              </div>
              <div style={{ color: '#888', fontSize: 11, flex: 1 }}>
                {def.description}
              </div>
              <div style={{ color: '#00ff88', fontSize: 12 }}>
                Lv {level}/{def.maxLevel}
              </div>
              {isMaxed ? (
                <div style={{
                  color: '#00ff88', fontSize: 14, fontWeight: 'bold',
                  textAlign: 'center', padding: '6px 0',
                }}>
                  MAX
                </div>
              ) : (
                <button
                  onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().purchaseUpgrade(id); }}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#00ffff' : 'transparent',
                    color: canAfford ? '#000' : '#ff4444',
                    border: `1px solid ${canAfford ? '#00ffff' : '#ff4444'}`,
                    borderRadius: 4, padding: '6px 0', fontSize: 13,
                    fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                    cursor: canAfford ? 'pointer' : 'default',
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  {cost} CR
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Character Upgrades */}
      <div style={{
        color: '#ff88ff', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12,
        textShadow: '0 0 10px #ff88ff',
      }}>
        CHARACTERS
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {ALL_CHARACTER_IDS.filter((id) => unlockedIds.includes(id)).map((id) => {
          const def = CHARACTERS[id]!;
          const level = characterLevels[id] ?? 0;
          const isMaxed = level >= MAX_CHARACTER_LEVEL;
          const cost = isMaxed ? 0 : getCharacterUpgradeCost(level + 1);
          const canAfford = credits >= cost;

          return (
            <div key={id} style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${isMaxed ? '#00ff88' : '#ff88ff'}`,
              borderRadius: 8, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {def.name}
              </div>
              <div style={{ color: '#888', fontSize: 11, flex: 1 }}>
                {def.description}
              </div>
              <div style={{ color: '#00ff88', fontSize: 12 }}>
                Lv {level}/{MAX_CHARACTER_LEVEL}
              </div>
              {isMaxed ? (
                <div style={{
                  color: '#00ff88', fontSize: 14, fontWeight: 'bold',
                  textAlign: 'center', padding: '6px 0',
                }}>
                  MAX
                </div>
              ) : (
                <button
                  onClick={() => { SoundManager.buttonClick(); useMetaStore.getState().upgradeCharacter(id); }}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#ff88ff' : 'transparent',
                    color: canAfford ? '#000' : '#ff4444',
                    border: `1px solid ${canAfford ? '#ff88ff' : '#ff4444'}`,
                    borderRadius: 4, padding: '6px 0', fontSize: 13,
                    fontWeight: 'bold', fontFamily: "'Courier New', monospace",
                    cursor: canAfford ? 'pointer' : 'default',
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  {cost} CR
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
