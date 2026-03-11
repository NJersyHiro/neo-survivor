import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';

interface InputState {
  dx: number;
  dz: number;
}

export function useInput() {
  const input = useRef<InputState>({ dx: 0, dz: 0 });
  const keys = useRef(new Set<string>());
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      updateFromKeys();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key);
      updateFromKeys();
    };

    function updateFromKeys() {
      let dx = 0;
      let dz = 0;
      const k = keys.current;
      if (k.has('w') || k.has('W') || k.has('ArrowUp')) dz -= 1;
      if (k.has('s') || k.has('S') || k.has('ArrowDown')) dz += 1;
      if (k.has('a') || k.has('A') || k.has('ArrowLeft')) dx -= 1;
      if (k.has('d') || k.has('D') || k.has('ArrowRight')) dx += 1;

      const mag = Math.sqrt(dx * dx + dz * dz);
      if (mag > 0) {
        dx /= mag;
        dz /= mag;
      }
      input.current.dx = dx;
      input.current.dz = dz;
    }

    const onTouchStart = (e: TouchEvent) => {
      // Only capture touch during active gameplay — allow UI taps during level-up/menu/gameover
      const phase = useGameStore.getState().phase;
      if (phase !== 'playing') return;
      e.preventDefault();
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      touchIdRef.current = touch.identifier;
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current === null || !touchStart.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch && touch.identifier === touchIdRef.current) {
          let dx = (touch.clientX - touchStart.current.x) / 50;
          let dz = (touch.clientY - touchStart.current.y) / 50;
          const mag = Math.sqrt(dx * dx + dz * dz);
          if (mag > 1) {
            dx /= mag;
            dz /= mag;
          }
          input.current.dx = dx;
          input.current.dz = dz;
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch && touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          touchStart.current = null;
          input.current.dx = 0;
          input.current.dz = 0;
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return input;
}
