import { useGameStore } from '../stores/useGameStore';
import { SoundManager } from '../game/SoundManager';

export default function PauseScreen() {
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'paused') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 500, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'rgba(0, 0, 0, 0.85)',
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        color: '#00ffff', fontSize: 32, fontWeight: 'bold',
        textShadow: '0 0 20px #00ffff',
        marginBottom: 16,
      }}>
        PAUSED
      </div>

      <button
        onTouchEnd={(e) => {
          e.preventDefault();
          SoundManager.buttonClick();
          useGameStore.getState().setPhase('playing');
        }}
        onClick={() => {
          SoundManager.buttonClick();
          useGameStore.getState().setPhase('playing');
        }}
        style={{
          background: '#00ffff', color: '#000', border: 'none', borderRadius: 8,
          padding: '14px 48px', fontSize: 18, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
          boxShadow: '0 0 16px #00ffff',
          touchAction: 'manipulation',
        }}
      >
        RESUME
      </button>

      <button
        onTouchEnd={(e) => {
          e.preventDefault();
          SoundManager.buttonClick();
          useGameStore.getState().reset();
        }}
        onClick={() => {
          SoundManager.buttonClick();
          useGameStore.getState().reset();
        }}
        style={{
          background: 'transparent', color: '#ff4444',
          border: '2px solid #ff4444', borderRadius: 8,
          padding: '12px 48px', fontSize: 16, fontWeight: 'bold',
          fontFamily: "'Courier New', monospace", cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        QUIT TO MENU
      </button>
    </div>
  );
}
