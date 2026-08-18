import { useMemo } from 'react'

import { translate, useLocale } from '@/i18n'

import type { RichBodyLabels } from './rich-body'

export function useRichBodyLabels(): RichBodyLabels {
  const locale = useLocale()
  return useMemo(
    () => ({
      nestedDocCollapse: translate(locale, 'detail', 'nestedDocCollapse'),
      nestedDocExpand: translate(locale, 'detail', 'nestedDocExpand'),
      nestedDocLabel: translate(locale, 'detail', 'nestedDoc'),
      openInBrowser: translate(locale, 'common', 'openInBrowser'),
      unrenderable: translate(locale, 'detail', 'unrenderable'),
    }),
    [locale],
  )
}
