'use client'

import type { BuiltinNodeRenderer } from '@haklex/rich-compose'
import type { CodeBlockRenderer } from '@haklex/rich-compose/modules/code-block'
import { semanticClassNames, sharedStyles } from '@haklex/rich-editor/styles'
import clsx from 'clsx'
import { type ComponentProps, isValidElement, type ReactNode } from 'react'

import { useHost } from '../host'
import { PortableCodeBlock } from './portable/code-block'
import { PortableInlineLink } from './portable/inline-link'
import { PortableLinkCard } from './portable/link-card'

const linkClassName = clsx(semanticClassNames.link, sharedStyles.link)

function InlineLinkRenderer({
  children,
  href,
  rel,
  target,
}: {
  children: ReactNode
  href: string
  rel?: string
  target?: string
}) {
  const { scrollToAnchor, slots } = useHost()
  if (href.startsWith('#')) {
    return (
      <a
        className={linkClassName}
        href={href}
        onClick={(e) => {
          e.preventDefault()
          void scrollToAnchor(href.slice(1))
        }}
      >
        {children}
      </a>
    )
  }
  if (slots?.InlineLink) {
    return (
      <slots.InlineLink
        className={linkClassName}
        href={href}
        rel={rel}
        target={target}
      >
        {children}
      </slots.InlineLink>
    )
  }
  return (
    <PortableInlineLink
      className={linkClassName}
      href={href}
      rel={rel}
      target={target}
    >
      {children}
    </PortableInlineLink>
  )
}

function BlockLinkCardRenderer({
  fallback,
  href,
}: {
  fallback: ReactNode
  href: string
}) {
  const { slots } = useHost()
  if (slots?.BlockLinkCard) {
    return <slots.BlockLinkCard fallback={fallback} url={href} />
  }
  return <PortableLinkCard fallback={fallback} url={href} />
}

export const lexicalParagraphOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
  defaultRenderer,
) => {
  const n = node as { children?: Array<{ type?: string }> }
  const only = n.children?.length === 1 ? n.children[0] : null
  if (only && (only.type === 'autolink' || only.type === 'link')) {
    const child = Array.isArray(children) ? children[0] : null
    const childProps = isValidElement(child)
      ? (child.props as { href?: unknown; children?: unknown })
      : null
    const href =
      typeof childProps?.href === 'string' ? childProps.href : undefined
    if (href) {
      const text =
        only.type === 'autolink'
          ? href
          : typeof childProps?.children === 'string'
            ? childProps.children
            : ''
      const isBareUrl = only.type === 'autolink' || text === href
      if (isBareUrl) {
        return (
          <BlockLinkCardRenderer
            fallback={defaultRenderer()}
            href={href}
            key={key}
          />
        )
      }
    }
  }
  return defaultRenderer()
}

export const lexicalLinkOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
  defaultRenderer,
) => {
  const n = node as {
    rel?: string | null
    target?: string | null
    url?: string
  }
  if (!n.url) return defaultRenderer()
  return (
    <InlineLinkRenderer
      href={n.url}
      key={key}
      rel={n.rel || 'noopener'}
      target={n.target || '_blank'}
    >
      {children}
    </InlineLinkRenderer>
  )
}

export const lexicalAutolinkOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
  defaultRenderer,
) => {
  const n = node as { url?: string }
  if (!n.url) return defaultRenderer()
  return (
    <InlineLinkRenderer href={n.url} key={key} rel="noopener" target="_blank">
      {children}
    </InlineLinkRenderer>
  )
}

export function LinkCardOverride({ url }: { url: string }) {
  const { slots } = useHost()
  if (!url) return null
  const fallback = <a href={url}>{url}</a>
  if (slots?.BlockLinkCard) {
    return <slots.BlockLinkCard fallback={fallback} url={url} />
  }
  return <PortableLinkCard fallback={fallback} url={url} />
}

export function CodeBlockOverride(
  props: ComponentProps<typeof CodeBlockRenderer>,
) {
  const { slots } = useHost()
  if (slots?.CodeBlock) {
    return (
      <slots.CodeBlock
        code={props.code}
        language={props.language || undefined}
      />
    )
  }
  return (
    <PortableCodeBlock
      code={props.code}
      language={props.language || undefined}
    />
  )
}
