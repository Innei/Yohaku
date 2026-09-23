import type { SerializedEditorState } from 'lexical'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

import { AppText, PillButton } from '@/components/ui'
import { openExternalUrl } from '@/lib/open-external'
import { RichDocument } from '@/rich/lexical/rich-document'
import { usePalette } from '@/theme/palette'

import { LabScreen } from './lab-screen'

const SAMPLES: Array<{ id: string; label: string; only?: string }> = [
  { id: '180759007416291328', label: '链接卡/引用/对话/文件' },
  { id: '155012508522909696', label: 'mermaid/表格/alert' },
  { id: '170934497552896000', label: '列表/embed/自动链接' },
  { id: '133259626676764688', label: '推文 embed' },
  { id: '180759007416291328', label: '只看 chat', only: 'chat' },
]

export function RichDocumentLab() {
  const palette = usePalette()
  const [sample, setSample] = useState(SAMPLES[0]!)
  const [state, setState] = useState<{
    id: string
    value: SerializedEditorState
    webUrl: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    fetch(`https://mx.innei.in/api/v3/posts/${sample.id}`)
      .then((res) => res.json())
      .then(
        ({
          data: post,
        }: {
          data: {
            content: string
            slug: string
            category: { slug: string }
          }
        }) => {
          if (cancelled) return
          setState({
            id: sample.id,
            value: (() => {
              const parsed = JSON.parse(
                post.content,
              ) as SerializedEditorState & {
                root: { children: Array<{ type: string }> }
              }
              if (sample.only) {
                parsed.root.children = parsed.root.children.filter(
                  (child) => child.type === sample.only,
                )
              }
              return parsed
            })(),
            webUrl: `https://innei.in/posts/${post.category.slug}/${post.slug}`,
          })
        },
      )
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [sample])

  return (
    <LabScreen
      intro="生产文章的 lexical JSON → haklex override → 原生 segments。"
      title="原生文档"
    >
      <View style={styles.row}>
        {SAMPLES.map((item) => (
          <PillButton
            active={item.id === sample.id}
            key={item.id}
            onPress={() => setSample(item)}
          >
            <AppText variant="secondary">{item.label}</AppText>
          </PillButton>
        ))}
      </View>
      {error ? (
        <AppText color={palette.neutral[7]} variant="secondary">
          {error}
        </AppText>
      ) : null}
      {state && state.id === sample.id ? (
        <RichDocument
          menuItems={[{ id: 'comment', label: '评论', icon: 'text.bubble' }]}
          value={state.value}
          webUrl={state.webUrl}
          onLinkPress={(href) => openExternalUrl(href)}
          onMenuAction={(event) =>
            Alert.alert(
              '评论',
              `${event.start.blockId}:${event.start.offset} → ${event.end.blockId}:${event.end.offset}\n${event.text}`,
            )
          }
          onNestedDocExpand={(payload) =>
            Alert.alert(payload.title ?? '', '展开嵌套文档')
          }
        />
      ) : null}
    </LabScreen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
