import { useQuery } from '@tanstack/react-query'

import { api } from '@/api/client'
import { isActiveMembership } from '@/api/membership'
import { useSession } from '@/auth/session-store'

export function useMembershipPlans(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => api.membershipPlans(),
    queryKey: ['membership', 'plans'],
    staleTime: 5 * 60_000,
  })
}

export function useMembershipStatus() {
  const session = useSession()
  return useQuery({
    enabled: Boolean(session),
    queryFn: () => api.membershipStatus(),
    queryKey: ['membership', 'status', session?.id ?? 'anon'],
    staleTime: 60_000,
  })
}

export function useIsActiveMember() {
  const { data } = useMembershipStatus()
  return isActiveMembership(data)
}
