import type {
  ApiComment,
  ApiCommentReplyWindow,
  ApiCommentRoot,
} from '@/api/types'

export interface ThreadExpansion {
  done: boolean
  nextCursor: string | null
  replies: ApiComment[]
}

export interface CommentThread {
  hiddenCount: number
  nextCursor: string | null
  replies: ApiComment[]
  root: ApiCommentRoot
}

export function commentDisplayName(comment: ApiComment): string {
  return comment.reader?.name ?? comment.author
}

export function commentAvatar(comment: ApiComment): string | null {
  return comment.reader?.image ?? comment.avatar
}

export function mergeReplies(
  base: ApiComment[],
  fetched: ApiComment[],
): ApiComment[] {
  const byId = new Map<string, ApiComment>()
  for (const reply of [...base, ...fetched]) byId.set(reply.id, reply)
  return [...byId.values()].sort((a, b) => {
    const at = new Date(a.createdAt).getTime()
    const bt = new Date(b.createdAt).getTime()
    if (at !== bt) return at - bt
    return a.id < b.id ? -1 : 1
  })
}

function hiddenReplyCount(
  window: ApiCommentReplyWindow | null,
  visible: number,
  expansionDone: boolean,
): number {
  if (expansionDone || !window) return 0
  return Math.max(0, window.total - visible)
}

export function buildThread(
  root: ApiCommentRoot,
  expansion: ThreadExpansion | undefined,
): CommentThread {
  const replies = mergeReplies(root.replies ?? [], expansion?.replies ?? [])
  return {
    root,
    replies,
    hiddenCount: hiddenReplyCount(
      root.replyWindow,
      replies.length,
      expansion?.done ?? false,
    ),
    nextCursor:
      expansion === undefined
        ? (root.replyWindow?.nextCursor ?? null)
        : expansion.nextCursor,
  }
}

export function replyTargetAuthor(
  reply: ApiComment,
  thread: { replies: ApiComment[]; root: ApiCommentRoot },
): string | null {
  const parentId = reply.parentCommentId
  if (!parentId || parentId === thread.root.id) return null
  const parent = thread.replies.find((item) => item.id === parentId)
  return parent ? commentDisplayName(parent) : null
}
