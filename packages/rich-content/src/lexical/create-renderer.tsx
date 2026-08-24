'use client'

import type {
  BuiltinNodeRenderer,
  RichRendererModule,
} from '@haklex/rich-compose'
import { composeRenderer } from '@haklex/rich-compose'
import { ALERT_MODULE_NAME } from '@haklex/rich-compose/modules/alert'
import { BANNER_MODULE_NAME } from '@haklex/rich-compose/modules/banner'
import { codeSnippetModule } from '@haklex/rich-compose/modules/code-snippet'
import { embedModule } from '@haklex/rich-compose/modules/embed'
import { galleryModule } from '@haklex/rich-compose/modules/gallery'
import {
  imageModule,
  type OnImageClick,
} from '@haklex/rich-compose/modules/image'
import { mentionModule } from '@haklex/rich-compose/modules/mention'
import { mermaidModule } from '@haklex/rich-compose/modules/mermaid'
import {
  nestedDocModule,
  type OnNestedDocExpand,
} from '@haklex/rich-compose/modules/nested-doc'
import {
  POLL_NODE_KEY,
  PollDataProvider,
  usePollDataAdapter,
} from '@haklex/rich-compose/modules/poll'
import { rubyModule } from '@haklex/rich-compose/modules/ruby'
import { videoModule } from '@haklex/rich-compose/modules/video'
import type { RichEditorVariant } from '@haklex/rich-editor'
import { allNodes } from '@haklex/rich-editor/static'
import { NESTED_DOC_NODE_KEY } from '@haklex/rich-ext-nested-doc'
import type { LexicalNodeConfig, SerializedEditorState } from 'lexical'
import type { ComponentType, CSSProperties } from 'react'
import { useEffect } from 'react'

import {
  type HostCapabilities,
  imagePreviewSourceFromElement,
  useHost,
} from '../host'
import { AFILMORY_NODE_KEY } from './biz/afilmory/afilmory-augment'
import { AfilmoryRenderer } from './biz/afilmory/AfilmoryRenderer'
import { yohakuAfilmoryModule } from './biz/afilmory/yohaku-afilmory-module'
import { MAP_NODE_KEY } from './biz/map/augment'
import { yohakuMapModule } from './biz/map/module'
import { YohakuMapRenderer } from './biz/map/renderer'
import { usePortablePollAdapter } from './biz/poll/adapter'
import { yohakuPollModule } from './biz/poll/module'
import { YohakuPollRenderer } from './biz/poll/renderer'
import { STOCK_NODE_KEY } from './biz/stock/augment'
import { StockBlock } from './biz/stock/block'
import { yohakuStockModule } from './biz/stock/module'
import { BlockBoundary } from './block-boundary'
import {
  configuredDynamicModule,
  setDynamicCatalogHost,
} from './dynamic-catalog'
import {
  CodeBlockOverride,
  lexicalAutolinkOverride,
  lexicalLinkOverride,
  lexicalParagraphOverride,
  LinkCardOverride,
} from './link-overrides'
import { LexicalAlertOverride } from './overrides/alert'
import { LexicalBannerOverride } from './overrides/banner'
import { LexicalBlockquoteOverride } from './overrides/blockquote'
import { LexicalDetailsOverride } from './overrides/details'
import { lexicalHeadingOverride } from './overrides/heading'
import { LexicalListItemOverride } from './overrides/list-item'
import { lexicalTableOverrides } from './overrides/table'
import { yohakuFileModule } from './file-module'
import { yohakuChatModule } from './portable/chat-module'
import { staticExcalidrawModule } from './portable/excalidraw'
import { LexicalImageOverride } from './portable/image'
import { Mermaid } from './portable/mermaid'
import { LexicalNestedDocOverride } from './portable/nested-doc'
import { YohakuEmbedNode } from './portable/yohaku-embed-node'

function withBoundary<P extends object>(
  label: string,
  Comp: ComponentType<P>,
): ComponentType<P> {
  function Bounded(props: P) {
    return (
      <BlockBoundary label={label}>
        <Comp {...props} />
      </BlockBoundary>
    )
  }
  return Bounded
}

export const nestedDocExpandHolder: { current: OnNestedDocExpand | null } = {
  current: null,
}
export const openImageHolder: {
  current: HostCapabilities['openImage'] | null
} = {
  current: null,
}
export const imageClickCaptureHolder: {
  current: ((target: HTMLImageElement | null) => void) | null
} = { current: null }

const configuredNestedDocModule = nestedDocModule.setup({
  onExpand: (payload) => nestedDocExpandHolder.current?.(payload),
})

const handleLexicalImageClick: OnImageClick = ({
  current,
  images,
  index,
  target,
}) => {
  const imageElement = target instanceof HTMLImageElement ? target : null
  imageClickCaptureHolder.current?.(imageElement)
  openImageHolder.current?.({
    images: images.map((image) => image.src),
    index,
    source: imageElement
      ? imagePreviewSourceFromElement(imageElement)
      : undefined,
    src: current.src,
  })
}

const configuredImageModule = imageModule.setup({
  onImageClick: handleLexicalImageClick,
})
const configuredGalleryModule = galleryModule.setup({
  onImageClick: handleLexicalImageClick,
})

const builtinNodeOverrides: Record<string, BuiltinNodeRenderer> = {
  ...lexicalTableOverrides,
  autolink: lexicalAutolinkOverride,
  details: LexicalDetailsOverride,
  heading: lexicalHeadingOverride,
  link: lexicalLinkOverride,
  listitem: LexicalListItemOverride,
  paragraph: lexicalParagraphOverride,
  quote: LexicalBlockquoteOverride,
  // allNodes registers a Lexical node-replacement for QuoteNode that
  // upgrades every parsed 'quote' into a RichQuoteNode whose own type is
  // 'rich-quote' — the override must be keyed under both to actually apply.
  'rich-quote': LexicalBlockquoteOverride,
}

const boundedPollModule: RichRendererModule = {
  ...yohakuPollModule,
  renderers: { [POLL_NODE_KEY]: withBoundary('投票', YohakuPollRenderer) },
}
const boundedStockModule: RichRendererModule = {
  ...yohakuStockModule,
  renderers: { [STOCK_NODE_KEY]: withBoundary('股票', StockBlock) },
}
const boundedMapModule: RichRendererModule = {
  ...yohakuMapModule,
  renderers: { [MAP_NODE_KEY]: withBoundary('地图', YohakuMapRenderer) },
}
const boundedAfilmoryModule: RichRendererModule = {
  ...yohakuAfilmoryModule,
  renderers: { [AFILMORY_NODE_KEY]: withBoundary('相册', AfilmoryRenderer) },
}

const lexicalAlertModule: RichRendererModule = {
  name: ALERT_MODULE_NAME,
  renderers: { Alert: LexicalAlertOverride },
}
const lexicalBannerModule: RichRendererModule = {
  name: BANNER_MODULE_NAME,
  renderers: { Banner: LexicalBannerOverride },
}
const lexicalCodeBlockModule: RichRendererModule = {
  name: 'code-block',
  renderers: { CodeBlock: CodeBlockOverride },
}
const lexicalLinkCardModule: RichRendererModule = {
  name: 'link-card',
  renderers: { LinkCard: LinkCardOverride },
}

const yohakuEmbedModule: RichRendererModule = {
  ...embedModule,
  nodes: [YohakuEmbedNode],
}

const modules: RichRendererModule[] = [
  configuredDynamicModule,
  yohakuEmbedModule,
  configuredNestedDocModule,
  staticExcalidrawModule,
  yohakuChatModule,
  codeSnippetModule,
  configuredGalleryModule,
  lexicalAlertModule,
  lexicalBannerModule,
  configuredImageModule,
  mentionModule,
  rubyModule,
  videoModule,
  yohakuFileModule,
  mermaidModule,
  boundedPollModule,
  boundedMapModule,
  boundedAfilmoryModule,
  boundedStockModule,
  lexicalLinkCardModule,
  lexicalCodeBlockModule,
]

const RichContent = composeRenderer({
  builtinNodeOverrides,
  modules,
  overrides: {
    Image: LexicalImageOverride,
    Mermaid: withBoundary('图表', Mermaid),
    [NESTED_DOC_NODE_KEY]: LexicalNestedDocOverride,
  },
})

const LEXICAL_ALWAYS_REGISTERED = [
  'root',
  'paragraph',
  'text',
  'linebreak',
  'tab',
]

function nodeType(entry: LexicalNodeConfig): string {
  return typeof entry === 'function' ? entry.getType() : entry.replace.getType()
}

export const REGISTERED_NODE_TYPES = new Set<string>([
  ...LEXICAL_ALWAYS_REGISTERED,
  ...allNodes.map(nodeType),
  ...modules.flatMap((mod) => (mod.nodes ?? []).map(nodeType)),
])

export interface YohakuRichContentProps {
  className?: string
  style?: CSSProperties
  theme: 'dark' | 'light'
  value: SerializedEditorState
  variant?: RichEditorVariant
}

export function createYohakuLexicalRenderer(): ComponentType<YohakuRichContentProps> {
  return function YohakuLexicalRenderer(props: YohakuRichContentProps) {
    const host = useHost()

    useEffect(() => {
      openImageHolder.current = host.openImage
      return () => {
        openImageHolder.current = null
      }
    }, [host])

    useEffect(() => {
      setDynamicCatalogHost(host)
    }, [host])

    // A host (web) may already wrap its own PollDataProvider above this
    // component to inject a richer adapter (e.g. react-query backed); that
    // ancestor provider is read here and takes precedence. Hosts that don't
    // (mobile) fall through to the package's own fetchJSON-based adapter, so
    // usePollDataAdapter() is never null inside RichContent.
    const hostPollAdapter = usePollDataAdapter()
    const fallbackPollAdapter = usePortablePollAdapter()
    const pollAdapter = hostPollAdapter ?? fallbackPollAdapter

    return (
      <PollDataProvider adapter={pollAdapter}>
        <RichContent {...props} />
      </PollDataProvider>
    )
  }
}
