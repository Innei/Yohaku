import { captureFatalError } from './fatal-error-store'

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void

interface GlobalErrorUtils {
  getGlobalHandler: () => GlobalErrorHandler
  setGlobalHandler: (handler: GlobalErrorHandler) => void
}

const errorUtils = (
  globalThis as typeof globalThis & { ErrorUtils?: GlobalErrorUtils }
).ErrorUtils

if (!__DEV__ && errorUtils) {
  const originalHandler = errorUtils.getGlobalHandler()
  errorUtils.setGlobalHandler((error, isFatal) => {
    const captured = isFatal && captureFatalError(error)
    if (captured) {
      // Release builds otherwise swallow the stack behind the recovery card.
      // Keeping it in logcat is what makes Android field reports actionable.
      const detail = error instanceof Error ? error.stack : String(error)
      console.error('[fatal-js]', detail)
      return
    }
    originalHandler(error, isFatal)
  })
}
