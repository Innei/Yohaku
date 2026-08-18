import { type HostCapabilities, HostFetchError } from './host'

interface FetchJSONContractOptions {
  status?: number
  url?: string
}

/**
 * Drives a HostCapabilities.fetchJSON implementation against a stubbed
 * non-ok response and throws a descriptive Error if it doesn't reject with
 * HostFetchError carrying the matching status. Framework-agnostic on
 * purpose (no `expect`) so any test runner can wrap it — call it inside a
 * `it()`/`test()` and let a thrown Error fail that test.
 */
export async function assertFetchJSONContract(
  fetchJSON: HostCapabilities['fetchJSON'],
  options: FetchJSONContractOptions = {},
): Promise<void> {
  const { status = 404, url = 'https://contract-test.invalid/resource' } =
    options
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() =>
    Promise.resolve(new Response(null, { status }))) as typeof fetch
  let caught: unknown
  try {
    await fetchJSON(url)
  } catch (error) {
    caught = error
  } finally {
    globalThis.fetch = originalFetch
  }
  if (!(caught instanceof HostFetchError)) {
    throw new Error(
      `fetchJSON must reject with HostFetchError on a non-ok response, got: ${String(caught)}`,
    )
  }
  if (caught.status !== status) {
    throw new Error(
      `HostFetchError.status must match the response status: expected ${status}, got ${caught.status}`,
    )
  }
}
