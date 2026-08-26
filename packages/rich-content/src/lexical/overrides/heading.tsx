'use client'
import * as stylex from '@stylexjs/stylex'
import { createElement, isValidElement, type ReactNode } from 'react'

import { useHost } from '../../host'
import { sx, sxClass } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const heading = stylex.create({
  h1: {
    fontSize: '2em',
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: '1.5em',
    marginBottom: '0.5em',
  },
  h2: {
    fontSize: '1.5em',
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: '1.4em',
    marginBottom: '0.45em',
  },
  h3: {
    fontSize: '1.25em',
    fontWeight: 600,
    lineHeight: 1.25,
    marginTop: '1.3em',
    marginBottom: '0.4em',
  },
  h4: {
    fontSize: '1.125em',
    fontWeight: 600,
    lineHeight: 1.25,
    marginTop: '1.2em',
    marginBottom: '0.35em',
  },
  h5: {
    fontSize: '1em',
    fontWeight: 600,
    lineHeight: 1.25,
    marginTop: '1.1em',
    marginBottom: '0.3em',
  },
  h6: {
    fontSize: '0.875em',
    fontWeight: 600,
    lineHeight: 1.25,
    marginTop: '1em',
    marginBottom: '0.25em',
  },
})

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
      {...sxClass(
        'rich-heading-anchor',
        atoms.scale_90,
        atoms.ml_2,
        atoms.relative,
        atoms._bottom_1,
        atoms.inline_flex,
        atoms.cursor_pointer,
        atoms.select_none,
        atoms.text_accent,
        atoms.opacity_0,
        atoms.transition_opacity,
        atoms.duration_200,
        atoms.group_hover_opacity_100,
      )}
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
      ...sx(heading[tag], `rich-heading-${tag}`, atoms.flex, atoms.items_baseline),
      'data-group': '',
      id: slug || undefined,
      key,
    },
    <span key="text">{children}</span>,
    slug ? <HeadingAnchor key="anchor" slug={slug} /> : null,
  )
}
