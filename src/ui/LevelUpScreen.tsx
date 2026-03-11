import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';
import type { LevelUpOption } from '../types';

const fontFamily = "'Courier New', monospace";

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  fontFamily,
};

const titleStyle: React.CSSProperties = {
  color: '#00ffff',
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
  fontFamily,
};

const cardsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #00ffff',
  borderRadius: '12px',
  background: 'rgba(10, 10, 30, 0.9)',
  padding: '1.5rem',
  width: '220px',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily,
  color: '#ffffff',
};

function OptionCard({
  option,
  onClick,
}: {
  option: LevelUpOption;
  onClick: () => void;
}) {
  const weapon = WEAPONS[option.weaponId];
  if (!weapon) return null;

  const isNew = option.type === 'new_weapon';
  const damage = weapon.baseDamage + weapon.damagePerLevel * (option.level - 1);

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, {
          borderColor: '#ff00ff',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
        });
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          borderColor: '#00ffff',
          boxShadow: 'none',
        });
      }}
    >
      <div
        style={{
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          color: isNew ? '#00ff88' : '#ffaa00',
          fontFamily,
        }}
      >
        {isNew ? 'NEW' : `Lv ${option.level}`}
      </div>
      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#00ffff',
          fontFamily,
        }}
      >
        {weapon.name}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: '#aaaaaa',
          marginBottom: '0.75rem',
          lineHeight: '1.3',
          fontFamily,
        }}
      >
        {weapon.description}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#888888', fontFamily }}>
        <div>DMG: {damage}</div>
        <div>CD: {weapon.cooldown.toFixed(1)}s</div>
        <div>TYPE: {weapon.category.toUpperCase()}</div>
      </div>
    </div>
  );
}

export default function LevelUpScreen() {
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.player.level);
  const options = useGameStore((s) => s.levelUpOptions);
  const selectLevelUpOption = useGameStore((s) => s.selectLevelUpOption);

  if (phase !== 'levelup') return null;

  return (
    <div style={overlayStyle}>
      <div style={titleStyle}>LEVEL {level}</div>
      <div style={cardsContainerStyle}>
        {options.map((option, i) => (
          <OptionCard
            key={`${option.weaponId}-${i}`}
            option={option}
            onClick={() => selectLevelUpOption(option)}
          />
        ))}
      </div>
    </div>
  );
}
