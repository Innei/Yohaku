const EXACT_ROUTES = new Set([
  '/liked',
  '/my-comments',
  '/notes',
  '/pages',
  '/reader',
  '/reading',
  '/series',
  '/thinking',
])

const STABLE_ROUTE_PATTERNS = [
  /^\/categories\/[^/]+$/,
  /^\/notes\/\d+$/,
  /^\/notes\/\d{4}(?:\/\d{1,2}){2}\/[^/]+$/,
  /^\/pages\/[^/]+$/,
  /^\/posts\/tag\/[^/]+$/,
  /^\/posts(?:\/[^/]+){2}$/,
  /^\/series\/[^/]+$/,
  /^\/skills\/[^/]+$/,
]

function hasSafeSegments(pathname: string): boolean {
  if (
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.length > 512 ||
    /[#?\\]/.test(pathname)
  ) {
    return false
  }

  return pathname
    .slice(1)
    .split('/')
    .every((segment) => {
      if (!segment) return false
      try {
        const decoded = decodeURIComponent(segment)
        return (
          decoded !== '.' &&
          decoded !== '..' &&
          !decoded.includes('/') &&
          !decoded.includes('\\')
        )
      } catch {
        return false
      }
    })
}

export function restorableRoute(
  pathname: string,
  segments: readonly string[],
): string | null {
  if (pathname === '/') {
    const tabGroup = segments[0] === '(tabs)' ? segments[1] : undefined
    if (tabGroup === '(posts)' || tabGroup === '(study)') {
      return `/(tabs)/${tabGroup}`
    }
    return '/'
  }

  if (!hasSafeSegments(pathname)) return null
  if (EXACT_ROUTES.has(pathname)) return pathname
  return STABLE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))
    ? pathname
    : null
}

export function restorableRouteURL(
  pathname: string,
  segments: readonly string[],
  createURL: (route: string) => string,
): string | null {
  const route = restorableRoute(pathname, segments)
  return route ? createURL(route) : null
}
