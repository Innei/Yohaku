export function socketGatewayUrl(apiBase: string): string {
  const trimmed = apiBase.replace(/\/+$/, '')
  const origin = trimmed.replace(/\/api\/v3$/, '')
  const wsOrigin = origin.replace(/^http/, 'ws')
  return `${wsOrigin}/ws/web`
}

// Built by hand so React Native never has to parse a `ws://` URL (Hermes
// `URL` historically rejected that scheme, which would abort the handshake).
export function socketGatewayConnectUrl(
  apiBase: string,
  query: Record<string, string>,
): string {
  const base = socketGatewayUrl(apiBase)
  const params = Object.entries(query)
    .filter(([, value]) => value.length > 0)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
  return params.length === 0 ? base : `${base}?${params.join('&')}`
}

