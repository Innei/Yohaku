import * as WebBrowser from 'expo-web-browser'
import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { useLocale } from '@/i18n'
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
        ext: 'pdf',
        mimeType: 'application/pdf',
        name: '季度报告.pdf',
        size: 2_411_724,
        src: 'https://cdn.example/file/report.pdf',
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
          await WebBrowser.openBrowserAsync(url)
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
