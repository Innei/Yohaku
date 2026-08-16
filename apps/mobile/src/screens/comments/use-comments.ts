import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { api } from '@/api/client'

export function commentsQueryKey(refId: string) {
  return ['comments', refId] as const
}

export function commentAnchorsQueryKey(refId: string) {
  return ['comments', refId, 'anchors'] as const
}

export function useCommentsQuery(refId: string) {
  return useInfiniteQuery({
    queryKey: commentsQueryKey(refId),
    queryFn: ({ pageParam }) => api.commentList(refId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  })
}

export function useCommentAnchorsQuery(refId: string) {
  return useQuery({
    queryKey: commentAnchorsQueryKey(refId),
    queryFn: () => api.commentList(refId, 1, 100),
  })
}
