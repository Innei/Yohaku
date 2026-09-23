import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { radius } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import type { ApiPollState } from '@/api/types'
import { AppText, NativePressable, Paper, SlotText } from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { UnsupportedBlock } from './card-blocks'
import { optimisticVote, type PollOption, pollRows } from './poll'
import { useBoneColor } from './skeleton'
import { type BlockProps, str } from './types'

const ROW_RADIUS = radius.control

function pollQueryKey(pollId: string) {
  return ['poll', pollId] as const
}

function optionsOf(node: BlockProps['node']): PollOption[] {
  const raw = node.options
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const id = str((entry as Record<string, unknown>).id)
    const label = str((entry as Record<string, unknown>).label)
    return id && label ? [{ id, label }] : []
  })
}

function PollSkeleton({ optionCount }: { optionCount: number }) {
  const bone = { backgroundColor: useBoneColor() }
  return (
    <Paper style={styles.card}>
      <View style={styles.headerCol}>
        <View style={[styles.skeletonLine, { width: '40%' }, bone]} />
        <View
          style={[styles.skeletonLine, { height: 20, width: '70%' }, bone]}
        />
      </View>
      <View style={styles.optionCol}>
        {Array.from({ length: Math.max(optionCount, 3) }).map((_, index) => (
          <View key={index} style={[styles.row, bone]} />
        ))}
      </View>
    </Paper>
  )
}

export function PollBlock({ blockId, node }: BlockProps) {
  const palette = usePalette()
  const queryClient = useQueryClient()
  const pollId = str(node.pollId)
  const question = str(node.question)
  const options = optionsOf(node)
  const multiple = node.mode === 'multiple'
  const [pickedLocal, setPickedLocal] = useState<string[]>([])

  const query = useQuery({
    enabled: pollId !== '',
    queryFn: () => api.pollState(pollId),
    queryKey: pollQueryKey(pollId),
  })

  const vote = useMutation({
    mutationFn: (optionIds: string[]) => api.pollVote(pollId, optionIds),
    onMutate: async (optionIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: pollQueryKey(pollId) })
      const previous = queryClient.getQueryData<ApiPollState>(
        pollQueryKey(pollId),
      )
      if (previous) {
        queryClient.setQueryData(
          pollQueryKey(pollId),
          optimisticVote(previous, optionIds),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pollQueryKey(pollId), context.previous)
      }
      showToast('投票失败，请稍后再试')
    },
    onSuccess: (data) => {
      queryClient.setQueryData(pollQueryKey(pollId), data)
      setPickedLocal([])
    },
  })

  if (pollId === '' || question === '' || options.length === 0) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  if (query.isPending) return <PollSkeleton optionCount={options.length} />
  if (query.isError || !query.data) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const state = query.data
  const hasVoted = (state.userVote?.length ?? 0) > 0
  const showResults = hasVoted || state.closed || !state.canVote
  const rows = pollRows(
    options,
    state,
    multiple && !hasVoted ? pickedLocal : undefined,
  )
  const canInteract = state.canVote && !hasVoted && !vote.isPending

  const toggleLocal = (optionId: string) => {
    setPickedLocal((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    )
  }

  const pickSingle = (optionId: string) => {
    if (!canInteract) return
    vote.mutate([optionId])
  }

  const submitMultiple = () => {
    if (!canInteract || pickedLocal.length === 0) return
    vote.mutate(pickedLocal)
  }

  const footerLabel = hasVoted
    ? '已投票'
    : state.closed
      ? '投票已结束'
      : '点选一项即投票 · 投票后显示结果'

  return (
    <Paper accessibilityLabel="投票" style={styles.card}>
      <View style={styles.headerCol}>
        <View style={styles.eyebrowRow}>
          <AppText color={palette.neutral[6]} variant="meta">
            {'投票 · '}
          </AppText>
          <SlotText
            value={state.totalVotes}
            textStyle={{
              ...fonts.sans,
              fontSize: 12,
              lineHeight: 16,
              color: palette.neutral[6],
            }}
          />
          <AppText color={palette.neutral[6]} variant="meta">
            {' 人参与'}
          </AppText>
        </View>
        <AppText variant="entryTitle">{question}</AppText>
      </View>
      <View style={styles.optionCol}>
        {rows.map((row) => {
          const selected = showResults
            ? row.mine
            : multiple && pickedLocal.includes(row.id)
          const rowDisabled = !state.canVote || hasVoted || vote.isPending
          return (
            <NativePressable
              accessibilityLabel={`${row.label}${showResults ? `，${row.pct}%` : ''}`}
              disabled={rowDisabled}
              key={row.id}
              style={[
                styles.row,
                {
                  backgroundColor: palette.surface.desk,
                  borderColor: selected ? palette.accent : 'transparent',
                },
              ]}
              onPress={
                multiple ? () => toggleLocal(row.id) : () => pickSingle(row.id)
              }
            >
              {showResults ? (
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: row.mine
                        ? `${palette.accent}33`
                        : `${palette.neutral[10]}0f`,
                      width: `${row.pct}%`,
                    },
                  ]}
                />
              ) : null}
              <AppText
                numberOfLines={2}
                style={styles.optionLabel}
                variant="body"
              >
                {row.label}
              </AppText>
              {selected ? (
                <SymbolView
                  name="checkmark"
                  size={16}
                  tintColor={palette.accent}
                />
              ) : null}
              {showResults ? (
                <View style={styles.percent}>
                  <SlotText
                    value={`${row.pct}%`}
                    textStyle={{
                      ...fonts.mono,
                      fontSize: 13,
                      lineHeight: 20,
                      color: palette.neutral[7],
                    }}
                  />
                </View>
              ) : null}
            </NativePressable>
          )
        })}
      </View>
      {multiple && !hasVoted ? (
        <NativePressable
          accessibilityLabel="提交投票"
          disabled={!canInteract || pickedLocal.length === 0}
          style={styles.submit}
          onPress={submitMultiple}
        >
          <AppText
            variant="secondary"
            color={
              pickedLocal.length === 0 ? palette.neutral[5] : palette.accent
            }
          >
            投票
          </AppText>
        </NativePressable>
      ) : (
        <AppText color={palette.neutral[6]} variant="meta">
          {footerLabel}
        </AppText>
      )}
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { gap: 14, marginVertical: 12, padding: 16 },
  eyebrowRow: { alignItems: 'baseline', flexDirection: 'row' },
  fill: {
    borderRadius: ROW_RADIUS,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  headerCol: { gap: 6 },
  optionCol: { gap: 8 },
  optionLabel: { flex: 1 },
  percent: { alignItems: 'flex-end', minWidth: 36 },
  row: {
    alignItems: 'center',
    borderRadius: ROW_RADIUS,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  skeletonLine: { borderRadius: 6, height: 10 },
  submit: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
  },
})
