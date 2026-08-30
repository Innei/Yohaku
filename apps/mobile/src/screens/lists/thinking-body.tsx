import { type as typeScale } from '@yohaku/design-system/tokens'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import type { ApiEnrichment } from '@/api/types'
import { AppText, MarkdownBody } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { soleCardVerbKey, thinkingBlocks } from '@/lib/thinking-markdown'

import { ThinkingLinkCard } from './thinking-link-card'

export function ThinkingBody({
  content,
  enrichments,
}: {
  content: string
  enrichments?: Record<string, ApiEnrichment> | null
}) {
  const t = useTranslations('list')
  const blocks = useMemo(
    () => thinkingBlocks(content, enrichments),
    [content, enrichments],
  )

  const verbKey = soleCardVerbKey(blocks)

  if (blocks.length === 0) return null

  return (
    <View style={styles.blocks}>
      {verbKey ? <AppText variant="eyebrow">{t(verbKey)}</AppText> : null}
      {blocks.map((block, blockIndex) =>
        block.type === 'card' ? (
          <ThinkingLinkCard enrichment={block.enrichment} key={block.href} />
        ) : (
          <MarkdownBody
            fontSize={typeScale.copy16.size}
            // eslint-disable-next-line @eslint-react/no-array-index-key -- blocks derive solely from content; segments have no stable id
            key={blockIndex}
            lineHeight={typeScale.copy16.lineHeight}
            markdown={block.markdown}
          />
        ),
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  blocks: {
    gap: 8,
  },
})
