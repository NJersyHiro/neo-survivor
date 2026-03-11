let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio not available
  }
}

export const SoundManager = {
  shoot() {
    playTone(880, 0.05, 'square', 0.06);
  },

  enemyHit() {
    playTone(220, 0.05, 'sawtooth', 0.04);
  },

  enemyDeath() {
    playTone(150, 0.1, 'sawtooth', 0.08);
    setTimeout(() => playTone(100, 0.15, 'sawtooth', 0.06), 50);
  },

  pickupXP() {
    playTone(1200, 0.04, 'sine', 0.05);
  },

  levelUp() {
    playTone(523, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 200);
  },

  playerHit() {
    playTone(100, 0.1, 'square', 0.08);
  },

  bossSpawn() {
    playTone(80, 0.3, 'sawtooth', 0.12);
    setTimeout(() => playTone(60, 0.4, 'sawtooth', 0.1), 200);
  },

  chestPickup() {
    playTone(600, 0.08, 'sine', 0.08);
    setTimeout(() => playTone(800, 0.08, 'sine', 0.08), 80);
    setTimeout(() => playTone(1000, 0.12, 'sine', 0.1), 160);
  },

  buttonClick() {
    playTone(660, 0.03, 'sine', 0.05);
  },

  // Call this on first user interaction to unlock audio context
  unlock() {
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
    } catch {
      // ignore
    }
  },
};
