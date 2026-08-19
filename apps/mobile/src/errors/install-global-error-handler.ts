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
    if (!isFatal || !captureFatalError(error)) {
      originalHandler(error, isFatal)
    }
  })
}
