import { rewriteIncomingPath } from '@/lib/link-router'

export function redirectSystemPath({ path }: { path: string }) {
  return rewriteIncomingPath(path)
}
