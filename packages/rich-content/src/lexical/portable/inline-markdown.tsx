'use client'

import Markdown from 'markdown-to-jsx'

export function InlineMarkdown({ children }: { children: string }) {
  return <Markdown>{children}</Markdown>
}
