import type { FC } from 'react'

import type { HostEnrichment } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import { InkWash, StatePill, type StateTone } from '../atoms'
import { findAttr, fmtCount } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

const DIFFICULTY_TONE: Record<string, StateTone> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
}

export const LeetcodeCard: FC<Props> = ({ data, className }) => {
  const difficulty = String(findAttr(data, 'difficulty')?.value ?? '')
  const tone = DIFFICULTY_TONE[difficulty] ?? 'neutral'
  const number = findAttr(data, 'number')?.value
  const acRate = findAttr(data, 'ac_rate')?.value
  const likes = findAttr(data, 'likes')?.value
  const tags = findAttr(data, 'tags')?.value

  let tagList: string[] = []
  if (Array.isArray(tags)) {
    tagList = tags.filter((t) => typeof t === 'string')
  } else if (typeof tags === 'string') {
    tagList = tags
      .split(/[,/]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }

  return (
    <a
      data-hide-print
      href={data.url}
      rel="noreferrer"
      target="_blank"
      className={clsxm(
        // `group relative isolate` are the host requirements for InkWash —
        // without them the hover bloom never fires.
        'yohaku-link-card group relative isolate my-4 block w-full max-w-[40rem] cursor-pointer overflow-hidden rounded-xl bg-neutral-1 px-5 py-3 text-neutral-9 no-underline ring-1 ring-border not-prose transition-colors duration-200 dark:bg-neutral-2',
        className,
      )}
    >
      <InkWash />
      <div className="flex flex-wrap items-center gap-2.5">
        {difficulty && <StatePill label={difficulty} tone={tone} />}
        {number != null && (
          <span className="font-mono text-label-12 text-neutral-6">
            #{String(number)}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-copy-14 font-medium text-neutral-10">
          {data.title}
        </span>
        {acRate != null && (
          <span className="inline-flex items-center gap-1 text-label-12 text-neutral-6">
            <span className="opacity-60">AR</span>
            <span className="font-mono text-neutral-8">{String(acRate)}</span>
          </span>
        )}
        {likes != null && Number(likes) > 0 && (
          <span className="inline-flex items-center gap-1 text-label-12 text-neutral-6">
            <span className="text-label-12">▲</span>
            <span className="font-mono text-neutral-8">
              {fmtCount(Number(likes))}
            </span>
          </span>
        )}
      </div>
      {tagList.length > 0 && (
        <div className="mt-2 ml-2 flex flex-wrap gap-1.5">
          {tagList.slice(0, 6).map((tag) => (
            <span
              className="rounded bg-neutral-2 px-1.5 py-0.5 text-label-12 text-neutral-7 ring-1 ring-border/60"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}
