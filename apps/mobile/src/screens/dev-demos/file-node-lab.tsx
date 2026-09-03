import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { useLocale } from '@/i18n'
import { openExternalUrl } from '@/lib/open-external'
import { usePalette } from '@/theme/palette'
import { useWebviewSerifFontFamily } from '@/theme/serif-font'

const text = (content: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: content,
  type: 'text',
  version: 1,
})

const file = (payload: Record<string, unknown>) => ({
  type: 'file',
  version: 1,
  ...payload,
})

const CONTENT = JSON.stringify({
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [
      file({
        ext: 'md',
        mimeType: 'text/markdown',
        name: 'README.md',
        size: 4096,
        src: 'https://raw.githubusercontent.com/Innei/Yohaku/main/README.md',
      }),
      file({
        ext: 'png',
        mimeType: 'image/png',
        name: 'cover.png',
        size: 86_040,
        src: 'https://picsum.photos/seed/yohaku-file/800/600',
      }),
      file({
        ext: 'pdf',
        mimeType: 'application/pdf',
        name: 'dummy.pdf',
        size: 13_264,
        src: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      }),
      file({
        ext: 'zip',
        mimeType: 'application/zip',
        name: 'archive.zip',
        src: 'https://cdn.example/file/archive.zip',
      }),
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr',
        children: [
          text('附件也可以内联：'),
          file({
            display: 'inline',
            ext: 'ts',
            name: 'vite.config.ts',
            src: 'https://cdn.example/file/vite.config.ts',
          }),
          text('，跟在正文里。'),
        ],
      },
    ],
  },
})

export function FileNodeLab() {
  const palette = usePalette()
  const locale = useLocale()
  const serifFontFamily = useWebviewSerifFontFamily()
  const labels = useRichBodyLabels()

  return (
    <View style={[styles.stage, { borderColor: palette.neutral[3] }]}>
      <RichBody
        apiBase={apiBaseUrl()}
        content={CONTENT}
        dom={{ matchContents: true, scrollEnabled: false }}
        labels={labels}
        locale={locale}
        serifFontFamily={serifFontFamily}
        theme={palette.theme}
        variant="article"
        webUrl=""
        onImagePress={async () => {}}
        onScrollToAnchor={async () => {}}
        onLinkPress={async (url) => {
          await openExternalUrl(url)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
})
