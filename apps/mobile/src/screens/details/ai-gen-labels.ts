import type { ArticleAiGenValue } from '@/api/article-meta'
import type { Messages, Translator } from '@/i18n'

const PRESET: Record<number, keyof Messages['notice']> = {
  [-1]: 'aiHandmade',
  0: 'aiAssist',
  1: 'aiAssist',
  2: 'aiFully',
  3: 'aiStoryOrganize',
  4: 'aiTitle',
  5: 'aiAssist',
  6: 'aiAssist',
  7: 'aiAssist',
  8: 'aiIllustration',
  9: 'aiDictation',
}

export function aiGenLabels(
  values: ArticleAiGenValue[],
  t: Translator<'notice'>,
): string[] {
  return values.map((value) => {
    if (typeof value === 'string') return value
    const key = PRESET[value]
    return key ? t(key) : String(value)
  })
}
