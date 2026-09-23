export type TrackPolyline = number[][]

export interface TrackSummary {
  distanceKm?: string
  duration?: string
}

export interface TrackBounds {
  maxLat: number
  maxLon: number
  minLat: number
  minLon: number
}

function record(json: unknown): Record<string, unknown> {
  return json && typeof json === 'object'
    ? (json as Record<string, unknown>)
    : {}
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function polyline(value: unknown): TrackPolyline {
  if (!Array.isArray(value)) return []
  return value.flatMap((tuple) => {
    if (!Array.isArray(tuple)) return []
    const [lat, lon] = tuple
    if (!finite(lat) || !finite(lon)) return []
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return []
    return [[lat, lon]]
  })
}

export function trackPolylines(json: unknown): TrackPolyline[] {
  const { points, segments } = record(json)
  const source = Array.isArray(segments) ? segments : [points]
  return source.map(polyline).filter((line) => line.length > 0)
}

function formatDuration(ms: number): string | undefined {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return undefined
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function trackSummary(json: unknown): TrackSummary {
  const { distanceMeters, endTimeMs, startTimeMs } = record(json)
  const summary: TrackSummary = {}
  if (finite(distanceMeters) && distanceMeters > 0) {
    summary.distanceKm = `${(distanceMeters / 1000).toFixed(1)} km`
  }
  if (finite(startTimeMs) && finite(endTimeMs)) {
    const duration = formatDuration(endTimeMs - startTimeMs)
    if (duration) summary.duration = duration
  }
  return summary
}

export function trackBounds(polylines: TrackPolyline[]): TrackBounds | null {
  const points = polylines.flat()
  if (points.length === 0) return null
  return points.reduce<TrackBounds>(
    (bounds, [lat, lon]) => ({
      maxLat: Math.max(bounds.maxLat, lat!),
      maxLon: Math.max(bounds.maxLon, lon!),
      minLat: Math.min(bounds.minLat, lat!),
      minLon: Math.min(bounds.minLon, lon!),
    }),
    { maxLat: -90, maxLon: -180, minLat: 90, minLon: 180 },
  )
}
