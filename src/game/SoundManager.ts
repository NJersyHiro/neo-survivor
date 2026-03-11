let audioCtx: AudioContext | null = null;
let unlocked = false;
let silentAudio: HTMLAudioElement | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

// Generate a ~1 second silent WAV as a data URI
function createSilentWavDataURI(): string {
  // WAV header for 1 second of silence at 8000Hz, 8-bit mono
  const sampleRate = 8000;
  const numSamples = sampleRate; // 1 second
  const dataSize = numSamples;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, 1, true);  // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate
  view.setUint16(32, 1, true);  // block align
  view.setUint16(34, 8, true);  // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Fill with silence (128 = silence for 8-bit PCM)
  for (let i = 44; i < fileSize; i++) {
    view.setUint8(i, 128);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Start a continuously looping silent audio element to keep WKWebView audio session in Playback mode
function startSilentLoop() {
  if (silentAudio) return;
  silentAudio = new Audio();
  silentAudio.setAttribute('playsinline', '');
  silentAudio.loop = true;
  silentAudio.src = createSilentWavDataURI();
  silentAudio.volume = 0.01; // Near-silent but not zero (zero may be optimized away by iOS)
  silentAudio.play().catch(() => { /* ignore */ });
}

async function forceUnlock(): Promise<void> {
  if (unlocked) return;

  const ctx = getCtx();

  // Resume if suspended
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Play silent buffer through AudioContext
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);

  // Start the continuously looping silent audio — this is the key iOS fix
  startSilentLoop();

  unlocked = true;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1) {
  if (!unlocked) return;
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

  unlock() {
    void forceUnlock();
  },

  // Listen for any user gesture to unlock audio — call once at app startup
  init() {
    const handler = () => {
      void forceUnlock().then(() => {
        document.removeEventListener('touchstart', handler, true);
        document.removeEventListener('touchend', handler, true);
        document.removeEventListener('mousedown', handler, true);
        document.removeEventListener('click', handler, true);
      });
    };
    document.addEventListener('touchstart', handler, true);
    document.addEventListener('touchend', handler, true);
    document.addEventListener('mousedown', handler, true);
    document.addEventListener('click', handler, true);
  },
};
