import { useGameStore } from '../stores/useGameStore';
import { AUGMENTS } from '../data/augments';
import { SoundManager } from '../game/SoundManager';

const fontFamily = "'Courier New', monospace";

export default function AugmentScreen() {
  const phase = useGameStore((s) => s.phase);
  const augmentOptions = useGameStore((s) => s.augmentOptions);
  const activeAugments = useGameStore((s) => s.activeAugments);

  if (phase !== 'augment' || augmentOptions.length === 0) return null;

  const handleSelect = (id: string) => {
    SoundManager.buttonClick();
    useGameStore.getState().selectAugment(id);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, fontFamily,
    }}>
      <div style={{
        color: '#ff8800', fontSize: '1.5rem', fontWeight: 'bold',
        marginBottom: 8,
        textShadow: '0 0 20px #ff8800, 0 0 40px #ff8800',
        fontFamily,
      }}>
        CYBER AUGMENT
      </div>
      <div style={{
        color: '#888', fontSize: '0.8rem', marginBottom: 24, fontFamily,
      }}>
        {activeAugments.length}/{3} — Choose an augment for this run
      </div>

      <div style={{
        display: 'flex', gap: '1rem', justifyContent: 'center',
        flexWrap: 'wrap', padding: '0 16px',
      }}>
        {augmentOptions.map((id) => {
          const def = AUGMENTS[id];
          if (!def) return null;
          return (
            <div
              key={id}
              onTouchEnd={(e) => { e.preventDefault(); handleSelect(id); }}
              onClick={() => handleSelect(id)}
              style={{
                border: '1px solid #ff8800',
                borderRadius: 12,
                background: 'rgba(20, 10, 0, 0.9)',
                padding: '1.5rem',
                width: 200,
                cursor: 'pointer',
                fontFamily,
                color: '#ffffff',
                touchAction: 'manipulation',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  borderColor: '#ffaa44',
                  boxShadow: '0 0 15px #ff880080',
                });
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  borderColor: '#ff8800',
                  boxShadow: 'none',
                });
              }}
            >
              <div style={{
                fontSize: '1.1rem', fontWeight: 'bold',
                marginBottom: 8, color: '#ff8800', fontFamily,
              }}>
                {def.name}
              </div>
              <div style={{
                fontSize: '0.8rem', color: '#cccccc',
                lineHeight: 1.4, fontFamily,
              }}>
                {def.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
