export const TTS_RATES = [1, 1.25, 1.5, 1.75, 2] as const

export type TtsRate = (typeof TTS_RATES)[number]

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function formatRate(rate: number): string {
  return rate === 1 ? '1×' : `${rate}×`
}

export function isTtsRate(value: number): value is TtsRate {
  return (TTS_RATES as readonly number[]).includes(value)
}

export function ttsRateMenuItems(current: number) {
  return TTS_RATES.map((rate) => ({
    id: String(rate),
    on: rate === current,
    title: formatRate(rate),
  }))
}
