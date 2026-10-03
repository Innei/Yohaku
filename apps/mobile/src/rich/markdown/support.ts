import { YohakuNative } from '@modules/yohaku'

// OTA can deliver this bundle to a binary built before parseMarkdown existed.
export function canRenderMarkdown(): boolean {
  return typeof YohakuNative.parseMarkdown === 'function'
}

export function markdownOpensOnWeb(
  contentFormat: string | null | undefined,
): boolean {
  return contentFormat === 'markdown' && !canRenderMarkdown()
}
