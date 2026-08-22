import { YohakuNative } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AppState } from 'react-native'

import { api } from '@/api/client'
import type { ApiTtsSegment } from '@/api/types'
import { t } from '@/i18n'

import { isTtsRate } from './format'
import { createTtsTimeLifecycle } from './time-lifecycle'

export type TtsStatus = 'idle' | 'loading' | 'paused' | 'playing'

const ARTIST = '余白'
let playerOwner: symbol | null = null

function hasTtsNative(): boolean {
  return typeof YohakuNative.loadTts === 'function'
}

export function useTtsSession({
  articleId,
  available,
  lang,
  stale,
  title,
}: {
  articleId: string | undefined
  available: boolean
  lang: string
  stale: boolean
  title: string | undefined
}) {
  const sessionId = useRef(Symbol('tts'))
  const [activated, setActivated] = useState(false)
  const [playOnReady, setPlayOnReady] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoFollow, setAutoFollow] = useState(true)
  const [failed, setFailed] = useState(false)

  const [timeLifecycle] = useState(() =>
    createTtsTimeLifecycle({
      initiallyActive: AppState.currentState === 'active',
      publish: (snapshot) => {
        setElapsed(snapshot.elapsed)
        setDuration(snapshot.duration)
      },
    }),
  )

  const playingIndexRef = useRef(playingIndex)
  const isPlayingRef = useRef(isPlaying)
  const playbackRateRef = useRef(playbackRate)
  const segmentsRef = useRef<ApiTtsSegment[]>([])
  const titleRef = useRef(title)
  playingIndexRef.current = playingIndex
  isPlayingRef.current = isPlaying
  playbackRateRef.current = playbackRate
  titleRef.current = title

  const isOwner = useCallback(() => playerOwner === sessionId.current, [])

  const ttsQuery = useQuery({
    queryKey: ['tts', articleId, lang],
    queryFn: () => api.articleTts(articleId!),
    enabled: activated && available && Boolean(articleId),
    staleTime: 5 * 60 * 1000,
  })

  const segments = ttsQuery.data?.segments ?? []
  segmentsRef.current = segments

  const status: TtsStatus = !available
    ? 'idle'
    : failed || ttsQuery.isError
      ? 'idle'
      : activated && ttsQuery.isLoading
        ? 'loading'
        : playingIndex === null
          ? 'idle'
          : isPlaying
            ? 'playing'
            : 'paused'

  const isNarrating =
    status === 'loading' || status === 'playing' || status === 'paused'

  const playIndex = useCallback(
    async (index: number) => {
      const segment = segmentsRef.current[index]
      if (!segment) return
      playerOwner = sessionId.current
      setPlayingIndex(index)
      timeLifecycle.reset()
      if (!hasTtsNative()) {
        setFailed(true)
        return
      }
      try {
        await YohakuNative.loadTts({
          artist: ARTIST,
          rate: playbackRateRef.current,
          title: titleRef.current ?? ARTIST,
          url: segment.url,
        })
        await YohakuNative.playTts()
        setIsPlaying(true)
        const next = segmentsRef.current[index + 1]
        if (next) await YohakuNative.preloadTts(next.url)
      } catch {
        setFailed(true)
      }
    },
    [timeLifecycle],
  )

  const resetLocal = useCallback(() => {
    setPlayingIndex(null)
    setIsPlaying(false)
    timeLifecycle.reset()
    setAutoFollow(true)
  }, [timeLifecycle])

  const stop = useCallback(() => {
    if (isOwner()) {
      if (hasTtsNative()) void YohakuNative.stopTts()
      playerOwner = null
    }
    resetLocal()
  }, [isOwner, resetLocal])

  const advance = useCallback(() => {
    if (!isOwner()) return
    const current = playingIndexRef.current
    if (current === null) return
    if (current + 1 < segmentsRef.current.length) {
      void playIndex(current + 1)
      return
    }
    stop()
  }, [isOwner, playIndex, stop])

  useEffect(() => {
    const time = YohakuNative.addListener('onTtsTime', (event) => {
      if (!isOwner()) return
      timeLifecycle.handleTime(event)
    })
    const ended = YohakuNative.addListener('onTtsEnded', () => {
      if (isOwner()) advance()
    })
    const error = YohakuNative.addListener('onTtsError', () => {
      if (!isOwner()) return
      setFailed(true)
      stop()
    })
    const remote = YohakuNative.addListener('onTtsRemote', (event) => {
      if (!isOwner()) return
      if (event.action === 'play') setIsPlaying(true)
      if (event.action === 'pause') setIsPlaying(false)
      if (event.action === 'stop') stop()
    })
    const interrupted = YohakuNative.addListener(
      'onTtsInterrupted',
      (event) => {
        if (isOwner()) setIsPlaying(event.shouldResume)
      },
    )
    return () => {
      time.remove()
      ended.remove()
      error.remove()
      remote.remove()
      interrupted.remove()
      stop()
    }
  }, [advance, isOwner, stop, timeLifecycle])

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      timeLifecycle.handleAppStateChange,
    )
    return () => subscription.remove()
  }, [timeLifecycle])

  useFocusEffect(
    useCallback(() => {
      if (isOwner() && playingIndexRef.current !== null && hasTtsNative()) {
        void YohakuNative.playTts()
        setIsPlaying(true)
      }
      return () => {
        if (isOwner() && isPlayingRef.current && hasTtsNative()) {
          void YohakuNative.pauseTts()
          setIsPlaying(false)
        }
      }
    }, [isOwner]),
  )

  useEffect(() => {
    setActivated(false)
    setPlayOnReady(false)
    stop()
  }, [articleId, lang, stop])

  useEffect(() => {
    if (!playOnReady || !ttsQuery.data) return
    setPlayOnReady(false)
    if (ttsQuery.data.segments.length === 0) {
      setFailed(true)
      return
    }
    void playIndex(0)
  }, [playOnReady, ttsQuery.data, playIndex])

  useEffect(() => {
    if (ttsQuery.isError) setFailed(true)
  }, [ttsQuery.isError])

  useEffect(() => {
    if (failed) Alert.alert('', t('tts', 'error'))
  }, [failed])

  const start = useCallback(() => {
    if (!available) return
    setFailed(false)
    setAutoFollow(true)
    if (!activated) {
      setActivated(true)
      setPlayOnReady(true)
      return
    }
    if (ttsQuery.data) void playIndex(0)
    else setPlayOnReady(true)
  }, [activated, available, playIndex, ttsQuery.data])

  const toggle = useCallback(() => {
    if (!available) return
    if (!activated || playingIndex === null) {
      start()
      return
    }
    if (isPlaying) {
      if (hasTtsNative()) void YohakuNative.pauseTts()
      setIsPlaying(false)
      return
    }
    playerOwner = sessionId.current
    if (hasTtsNative()) void YohakuNative.playTts()
    setIsPlaying(true)
  }, [activated, available, isPlaying, playingIndex, start])

  const setRate = useCallback(
    (rate: number) => {
      if (!isTtsRate(rate) || rate === playbackRateRef.current) return
      setPlaybackRate(rate)
      if (isOwner() && hasTtsNative()) void YohakuNative.setTtsRate(rate)
    },
    [isOwner],
  )

  const recenter = useCallback(() => {
    setAutoFollow(true)
  }, [])

  const onScrollBeginDrag = useCallback(() => {
    if (isNarrating) setAutoFollow(false)
  }, [isNarrating])

  const activeBlockId =
    playingIndex === null ? null : (segments[playingIndex]?.blockId ?? null)

  return {
    activeBlockId,
    autoFollow,
    available,
    current: playingIndex === null ? 0 : playingIndex + 1,
    setRate,
    duration,
    elapsed,
    failed,
    isNarrating,
    onScrollBeginDrag,
    playbackRate,
    recenter,
    stale,
    start,
    status,
    stop,
    toggle,
    total: segments.length,
  }
}
