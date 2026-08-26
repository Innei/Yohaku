import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC, ReactNode } from 'react'

import type { HostEnrichment } from '../../../../host'
import {
  AsideAvatar,
  ClockIcon,
  EyebrowPill,
  GhCardLayout,
  GitCommitIcon,
} from '../atoms'
import { findAttr, fmtTimeAgo } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

function parseCommitUrl(
  url: string,
): { repo: string; owner: string; sha: string } | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length !== 4 || parts[2] !== 'commit') return null
    if (!/^[\da-f]{7,}$/i.test(parts[3])) return null
    return {
      repo: `${parts[0]}/${parts[1]}`,
      owner: parts[0],
      sha: parts[3],
    }
  } catch {
    return null
  }
}

export const CommitCard: FC<Props> = ({ data, className }) => {
  const parsed = parseCommitUrl(data.url)
  const repoPath = parsed?.repo ?? null
  const shortSha = parsed ? parsed.sha.slice(0, 7) : null

  const author = findAttr(data, 'author')?.value
  const additionsRaw = findAttr(data, 'additions')?.value
  const deletionsRaw = findAttr(data, 'deletions')?.value
  const additions = typeof additionsRaw === 'number' ? additionsRaw : null
  const deletions = typeof deletionsRaw === 'number' ? deletionsRaw : null
  const totalDiff = (additions ?? 0) + (deletions ?? 0)
  const showDiff = totalDiff > 0

  const dateLabel = fmtTimeAgo(data.publishedAt)
  const authorAvatar = data.thumbnailImage?.url
  const description = data.description?.trim()

  const meta: ReactNode[] = []
  if (showDiff) {
    meta.push(
      <span {...sx(atoms.font_mono)} key="diff">
        {additions != null && (
          <span {...sx(atoms.text_success)}>+{additions}</span>
        )}
        {additions != null && deletions != null && ' '}
        {deletions != null && <span {...sx(atoms.text_error)}>−{deletions}</span>}
      </span>,
    )
  }
  if (author) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="author">
        {authorAvatar && (
          <img
            aria-hidden
            alt=""
            {...sx(atoms.size_4, atoms.shrink_0, atoms.rounded_full, atoms.bg_neutral_2, atoms.object_cover)}
            loading="lazy"
            src={authorAvatar}
          />
        )}
        <span {...sx(atoms.text_neutral_8)}>{String(author)}</span>
      </span>,
    )
  }
  if (dateLabel) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1)} key="date">
        <ClockIcon size="0.875rem" />
        {dateLabel}
      </span>,
    )
  }

  return (
    <GhCardLayout
      className={className}
      href={data.url}
      meta={meta}
      title={{ text: data.title }}
      aside={
        parsed ? (
          <AsideAvatar
            alt={repoPath ?? parsed.owner}
            src={`https://github.com/${parsed.owner}.png?size=80`}
          />
        ) : undefined
      }
      body={
        description ? (
          <div {...sx(atoms.line_clamp_2, atoms.font_mono, atoms.text__0dot8125rem, atoms.leading_relaxed, atoms.whitespace_pre_wrap, atoms.text_neutral_7)}>
            {description}
          </div>
        ) : undefined
      }
      eyebrow={{
        icon: <GitCommitIcon {...sx(atoms.size_3dot5)} />,
        kind: 'Commit',
        repo: repoPath,
        pill: shortSha ? <EyebrowPill>{shortSha}</EyebrowPill> : undefined,
      }}
    />
  )
}
