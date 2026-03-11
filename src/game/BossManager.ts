const BOSS_SPAWN_MINUTES = [3, 5, 7, 10, 13];

export function getBossSpawnMinutes(): number[] {
  return BOSS_SPAWN_MINUTES;
}

export function shouldSpawnBoss(currentTime: number, previousTime: number): boolean {
  for (const minute of BOSS_SPAWN_MINUTES) {
    const threshold = minute * 60;
    if (previousTime < threshold && currentTime >= threshold) {
      return true;
    }
  }
  return false;
}
