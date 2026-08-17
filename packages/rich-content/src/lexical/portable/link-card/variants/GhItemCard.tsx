import type { FC, ReactNode } from 'react'

import type { HostEnrichment } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import {
  AsideAvatar,
  ClockIcon,
  CommentIcon,
  DiscussionIcon,
  EyebrowPill,
  GhCardLayout,
  IssueClosedIcon,
  IssueOpenedIcon,
  PrClosedIcon,
  PrMergedIcon,
  PrOpenIcon,
} from '../atoms'
import { findAttr, fmtTimeAgo } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

interface CapsConfig {
  caps: string
  KindIcon: FC<{ className?: string; size?: string | number }>
  stateClassName?: string
  StateIcon: FC<{ className?: string; size?: string | number }>
  stateLabel?: string
}

function repoPath(data: HostEnrichment): string | null {
  const attr = findAttr(data, 'repo')
  if (typeof attr?.value === 'string') return attr.value
  try {
    const u = new URL(data.url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
  } catch {}
  return null
}

const ITEM_DEFS = {
  issue: (data: HostEnrichment): CapsConfig => {
    const state = String(findAttr(data, 'state')?.value ?? 'open')
    const closed = state === 'closed'
    return {
      caps: 'Issue',
      KindIcon: IssueOpenedIcon,
      StateIcon: closed ? IssueClosedIcon : IssueOpenedIcon,
      stateLabel: closed ? 'closed' : 'open',
      stateClassName: closed ? 'text-error' : 'text-success',
    }
  },
  pr: (data: HostEnrichment): CapsConfig => {
    const state = String(findAttr(data, 'state')?.value ?? 'open')
    let StateIcon = PrOpenIcon
    let stateColor = 'text-success'
    if (state === 'merged') {
      StateIcon = PrMergedIcon
      stateColor = 'text-[color:#8957e5]'
    } else if (state === 'closed') {
      StateIcon = PrClosedIcon
      stateColor = 'text-error'
    }
    return {
      caps: 'Pull Request',
      KindIcon: PrOpenIcon,
      StateIcon,
      stateLabel: state,
      stateClassName: stateColor,
    }
  },
  discussion: (): CapsConfig => ({
    caps: 'Discussion',
    KindIcon: DiscussionIcon,
    StateIcon: DiscussionIcon,
  }),
} as const

export const GhItemCard: FC<Props & { kind: keyof typeof ITEM_DEFS }> = ({
  data,
  className,
  kind,
}) => {
  const cfg = ITEM_DEFS[kind](data)
  const repo = repoPath(data)
  const number = findAttr(data, 'number')?.value
  const author = findAttr(data, 'author')?.value
  const additionsRaw = findAttr(data, 'additions')?.value
  const deletionsRaw = findAttr(data, 'deletions')?.value
  const additions = typeof additionsRaw === 'number' ? additionsRaw : null
  const deletions = typeof deletionsRaw === 'number' ? deletionsRaw : null
  const totalDiff = (additions ?? 0) + (deletions ?? 0)
  const showDiff = totalDiff > 0
  const comments = findAttr(data, 'comments')?.value
  const replies = findAttr(data, 'replies')?.value
  const dateLabel = fmtTimeAgo(data.publishedAt)
  const repoAvatar = data.thumbnailImage?.url

  const meta: ReactNode[] = []
  if (cfg.stateLabel) {
    meta.push(
      <span className={clsxm('font-medium', cfg.stateClassName)} key="state">
        {cfg.stateLabel}
      </span>,
    )
  }
  if (showDiff) {
    meta.push(
      <span className="font-mono" key="diff">
        {additions != null && (
          <span className="text-success">+{additions}</span>
        )}
        {additions != null && deletions != null && ' '}
        {deletions != null && <span className="text-error">−{deletions}</span>}
      </span>,
    )
  }
  if (author) {
    meta.push(
      <span className="inline-flex items-center gap-1" key="author">
        <span className="text-neutral-8">{String(author)}</span>
      </span>,
    )
  }
  if (comments != null && Number(comments) > 0) {
    meta.push(
      <span className="inline-flex items-center gap-1" key="comments">
        <CommentIcon size="0.875rem" />
        {String(comments)}
      </span>,
    )
  }
  if (replies != null) {
    meta.push(
      <span className="inline-flex items-center gap-1" key="replies">
        <CommentIcon size="0.875rem" />
        {String(replies)} replies
      </span>,
    )
  }
  if (dateLabel) {
    meta.push(
      <span className="inline-flex items-center gap-1" key="date">
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
      aside={
        repoAvatar ? (
          <AsideAvatar alt={data.title} src={repoAvatar} />
        ) : undefined
      }
      eyebrow={{
        icon: <cfg.KindIcon className="size-3.5" />,
        kind: cfg.caps,
        repo,
        pill:
          number != null ? (
            <EyebrowPill>#{String(number)}</EyebrowPill>
          ) : undefined,
      }}
      title={{
        text: data.title,
        leadingIcon: cfg.stateLabel ? (
          <cfg.StateIcon
            className={clsxm('mt-0.5 size-4', cfg.stateClassName)}
          />
        ) : undefined,
      }}
    />
  )
}

export const IssueCard: FC<Props> = (p) => <GhItemCard {...p} kind="issue" />
export const PrCard: FC<Props> = (p) => <GhItemCard {...p} kind="pr" />
export const DiscussionCard: FC<Props> = (p) => (
  <GhItemCard {...p} kind="discussion" />
)
