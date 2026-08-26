import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
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
      {...sxClass("yohaku-link-card not-prose", // `group relative isolate` are the host requirements for InkWash —
        // without them the hover bloom never fires.
        atoms.relative, atoms.isolate, atoms.block, atoms.w_full, atoms.max_w__40rem, atoms.cursor_pointer, atoms.overflow_hidden, atoms.rounded_xl, atoms.bg_neutral_1, atoms.px_5, atoms.py_3, atoms.text_neutral_9, atoms.no_underline, atoms.ring_1, atoms.ring_border, atoms.transition_colors, atoms.duration_200, atoms.dark_bg_neutral_2, className)} data-group=""
    >
      <InkWash />
      <div {...sx(atoms.flex, atoms.flex_wrap, atoms.items_center, atoms.gap_2dot5)}>
        {difficulty && <StatePill label={difficulty} tone={tone} />}
        {number != null && (
          <span {...sx(atoms.font_mono, atoms.text_label_12, atoms.text_neutral_6)}>
            #{String(number)}
          </span>
        )}
        <span {...sx(atoms.min_w_0, atoms.flex_1, atoms.truncate, atoms.text_copy_14, atoms.font_medium, atoms.text_neutral_10)}>
          {data.title}
        </span>
        {acRate != null && (
          <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.text_label_12, atoms.text_neutral_6)}>
            <span {...sx(atoms.opacity_60)}>AR</span>
            <span {...sx(atoms.font_mono, atoms.text_neutral_8)}>{String(acRate)}</span>
          </span>
        )}
        {likes != null && Number(likes) > 0 && (
          <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.text_label_12, atoms.text_neutral_6)}>
            <span {...sx(atoms.text_label_12)}>▲</span>
            <span {...sx(atoms.font_mono, atoms.text_neutral_8)}>
              {fmtCount(Number(likes))}
            </span>
          </span>
        )}
      </div>
      {tagList.length > 0 && (
        <div {...sx(atoms.mt_2, atoms.ml_2, atoms.flex, atoms.flex_wrap, atoms.gap_1dot5)}>
          {tagList.slice(0, 6).map((tag) => (
            <span
              {...sx(atoms.rounded, atoms.bg_neutral_2, atoms.px_1dot5, atoms.py_0dot5, atoms.text_label_12, atoms.text_neutral_7, atoms.ring_1, atoms.ring_border_60)}
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
