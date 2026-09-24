import printLabFixture from '@yohaku/rich-content/src/lexical/__fixtures__/print-lab.json'
import { withLexicalElementDefaults } from '@yohaku/rich-content/src/lexical/element-defaults.ts'
import { StyleSheet, View } from 'react-native'

import { AppText, Button } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { useOwner } from '@/owner/store'
import { RichDocument } from '@/rich/lexical/rich-document'
import { useArticlePrint } from '@/screens/details/article-print-host'
import { usePalette } from '@/theme/palette'

import { LabScreen } from './lab-screen'

const STATE = withLexicalElementDefaults(printLabFixture)
const CONTENT = JSON.stringify(STATE)
const WEB_URL = 'https://innei.in/posts/lab/print'

export function PrintLabScreen() {
  return (
    <LabScreen intro="打印稿全节点示例。" title="Print">
      <PrintLab />
    </LabScreen>
  )
}

export function PrintLab() {
  const palette = usePalette()
  const t = useTranslations('common')
  const tp = useTranslations('print')
  const owner = useOwner()
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
        <AppText variant="meta">屏幕渲染 · 打印走原生分页</AppText>
        <RichDocument
          value={STATE as never}
          variant="article"
          webUrl={WEB_URL}
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
