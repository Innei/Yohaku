export function socketGatewayUrl(apiBase: string): string {
  const trimmed = apiBase.replace(/\/+$/, '')
  const origin = trimmed.replace(/\/api\/v3$/, '')
  const wsOrigin = origin.replace(/^http/, 'ws')
  return `${wsOrigin}/ws/web`
}
