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
      className={clsxm(
        // `group relative isolate` are the host requirements for InkWash —
        // without them the hover bloom never fires.
        'yohaku-link-card group relative isolate block w-full max-w-[38rem] cursor-pointer overflow-hidden rounded-xl bg-neutral-1 px-6 py-4 text-neutral-9 no-underline ring-1 ring-border not-prose transition-colors duration-200 dark:bg-neutral-2',
        className,
      )}
    >
      <InkWash />
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-neutral-2 -ml-2 px-2 py-0.5 font-mono text-label-12 text-neutral-8 ring-1 ring-border/60">
          {idLabel}
        </span>
        {catDate && (
          <span className="text-[0.7rem] text-neutral-6">{catDate}</span>
        )}
      </div>
      <div className="text-[1.0625rem] leading-snug font-medium text-neutral-10">
        {data.title}
      </div>
      {authors && (
        <div className="mt-1.5 text-[0.875rem] leading-relaxed text-neutral-7">
          <span className="text-neutral-8">{authors.primary}</span>
          {authors.rest.map((a) => (
            <span key={a}> · {a}</span>
          ))}
          {authors.more > 0 && (
            <span className="text-neutral-6"> · {authors.more} more</span>
          )}
        </div>
      )}
      {abstract && (
        <div className="mt-2.5 line-clamp-3 border-t border-border/60 pt-2 font-serif text-[0.875rem] leading-relaxed text-neutral-7 italic">
          {abstract}
        </div>
      )}
    </a>
  )
}
