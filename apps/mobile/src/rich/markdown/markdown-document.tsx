import { useEffect, useRef } from 'react'

import {
  RichDocumentContext,
  type RichDocumentHandlers,
} from '../lexical/context'
import { documentContext, SegmentList } from '../lexical/rich-document'
import type { MarkdownArticle } from './article'

export interface MarkdownDocumentProps extends RichDocumentHandlers {
  article: MarkdownArticle
}

export function MarkdownDocument({
  article,
  ...handlers
}: MarkdownDocumentProps) {
  const onSegments = useRef(handlers.onSegments)
  onSegments.current = handlers.onSegments
  useEffect(() => {
    onSegments.current?.(article.segments)
  }, [article])

  return (
    <RichDocumentContext
      value={documentContext(handlers, article.footnotes, false)}
    >
      <SegmentList segments={article.segments} />
    </RichDocumentContext>
  )
}
