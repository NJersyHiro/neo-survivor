import { useMetaStore } from '../stores/useMetaStore';
import { UPGRADES, ALL_UPGRADE_IDS, getUpgradeCost } from '../data/upgrades';

export default function ShopScreen() {
  const credits = useMetaStore((s) => s.credits);
  const upgrades = useMetaStore((s) => s.upgrades);

  return (
    <div style={{
      flex: 1, padding: '24px 16px', width: '100%', maxWidth: 600, overflow: 'auto',
    }}>
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
                  onClick={() => useMetaStore.getState().purchaseUpgrade(id)}
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
    </div>
  );
}
