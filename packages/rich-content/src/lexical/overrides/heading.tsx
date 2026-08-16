'use client'

import { createElement, isValidElement, type ReactNode } from 'react'

import { useHost } from '../../host'

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const HEADING_CLASS: Record<HeadingTag, string> = {
  h1: 'text-[2em] font-bold leading-tight mt-[1.5em] mb-[0.5em]',
  h2: 'text-[1.5em] font-bold leading-tight mt-[1.4em] mb-[0.45em]',
  h3: 'text-[1.25em] font-semibold leading-tight mt-[1.3em] mb-[0.4em]',
  h4: 'text-[1.125em] font-semibold leading-tight mt-[1.2em] mb-[0.35em]',
  h5: 'text-[1em] font-semibold leading-tight mt-[1.1em] mb-[0.3em]',
  h6: 'text-[0.875em] font-semibold leading-tight mt-[1em] mb-[0.25em]',
}

function extractReactText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean')
    return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    return node.map(extractReactText).join('')
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode }
    return extractReactText(props.children)
  }
  return ''
}

function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\s\w\p{L}-]/gu, '')
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

function HeadingAnchor({ slug }: { slug: string }) {
  const { scrollToAnchor } = useHost()
  return (
    <a
      aria-hidden
      className="rich-heading-anchor scale-90 ml-2 relative -bottom-1 inline-flex cursor-pointer select-none text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      href={`#${slug}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        void scrollToAnchor(slug)
      }}
    >
      <i className="i-mingcute-hashtag-line" />
    </a>
  )
}

export function lexicalHeadingOverride(
  node: unknown,
  key: string,
  children: ReactNode,
): ReactNode {
  const n = node as { tag?: HeadingTag }
  const tag: HeadingTag = n.tag ?? 'h2'
  const text = extractReactText(children)
  const slug = textToSlug(text)

  return createElement(
    tag,
    {
      className: `${HEADING_CLASS[tag]} rich-heading-${tag} group flex items-baseline`,
      id: slug || undefined,
      key,
    },
    <span key="text">{children}</span>,
    slug ? <HeadingAnchor key="anchor" slug={slug} /> : null,
  )
}
