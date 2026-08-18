import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { SplashOverlay } from '@/components/splash/splash-overlay'
import { AppText, Button } from '@/components/ui'

interface Run {
  delay: number
  id: number
}

export function useSplashReplay() {
  const [run, setRun] = useState<Run | null>(null)
  const [readyId, setReadyId] = useState<number | null>(null)

  useEffect(() => {
    if (!run) return
    const timer = setTimeout(() => setReadyId(run.id), run.delay)
    return () => clearTimeout(timer)
  }, [run])

  const start = useCallback((delay: number) => {
    setRun((previous) => ({ id: (previous?.id ?? 0) + 1, delay }))
  }, [])

  const finish = useCallback(() => setRun(null), [])

  const overlay =
    run === null ? null : (
      <SplashOverlay
        revealed
        appPainted={readyId === run.id}
        failed={false}
        key={run.id}
        ready={readyId === run.id}
        onFinished={finish}
      />
    )

  return { start, overlay }
}

export function SplashReplayControls({
  onStart,
}: {
  onStart: (delay: number) => void
}) {
  return (
    <>
      <View style={styles.row}>
        <Button label="立即就绪" variant="paper" onPress={() => onStart(0)} />
        <Button
          label="延迟 1.5s"
          variant="paper"
          onPress={() => onStart(1500)}
        />
        <Button label="延迟 3s" variant="paper" onPress={() => onStart(3000)} />
      </View>
      <AppText variant="meta">
        延迟 1.5s 与 3s 会触发纸边屏息;屏息中途就绪时应从当前缝宽直接接上掀纸。
      </AppText>
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
})
