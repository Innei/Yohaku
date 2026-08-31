import { useMemo } from 'react'

import { translate, useLocale } from '@/i18n'

import type { RichBodyLabels } from './rich-body'

export function useRichBodyLabels(): RichBodyLabels {
  const locale = useLocale()
  return useMemo(
    () => ({
      codeCopied: translate(locale, 'detail', 'codeCopied'),
      codeCopy: translate(locale, 'detail', 'codeCopy'),
      codeExpand: translate(locale, 'detail', 'codeExpand'),
      fileDownloadFull: translate(locale, 'detail', 'fileDownloadFull'),
      filePreviewDownload: translate(locale, 'detail', 'filePreviewDownload'),
      filePreviewTruncated: translate(locale, 'detail', 'filePreviewTruncated', {
        size: '512 KB',
      }),
      filePreviewUnavailable: translate(locale, 'detail', 'filePreviewUnavailable'),
      nestedDocCollapse: translate(locale, 'detail', 'nestedDocCollapse'),
      nestedDocExpand: translate(locale, 'detail', 'nestedDocExpand'),
      nestedDocLabel: translate(locale, 'detail', 'nestedDoc'),
      openInBrowser: translate(locale, 'common', 'openInBrowser'),
      unrenderable: translate(locale, 'detail', 'unrenderable'),
    }),
    [locale],
  )
}
