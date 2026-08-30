import { requireNativeModule } from 'expo-modules-core'

import type { ReaderContent } from './rich-body'

const DomWebViewModule = requireNativeModule<{
  setReaderContent: (payload: string) => Promise<boolean>
}>('ExpoDomWebViewModule')

let lastReadyReaderId: string | null = null

export async function prepareArticleBody(payload: ReaderContent) {
  const ready = await DomWebViewModule.setReaderContent(JSON.stringify(payload))
  lastReadyReaderId = ready ? payload.id : null
  return ready
}

export function isPreparedReader(readerId: string) {
  return lastReadyReaderId === readerId
}
