import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { AppText, Button } from '@/components/ui'
import { useLocale } from '@/i18n'
import { usePalette } from '@/theme/palette'

const ARTICLE_A = `# 领养文章甲\n\n${'甲文段落,验证池化领养后的内容注入速度,尽量接近真实正文长度。'.repeat(
  30,
)}`
const ARTICLE_B = `# 领养文章乙\n\n${'乙文内容与甲不同,长度刻意错开,让 rendered 信号可以按长度匹配阶段。'.repeat(
  36,
)}`
const PROBE_CONTENT = '# retry-a\n\n内容变更探针,判别 $$props 是否丢失。'
const PROBE_VISIBLE = '# retry-b\n\n可见性探针,判别进程是否被挂起。'

const ROUND_GAPS_MS = [0, 10_000, 45_000, 180_000, 330_000]
const PHASE_TIMEOUT_MS = 15_000
const PROBE_TIMEOUT_MS = 6_000
const UNMOUNT_GAP_MS = 800

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Stage = { content: string; forceHeight?: boolean } | null

export function WebViewPoolLab() {
  const palette = usePalette()
  const locale = useLocale()
  const labels = useRichBodyLabels()
  const [stage, setStage] = useState<Stage>(null)
  const [status, setStatus] = useState('待机')
  const [logs, setLogs] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const waiterRef = useRef<{
    length: number
    resolve: (ms: number) => void
    start: number
  } | null>(null)

  const appendLog = (line: string) => {
    console.info('[pool-lab]', line)
    setLogs((prev) => [...prev, `${prev.length + 1}. ${line}`])
  }

  const waitRendered = (content: string, timeoutMs: number) =>
    new Promise<number | 'timeout'>((resolve) => {
      waiterRef.current = {
        length: content.length,
        start: Date.now(),
        resolve: (ms) => resolve(ms),
      }
      setTimeout(() => resolve('timeout'), timeoutMs)
    })

  const mountAndWait = async (
    label: string,
    content: string,
    timeoutMs: number,
    forceHeight?: boolean,
  ) => {
    const wait = waitRendered(content, timeoutMs)
    setStage({ content, forceHeight })
    const result = await wait
    appendLog(`${label}: ${result === 'timeout' ? 'TIMEOUT' : `${result}ms`}`)
    return result
  }

  const unmountGap = async () => {
    setStage(null)
    await sleep(UNMOUNT_GAP_MS)
  }

  const runAll = async () => {
    setRunning(true)
    setLogs([])
    for (const [round, gap] of ROUND_GAPS_MS.entries()) {
      if (gap > 0) {
        setStatus(`第 ${round + 1} 轮前闲置 ${gap / 1000}s`)
        await sleep(gap)
      }
      setStatus(`第 ${round + 1} 轮`)
      const boot = await mountAndWait(
        `r${round + 1} boot(空)`,
        '',
        PHASE_TIMEOUT_MS,
      )
      if (boot === 'timeout') {
        const probeA = await mountAndWait(
          `r${round + 1} 探针A(改内容)`,
          PROBE_CONTENT,
          PROBE_TIMEOUT_MS,
        )
        if (probeA === 'timeout') {
          await mountAndWait(
            `r${round + 1} 探针B(给高度)`,
            PROBE_VISIBLE,
            PROBE_TIMEOUT_MS,
            true,
          )
        }
      } else {
        await unmountGap()
        await mountAndWait(`r${round + 1} 甲`, ARTICLE_A, PHASE_TIMEOUT_MS)
        await unmountGap()
        await mountAndWait(`r${round + 1} 乙`, ARTICLE_B, PHASE_TIMEOUT_MS)
      }
      await unmountGap()
    }
    appendLog('全部轮次完成')
    setStatus('完成')
    setRunning(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => void runAll(), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    let payload: { type?: string; length?: number }
    try {
      payload = JSON.parse(event.nativeEvent.data) as typeof payload
    } catch {
      return
    }
    if (payload.type !== 'yohaku:rendered') return
    const waiter = waiterRef.current
    if (!waiter || payload.length !== waiter.length) return
    waiterRef.current = null
    waiter.resolve(Date.now() - waiter.start)
  }

  return (
    <View style={styles.root}>
      <Button
        disabled={running}
        label={running ? `运行中 · ${status}` : '运行判别序列'}
        onPress={() => void runAll()}
      />
      {logs.map((line) => (
        <AppText key={line} variant="meta">
          {line}
        </AppText>
      ))}
      {stage ? (
        <View style={[styles.stage, { borderColor: palette.neutral[3] }]}>
          <RichBody
            apiBase={apiBaseUrl()}
            content={stage.content}
            labels={labels}
            locale={locale}
            theme={palette.theme}
            variant="article"
            webUrl=""
            dom={{
              matchContents: true,
              scrollEnabled: false,
              onMessage: handleMessage,
              style: stage.forceHeight ? { height: 140 } : undefined,
            }}
            onImagePress={async () => {}}
            onLinkPress={async () => {}}
            onScrollToAnchor={async () => {}}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  stage: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
})
