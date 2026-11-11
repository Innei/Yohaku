import type { CSSProperties, FC, ReactNode } from 'react'

import { EXCALIDRAW_FONT_STACK } from './fonts'
import type { RichNode } from './richtext'
import {
  blockTypography,
  contentRoot,
  hasFormat,
  RICHTEXT_LINK_COLOR,
  RICHTEXT_LIST_INDENT,
  RICHTEXT_PADDING,
  RICHTEXT_QUOTE_BORDER,
  RICHTEXT_QUOTE_INDENT,
  RICHTEXT_TEXT_COLOR,
  richTextPlainText,
  TEXT_FORMAT,
} from './richtext'
import type { RichTextElement } from './types'

const SAFE_URL = /^(?:https?:|mailto:|#|\/)/i
const XHTML_NS = { xmlns: 'http://www.w3.org/1999/xhtml' } as Record<
  string,
  string
>
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

const px = (value: number) => `${value}px`

function parseStyle(style: string | undefined): CSSProperties {
  const out: Record<string, string> = {}
  for (const part of (style ?? '').split(';')) {
    const [rawKey, ...rest] = part.split(':')
    const key = rawKey?.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (!value || /url\(|expression/i.test(value)) continue
    if (key === 'color') out.color = value
    if (key === 'background-color') out.backgroundColor = value
  }
  return out
}

function renderText(node: RichNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? ''
  const style = parseStyle(node.style)
  if (Object.keys(style).length > 0) out = <span style={style}>{out}</span>
  if (hasFormat(node, TEXT_FORMAT.code)) out = <code>{out}</code>
  if (hasFormat(node, TEXT_FORMAT.highlight)) out = <mark>{out}</mark>
  if (hasFormat(node, TEXT_FORMAT.underline)) out = <u>{out}</u>
  if (hasFormat(node, TEXT_FORMAT.strikethrough)) out = <s>{out}</s>
  if (hasFormat(node, TEXT_FORMAT.italic)) out = <em>{out}</em>
  if (hasFormat(node, TEXT_FORMAT.bold)) out = <strong>{out}</strong>
  return <span key={key}>{out}</span>
}

function renderInline(nodes: readonly RichNode[] = []): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text': {
        return renderText(node, i)
      }
      case 'linebreak': {
        return <br key={i} />
      }
      case 'tab': {
        return <span key={i}>{'\t'}</span>
      }
      case 'link':
      case 'autolink': {
        const href =
          typeof node.url === 'string' && SAFE_URL.test(node.url)
            ? node.url
            : undefined
        return (
          <a
            href={href}
            key={i}
            rel="noopener noreferrer"
            style={{ color: RICHTEXT_LINK_COLOR }}
            target="_blank"
          >
            {renderInline(node.children)}
          </a>
        )
      }
      default: {
        return <span key={i}>{richTextPlainText(node)}</span>
      }
    }
  })
}

function blockStyle(node: RichNode): CSSProperties {
  const { fontSize, fontWeight, lineHeight } = blockTypography(node)
  return {
    fontSize: px(fontSize),
    fontWeight,
    lineHeight,
    margin: 0,
    minHeight: px(fontSize * lineHeight),
  }
}

function renderBlock(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph': {
      return (
        <p key={key} style={blockStyle(node)}>
          {renderInline(node.children)}
        </p>
      )
    }
    case 'heading': {
      const Tag = (HEADING_TAGS.has(node.tag ?? '') ? node.tag : 'h4') as 'h4'
      return (
        <Tag key={key} style={blockStyle(node)}>
          {renderInline(node.children)}
        </Tag>
      )
    }
    case 'quote': {
      return (
        <blockquote
          key={key}
          style={{
            ...blockStyle(node),
            paddingLeft: px(RICHTEXT_QUOTE_INDENT - 3),
            borderLeft: RICHTEXT_QUOTE_BORDER,
          }}
        >
          {renderInline(node.children)}
        </blockquote>
      )
    }
    case 'list': {
      const List = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <List
          key={key}
          style={{ margin: 0, paddingLeft: px(RICHTEXT_LIST_INDENT) }}
        >
          {(node.children ?? []).map((item, i) =>
            renderListItem(
              item.type === 'listitem'
                ? item
                : { type: 'listitem', children: [item] },
              i,
            ),
          )}
        </List>
      )
    }
    default: {
      return (
        <p key={key} style={blockStyle({ type: 'paragraph' })}>
          {richTextPlainText(node)}
        </p>
      )
    }
  }
}

function renderListItem(node: RichNode, key: number): ReactNode {
  const children = node.children ?? []
  const nested = children.filter((child) => child.type === 'list')
  const inline = children.filter((child) => child.type !== 'list')
  return (
    <li key={key} style={blockStyle({ type: 'paragraph' })}>
      {renderInline(inline)}
      {nested.map((list, i) => renderBlock(list, i))}
    </li>
  )
}

export const RichTextBody: FC<{ el: RichTextElement }> = ({ el }) => (
  <foreignObject
    height={el.height}
    style={{ overflow: 'visible' }}
    width={el.width}
  >
    <div
      {...XHTML_NS}
      style={{
        boxSizing: 'border-box',
        color: RICHTEXT_TEXT_COLOR,
        fontFamily: EXCALIDRAW_FONT_STACK.sans,
        minHeight: px(el.height),
        overflowWrap: 'break-word',
        padding: px(RICHTEXT_PADDING),
        whiteSpace: 'pre-wrap',
        width: px(el.width),
      }}
    >
      {(contentRoot(el.content).children ?? []).map((node, i) =>
        renderBlock(node, i),
      )}
    </div>
  </foreignObject>
)
