export interface TtsTimeSnapshot {
  duration: number
  elapsed: number
}

export function createTtsTimeLifecycle({
  initiallyActive,
  publish,
}: {
  initiallyActive: boolean
  publish: (snapshot: TtsTimeSnapshot) => void
}) {
  let active = initiallyActive
  let latest: TtsTimeSnapshot = { duration: 0, elapsed: 0 }

  return {
    handleAppStateChange(state: string) {
      const nextActive = state === 'active'
      if (nextActive === active) return
      active = nextActive
      if (active) publish(latest)
    },
    handleTime(snapshot: TtsTimeSnapshot) {
      latest = snapshot
      if (active) publish(snapshot)
    },
    reset() {
      latest = { duration: 0, elapsed: 0 }
      if (active) publish(latest)
    },
  }
}
