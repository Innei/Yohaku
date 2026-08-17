import { useInfiniteQuery } from '@tanstack/react-query'

import { api } from '@/api/client'
import type { Locale } from '@/i18n/config'

export function useMyCommentsQuery(locale: Locale, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: ['me-comments', locale],
    queryFn: ({ pageParam }) => api.myComments(pageParam),
    staleTime: 5 * 60 * 1000,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  })
}
