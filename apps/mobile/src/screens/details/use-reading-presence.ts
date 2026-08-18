import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AppState } from 'react-native'

import { api } from '@/api/client'
import {
  emitJoin,
  emitLeave,
  getGatewaySid,
  subscribeGatewayConnect,
} from '@/socket/client'
import {
  articleRoomName,
  buildUpdatePresenceBody,
  shouldJoinPresenceRoom,
} from '@/socket/presence'
import { readPercent } from '@/socket/read-percent'
import { currentPresenceVisitor } from '@/socket/visitor'

import { derivePresenceMarks } from './presence-marks'

const REPORT_WAIT_MS = 1000
const ROOM_POLL_MS = 30_000

export function useReadingPresence({
  articleId,
  enabled = true,
  openOnWeb,
}: {
  articleId?: string
  enabled?: boolean
  openOnWeb: boolean
}) {
  const roomName =
    enabled && shouldJoinPresenceRoom(articleId, openOnWeb)
      ? articleRoomName(articleId)
      : null
  const lastPercentRef = useRef(0)
  const activeRef = useRef(AppState.currentState === 'active')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const publish = useCallback(
    (position: number) => {
      const sid = getGatewaySid()
      if (!sid || !roomName || !activeRef.current) return
      const visitor = currentPresenceVisitor()
      void api
        .updatePresence(
          buildUpdatePresenceBody({
            displayName: visitor.displayName,
            identity: visitor.identity,
            position,
            readerId: visitor.readerId,
            roomName,
            sid,
            ts: Date.now(),
          }),
        )
        .catch(() => {})
    },
    [roomName],
  )

  const schedule = useCallback(
    (position: number) => {
      lastPercentRef.current = position
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        publish(position)
      }, REPORT_WAIT_MS)
    },
    [publish],
  )

  const { data: roomPresence, refetch } = useQuery({
    enabled: roomName !== null,
    queryFn: () => api.getRoomPresence(roomName ?? ''),
    queryKey: ['activity', 'presence', roomName],
    refetchInterval: ROOM_POLL_MS,
    retry: false,
  })

  const marks = useMemo(
    () => derivePresenceMarks(roomPresence, currentPresenceVisitor().identity),
    [roomPresence],
  )

  useEffect(() => {
    if (!roomName) return
    emitJoin(roomName)
    schedule(lastPercentRef.current)
    const unsubscribe = subscribeGatewayConnect(() => {
      emitJoin(roomName)
      publish(lastPercentRef.current)
      void refetch()
    })
    return () => {
      unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      emitLeave(roomName)
    }
  }, [publish, refetch, roomName, schedule])

  useEffect(() => {
    if (!roomName) return
    const sub = AppState.addEventListener('change', (state) => {
      activeRef.current = state === 'active'
      if (state !== 'active') {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        return
      }
      publish(lastPercentRef.current)
      void refetch()
    })
    return () => sub.remove()
  }, [publish, refetch, roomName])

  const onScrollMetrics = useCallback(
    ({
      contentHeight,
      viewportHeight,
      y,
    }: {
      contentHeight: number
      viewportHeight: number
      y: number
    }) => {
      if (!roomName) return
      schedule(
        readPercent({
          bodyHeight: contentHeight,
          bodyTop: 0,
          scrollTop: y,
          viewportHeight,
        }),
      )
    },
    [roomName, schedule],
  )

  return { marks, onScrollMetrics: roomName ? onScrollMetrics : undefined }
}
