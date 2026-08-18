import type { ApiMyComment } from '@/api/types'

import { indexSummaryChars, postListSummary } from '../lists/post-list'
import type { LikedListItem } from './liked-list-model'
import type { ReadingListItem } from './reading-list-model'

export type ActivityKindLabel = {
  note: string
  thinking: string
}

export type ActivityEntryView =
  | {
      accent: string | null
      createdAt: Date
      excerpt: string
      kind: 'entry'
      title: string
    }
  | { kind: 'unavailable' }

function articleView(
  kind: 'note' | 'post',
  row: {
    categoryName?: string | null
    createdAt: Date
    excerpt: string | null
    text: string | null
    title: string
  },
  labels: ActivityKindLabel,
): ActivityEntryView {
  return {
    kind: 'entry',
    title: row.title,
    excerpt: postListSummary(row, indexSummaryChars),
    createdAt: row.createdAt,
    accent: kind === 'post' ? (row.categoryName ?? null) : labels.note,
  }
}

export function viewLikedItem(
  item: LikedListItem,
  labels: ActivityKindLabel,
): ActivityEntryView {
  if (item.kind === 'unavailable') return { kind: 'unavailable' }
  if (item.kind === 'post') return articleView('post', item.post, labels)
  if (item.kind === 'note') return articleView('note', item.note, labels)
  return {
    kind: 'entry',
    title: item.thinking.content,
    excerpt: '',
    createdAt: item.thinking.createdAt,
    accent: labels.thinking,
  }
}

export function viewReadingItem(
  item: ReadingListItem,
  labels: ActivityKindLabel,
): ActivityEntryView {
  if (item.kind === 'unavailable') return { kind: 'unavailable' }
  if (item.kind === 'post') return articleView('post', item.post, labels)
  return articleView('note', item.note, labels)
}

export function viewMyComment(
  comment: Pick<ApiMyComment, 'createdAt' | 'sourceTitle' | 'text'>,
  unavailableLabel: string,
) {
  return {
    title: comment.text,
    excerpt: '',
    createdAt: new Date(comment.createdAt),
    accent: comment.sourceTitle ?? unavailableLabel,
  }
}
