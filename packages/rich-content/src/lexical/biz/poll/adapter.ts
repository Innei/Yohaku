'use client'

import type {
  PollDataAdapter,
  PollState,
} from '@haklex/rich-compose/modules/poll'
import { useMemo } from 'react'

import { useHost } from '../../../host'
import { invalidateResource, useResource } from '../../../lib/use-resource'
import { parsePollState } from './parse-state'

const fallbackState: PollState = {
  canVote: false,
  closed: false,
  status: 'loading',
  tallies: {},
  totalVotes: 0,
}

export function usePortablePollAdapter(): PollDataAdapter {
  const host = useHost()
  return useMemo<PollDataAdapter>(
    () => ({
      usePollState: (pollId) => {
        const { data } = useResource(`poll:${pollId}`, async () =>
          parsePollState(await host.fetchJSON<unknown>(`/polls/${pollId}`)),
        )
        return data ?? fallbackState
      },
      useSubmit: (pollId) => async (optionIds) => {
        await host.fetchJSON<unknown>(`/polls/${pollId}/vote`, {
          body: JSON.stringify({ optionIds }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        invalidateResource(`poll:${pollId}`)
      },
    }),
    [host],
  )
}
