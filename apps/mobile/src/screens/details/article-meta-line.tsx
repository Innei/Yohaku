import type { ArticleAiGenValue } from '@/api/article-meta'
import { AppText } from '@/components/ui'
import { useTranslations } from '@/i18n'

import { aiGenLabels } from './ai-gen-labels'

export function ArticleMetaLine({
  aiGen,
  parts,
}: {
  aiGen?: ArticleAiGenValue[] | null
  parts: (string | null | undefined)[]
}) {
  const t = useTranslations('notice')
  const disclosure = aiGen?.length ? aiGenLabels(aiGen, t).join(' · ') : null
  const line = [...parts, disclosure].filter(Boolean).join(' · ')
  if (!line) return null
  return <AppText variant="meta">{line}</AppText>
}
