import { requireNativeModule } from 'expo-modules-core'

import type { ReaderContent } from './rich-body'

const DomWebViewModule = requireNativeModule<{
  setReaderContent: (payload: string) => void
}>('ExpoDomWebViewModule')

export function prepareArticleBody(payload: ReaderContent) {
  DomWebViewModule.setReaderContent(JSON.stringify(payload))
}
