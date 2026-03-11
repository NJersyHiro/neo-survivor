import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { WEAPONS } from '../data/weapons';
import { ITEMS } from '../data/items';
import type { LevelUpOption } from '../types';
import { SoundManager } from '../game/SoundManager';

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

const STAT_LABELS: Record<string, string> = {
  might: 'Might',
  armor: 'Armor',
  maxHp: 'Max HP',
  recovery: 'Recovery',
  speed: 'Speed',
  area: 'Area',
  cooldown: 'Cooldown',
  amount: 'Amount',
  moveSpeed: 'Move Speed',
  magnet: 'Magnet',
  luck: 'Luck',
  growth: 'Growth',
};

function OptionCard({
  option,
  onClick,
  banishMode,
}: {
  option: LevelUpOption;
  onClick: () => void;
  banishMode: boolean;
}) {
  const isItem = option.type === 'new_item' || option.type === 'upgrade_item';
  const id = isItem ? option.itemId : option.weaponId;
  const def = isItem ? (id ? ITEMS[id] : undefined) : (id ? WEAPONS[id] : undefined);
  const accentColor = isItem ? '#ff00ff' : '#00ffff';

  if (!def) return null;

  const isNew = option.type === 'new_weapon' || option.type === 'new_item';
  const borderColor = banishMode ? '#ff0044' : accentColor;

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    borderRadius: '12px',
    background: 'rgba(10, 10, 30, 0.9)',
    padding: '1.5rem',
    width: '220px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily,
    color: '#ffffff',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        const hoverColor = banishMode ? '#ff0044' : '#ff00ff';
        Object.assign(e.currentTarget.style, {
          borderColor: hoverColor,
          boxShadow: `0 0 15px ${hoverColor}80`,
        });
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          borderColor: borderColor,
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
          color: accentColor,
          fontFamily,
        }}
      >
        {def.name}
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
        {def.description}
      </div>
      {isItem && 'stats' in def && (
        <div style={{ fontSize: '0.75rem', color: '#dd88ff', fontFamily }}>
          {Object.entries((def as { stats: Record<string, number> }).stats).map(([key, val]) => (
            <div key={key}>
              {STAT_LABELS[key] ?? key}: {val > 0 ? '+' : ''}{val}/Lv
            </div>
          ))}
        </div>
      )}
      {!isItem && 'baseDamage' in def && (
        <div style={{ fontSize: '0.75rem', color: '#888888', fontFamily }}>
          <div>DMG: {(def as { baseDamage: number; damagePerLevel: number }).baseDamage + (def as { baseDamage: number; damagePerLevel: number }).damagePerLevel * (option.level - 1)}</div>
          <div>CD: {(def as { cooldown: number }).cooldown.toFixed(1)}s</div>
          <div>TYPE: {(def as { category: string }).category.toUpperCase()}</div>
        </div>
      )}
      {banishMode && (
        <div
          style={{
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            color: '#ff0044',
            fontFamily,
            textAlign: 'center',
          }}
        >
          CLICK TO BANISH
        </div>
      )}
    </div>
  );
}

export default function LevelUpScreen() {
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.player.level);
  const options = useGameStore((s) => s.levelUpOptions);
  const selectLevelUpOption = useGameStore((s) => s.selectLevelUpOption);
  const rerollCount = useGameStore((s) => s.rerollCount);
  const skipCount = useGameStore((s) => s.skipCount);
  const banishCount = useGameStore((s) => s.banishCount);

  const [banishMode, setBanishMode] = useState(false);

  // Reset banish mode when level-up screen appears
  useEffect(() => {
    if (phase === 'levelup') {
      setBanishMode(false);
    }
  }, [phase]);

  if (phase !== 'levelup') return null;

  const handleCardClick = (option: LevelUpOption) => {
    if (banishMode) {
      const isItem = option.type === 'new_item' || option.type === 'upgrade_item';
      const id = isItem ? option.itemId : option.weaponId;
      if (id) {
        useGameStore.getState().banish(id);
        setBanishMode(false);
        // Reroll to get new options without the banished item
        useGameStore.getState().reroll();
      }
      return;
    }
    SoundManager.buttonClick();
    selectLevelUpOption(option);
  };

  return (
    <div style={overlayStyle}>
      <div style={titleStyle}>LEVEL {level}</div>
      <div style={cardsContainerStyle}>
        {options.map((option, i) => (
          <OptionCard
            key={`${option.weaponId ?? option.itemId}-${i}`}
            option={option}
            onClick={() => handleCardClick(option)}
            banishMode={banishMode}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => useGameStore.getState().reroll()}
          disabled={rerollCount <= 0}
          style={{
            background: 'transparent',
            border: '1px solid #00ffff',
            color: '#00ffff',
            padding: '8px 16px',
            cursor: rerollCount > 0 ? 'pointer' : 'default',
            opacity: rerollCount > 0 ? 1 : 0.3,
            fontFamily,
            fontSize: '14px',
            minHeight: '44px',
          }}
        >
          REROLL ({rerollCount})
        </button>
        <button
          onClick={() => useGameStore.getState().skip()}
          disabled={skipCount <= 0}
          style={{
            background: 'transparent',
            border: '1px solid #ffff00',
            color: '#ffff00',
            padding: '8px 16px',
            cursor: skipCount > 0 ? 'pointer' : 'default',
            opacity: skipCount > 0 ? 1 : 0.3,
            fontFamily,
            fontSize: '14px',
            minHeight: '44px',
          }}
        >
          SKIP ({skipCount})
        </button>
        <button
          onClick={() => {
            setBanishMode(!banishMode);
          }}
          disabled={banishCount <= 0}
          style={{
            background: banishMode ? '#ff0044' : 'transparent',
            border: '1px solid #ff0044',
            color: banishMode ? '#000' : '#ff0044',
            padding: '8px 16px',
            cursor: banishCount > 0 ? 'pointer' : 'default',
            opacity: banishCount > 0 ? 1 : 0.3,
            fontFamily,
            fontSize: '14px',
            minHeight: '44px',
          }}
        >
          BANISH ({banishCount})
        </button>
      </div>
    </div>
  );
}
