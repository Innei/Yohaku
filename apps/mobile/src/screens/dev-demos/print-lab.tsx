import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { AppText, Button } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { useOwner } from '@/owner/store'
import { useArticlePrint } from '@/screens/details/article-print-host'
import { usePalette } from '@/theme/palette'
import { useWebviewSerifFontFamily } from '@/theme/serif-font'
import { withLexicalElementDefaults } from '@yohaku/rich-content/src/lexical/element-defaults.ts'
import printLabFixture from '@yohaku/rich-content/src/lexical/__fixtures__/print-lab.json'

const CONTENT = JSON.stringify(withLexicalElementDefaults(printLabFixture))
const WEB_URL = 'https://innei.in/posts/lab/print'

export function PrintLab() {
  const palette = usePalette()
  const locale = useLocale()
  const t = useTranslations('common')
  const tp = useTranslations('print')
  const owner = useOwner()
  const labels = useRichBodyLabels()
  const serifFontFamily = useWebviewSerifFontFamily()
  const { host, print } = useArticlePrint()

  return (
    <View style={styles.wrap}>
      {host}
      <Button
        label={t('print')}
        onPress={() =>
          print({
            category: 'Lab',
            content: CONTENT,
            createdAt: new Date(2026, 7, 26),
            siteName: owner?.name || tp('site'),
            title: '打印稿全节点示例',
            url: WEB_URL,
            variant: 'article',
          })
        }
      />
      <Button
        label="Export PDF"
        variant="paper"
        onPress={() =>
          print({
            category: 'Lab',
            content: CONTENT,
            createdAt: new Date(2026, 7, 26),
            exportPdf: true,
            siteName: owner?.name || tp('site'),
            title: '打印稿全节点示例',
            url: WEB_URL,
            variant: 'article',
          })
        }
      />
      <View style={[styles.stage, { borderColor: palette.neutral[3] }]}>
        <AppText variant="meta">屏幕渲染 · 点打印走假 WebView</AppText>
        <RichBody
          apiBase={apiBaseUrl()}
          content={CONTENT}
          labels={labels}
          locale={locale}
          serifFontFamily={serifFontFamily}
          theme={palette.theme}
          variant="article"
          webUrl={WEB_URL}
          dom={{ matchContents: true, scrollEnabled: false }}
          onImagePress={async () => {}}
          onLinkPress={async () => {}}
          onScrollToAnchor={async () => {}}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  stage: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: 12,
  },
})
