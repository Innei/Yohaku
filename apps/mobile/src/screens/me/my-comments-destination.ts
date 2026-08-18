import type { ApiMyComment } from '@/api/types'

export type MyCommentDestination =
  | {
      category: string
      commentId: string
      kind: 'post'
      postId: string
      slug: string
    }
  | { commentId: string; kind: 'note'; nid: number }
  | { kind: 'thinking'; refId: string }
  | { kind: 'unavailable' }

export function myCommentDestination(
  comment: ApiMyComment,
): MyCommentDestination {
  if (comment.refType === 'recently') {
    if (!comment.source) return { kind: 'unavailable' }
    return { kind: 'thinking', refId: comment.refId }
  }
  if (comment.refType === 'post') {
    const category = comment.source?.categorySlug
    const slug = comment.source?.slug
    if (!category || !slug) return { kind: 'unavailable' }
    return {
      kind: 'post',
      category,
      slug,
      postId: comment.refId,
      commentId: comment.id,
    }
  }
  if (comment.refType === 'note') {
    const nid = comment.source?.nid
    if (typeof nid !== 'number') return { kind: 'unavailable' }
    return { kind: 'note', nid, commentId: comment.id }
  }
  return { kind: 'unavailable' }
}
