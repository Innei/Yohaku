export const TTS_RATES = [1, 1.25, 1.5, 1.75, 2] as const

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function nextRate(current: number): number {
  const index = TTS_RATES.indexOf(current as (typeof TTS_RATES)[number])
  return TTS_RATES[(index + 1) % TTS_RATES.length]
}
