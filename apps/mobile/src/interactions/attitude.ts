export type Attitude = 'up' | 'down'

export interface AttitudeResult {
  downDelta: number
  next: Attitude | null
  upDelta: number
}

export function applyAttitude(
  current: Attitude | null,
  pressed: Attitude,
  code: number,
): AttitudeResult {
  if (code === -1) {
    return {
      next: null,
      upDelta: pressed === 'up' ? -1 : 0,
      downDelta: pressed === 'down' ? -1 : 0,
    }
  }
  const switching = current !== null && current !== pressed
  return {
    next: pressed,
    upDelta: pressed === 'up' ? 1 : switching ? -1 : 0,
    downDelta: pressed === 'down' ? 1 : switching ? -1 : 0,
  }
}
