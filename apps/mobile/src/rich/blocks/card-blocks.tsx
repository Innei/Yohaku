import { StyleSheet, View } from 'react-native'

import { filePreviewKind } from '@/components/dom/file-preview'
import { AppText, NativePressable, Paper, RemoteImage } from '@/components/ui'
import { presentFilePreview } from '@/lib/file-preview'
import { presentImagePreview } from '@/lib/image-cache'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { type BlockProps, num, str } from './types'

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function formatBytes(size: number | undefined): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function Card({
  eyebrow,
  image,
  onPress,
  subtitle,
  title,
}: {
  eyebrow: string
  image?: string
  onPress?: () => void
  subtitle?: string
  title: string
}) {
  const palette = usePalette()
  return (
    <NativePressable disabled={!onPress} onPress={onPress}>
      <Paper style={styles.card}>
        <View style={styles.cardText}>
          <AppText color={palette.neutral[6]} variant="eyebrow">
            {eyebrow}
          </AppText>
          <AppText numberOfLines={2} variant="entryTitle">
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              color={palette.neutral[7]}
              numberOfLines={2}
              variant="secondary"
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {image ? (
          <RemoteImage
            contentFit="cover"
            style={[styles.cardImage, { backgroundColor: palette.neutral[2] }]}
            uri={image}
          />
        ) : null}
      </Paper>
    </NativePressable>
  )
}

export function LinkCardBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  const url = str(node.url)
  const entry = url ? doc.enrichments?.[url] : undefined
  const image =
    entry?.thumbnailImage?.url ?? entry?.image?.url ?? str(node.image)
  return (
    <Card
      eyebrow={(entry?.category ?? hostOf(url)).toUpperCase()}
      image={image || undefined}
      subtitle={entry?.description ?? str(node.description)}
      title={entry?.title ?? (str(node.title) || url)}
      onPress={url ? () => doc.onLinkPress?.(url) : undefined}
    />
  )
}

export function FileBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  const src = str(node.src)
  const name = str(node.name) || src
  const mimeType = str(node.mimeType) || undefined
  const kind = filePreviewKind({
    ext: str(node.ext) || undefined,
    mimeType,
    name,
  })
  const meta = [str(node.ext).toUpperCase(), formatBytes(num(node.size))]
    .filter(Boolean)
    .join(' · ')
  const open = () => {
    if (kind === 'image') {
      void presentImagePreview({
        index: 0,
        siteReferer: getSiteUrl(),
        urls: [src],
      })
    } else if (kind) {
      void presentFilePreview({
        mimeType,
        name,
        siteReferer: getSiteUrl(),
        url: src,
      })
    } else {
      doc.onLinkPress?.(src)
    }
  }
  return (
    <Card
      eyebrow="FILE"
      subtitle={meta}
      title={name}
      onPress={src ? open : undefined}
    />
  )
}

export function NestedDocBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  const content = node.content as { root?: unknown } | undefined
  const title = str(node.title) || '嵌入文档'
  return (
    <Card
      eyebrow="DOC"
      subtitle="展开阅读"
      title={title}
      onPress={
        content?.root && doc.onNestedDocExpand
          ? () =>
              doc.onNestedDocExpand?.({
                contentState: content as never,
                title,
              })
          : undefined
      }
    />
  )
}

const LABELS: Record<string, string> = {
  poll: '投票',
  stock: '股票',
  map: '地图',
  afilmory: '相册',
  embed: '嵌入内容',
  excalidraw: '手绘图',
  'katex-block': '公式',
  chat: '对话',
  gallery: '图集',
  video: '视频',
  dynamic: '动态组件',
  'code-snippet': '代码片段',
  'grid-container': '栅格',
  'footnote-section': '脚注',
}

export function UnsupportedBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  return (
    <Card
      eyebrow={LABELS[node.type] ?? node.type}
      subtitle={doc.webUrl ? '在网页中查看' : undefined}
      title="此内容暂不支持原生显示"
      onPress={doc.webUrl ? () => doc.onLinkPress?.(doc.webUrl!) : undefined}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: { flex: 1, gap: 4 },
  cardImage: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden' },
})
