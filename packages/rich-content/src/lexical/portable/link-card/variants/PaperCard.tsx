import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC } from 'react'

import type { HostEnrichment } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import { InkWash } from '../atoms'
import { findAttr } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

function fmtIdLabel(data: HostEnrichment): string {
  const id = findAttr(data, 'id')?.value
  if (typeof id === 'string') return `arXiv:${id}`
  try {
    const u = new URL(data.url)
    const m = /\/(?:abs|pdf)\/([\d.]+(?:v\d+)?)/.exec(u.pathname)
    if (m) return `arXiv:${m[1]}`
  } catch {}
  return 'arXiv'
}

function fmtAuthors(authorsRaw: unknown): {
  primary: string
  rest: string[]
  more: number
} | null {
  if (!authorsRaw) return null
  let list: string[] = []
  if (Array.isArray(authorsRaw)) {
    list = authorsRaw.filter((a) => typeof a === 'string')
  } else if (typeof authorsRaw === 'string') {
    list = authorsRaw
      .split(/,\s*|\s+et\s+al\.?\s*/i)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (!list.length) return null
  const head = list.slice(0, 4)
  const more = list.length - head.length
  return { primary: head[0], rest: head.slice(1), more }
}

function fmtCatDate(data: HostEnrichment): string {
  const parts: string[] = []
  const cat = findAttr(data, 'category')?.value
  if (typeof cat === 'string') parts.push(cat)
  if (data.publishedAt) {
    const d = new Date(data.publishedAt)
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      )
    }
  }
  return parts.join(' · ')
}

export const PaperCard: FC<Props> = ({ data, className }) => {
  const idLabel = fmtIdLabel(data)
  const authors = fmtAuthors(findAttr(data, 'authors')?.value)
  const catDate = fmtCatDate(data)
  const abstract = data.description

  return (
    <a
      data-hide-print
      href={data.url}
      rel="noreferrer"
      target="_blank"
      {...sxClass("yohaku-link-card not-prose", // `group relative isolate` are the host requirements for InkWash —
        // without them the hover bloom never fires.
        atoms.relative, atoms.isolate, atoms.block, atoms.w_full, atoms.max_w__38rem, atoms.cursor_pointer, atoms.overflow_hidden, atoms.rounded_xl, atoms.bg_neutral_1, atoms.px_6, atoms.py_4, atoms.text_neutral_9, atoms.no_underline, atoms.ring_1, atoms.ring_border, atoms.transition_colors, atoms.duration_200, atoms.dark_bg_neutral_2, className)} data-group=""
    >
      <InkWash />
      <div {...sx(atoms.mb_2, atoms.flex, atoms.items_center, atoms.gap_2)}>
        <span {...sx(atoms.rounded, atoms.bg_neutral_2, atoms._ml_2, atoms.px_2, atoms.py_0dot5, atoms.font_mono, atoms.text_label_12, atoms.text_neutral_8, atoms.ring_1, atoms.ring_border_60)}>
          {idLabel}
        </span>
        {catDate && (
          <span {...sx(atoms.text__0dot7rem, atoms.text_neutral_6)}>{catDate}</span>
        )}
      </div>
      <div {...sx(atoms.text__1dot0625rem, atoms.leading_snug, atoms.font_medium, atoms.text_neutral_10)}>
        {data.title}
      </div>
      {authors && (
        <div {...sx(atoms.mt_1dot5, atoms.text__0dot875rem, atoms.leading_relaxed, atoms.text_neutral_7)}>
          <span {...sx(atoms.text_neutral_8)}>{authors.primary}</span>
          {authors.rest.map((a) => (
            <span key={a}> · {a}</span>
          ))}
          {authors.more > 0 && (
            <span {...sx(atoms.text_neutral_6)}> · {authors.more} more</span>
          )}
        </div>
      )}
      {abstract && (
        <div {...sx(atoms.mt_2dot5, atoms.line_clamp_3, atoms.border_t, atoms.border_border_60, atoms.pt_2, atoms.font_serif, atoms.text__0dot875rem, atoms.leading_relaxed, atoms.text_neutral_7, atoms.italic)}>
          {abstract}
        </div>
      )}
    </a>
  )
}
