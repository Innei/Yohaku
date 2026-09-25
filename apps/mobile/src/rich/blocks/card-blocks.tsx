import { filePreviewKind } from '@/components/dom/file-preview'
import { presentFilePreview } from '@/lib/file-preview'
import { presentImagePreview } from '@/lib/image-cache'
import { getSiteUrl } from '@/lib/site-url'

import { useRichDocument } from '../lexical/context'
import { IndexCard } from './index-card'
import { linkCardModel } from './link-card'
import { type BlockProps, num, str } from './types'

function formatBytes(size: number | undefined): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function LinkCardBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  const url = str(node.url)
  const model = linkCardModel(url, url ? doc.enrichments?.[url] : undefined, {
    description: str(node.description),
    image: str(node.image),
    title: str(node.title),
  })
  return (
    <IndexCard
      {...model}
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
    <IndexCard
      host="文件"
      label={meta || null}
      symbol="doc"
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
    <IndexCard
      description="展开阅读"
      host="嵌入文档"
      symbol="doc.text"
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
    <IndexCard
      description={doc.webUrl ? '在网页中查看' : undefined}
      host={LABELS[node.type] ?? node.type}
      symbol="square.dashed"
      title="此内容暂不支持原生显示"
      onPress={doc.webUrl ? () => doc.onLinkPress?.(doc.webUrl!) : undefined}
    />
  )
}
