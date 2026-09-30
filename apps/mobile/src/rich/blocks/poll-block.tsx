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
import {
  optimisticVote,
  pollEyebrowSuffix,
  pollFooter,
  type PollOption,
  pollRows,
} from './poll'
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

  const footerLabel = pollFooter({ closed: state.closed, hasVoted })

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
            {` 人参与${pollEyebrowSuffix({ closed: state.closed, hasVoted })}`}
          </AppText>
        </View>
        <AppText variant="entryTitle">{question}</AppText>
      </View>
      <View style={styles.optionCol}>
        {rows.map((row) => {
          const picked = multiple && pickedLocal.includes(row.id)
          const rowDisabled = !state.canVote || hasVoted || vote.isPending
          return (
            <NativePressable
              accessibilityLabel={`${row.label}${showResults ? `，${row.pct}%` : ''}`}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: showResults ? row.mine : picked }}
              disabled={rowDisabled}
              key={row.id}
              style={[styles.row, { backgroundColor: palette.surface.desk }]}
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
                        ? `${palette.accent}29`
                        : `${palette.neutral[10]}0d`,
                      width: `${row.pct}%`,
                    },
                  ]}
                />
              ) : null}
              {showResults && !row.mine ? (
                <View style={styles.mark} />
              ) : (
                <View
                  style={[
                    styles.mark,
                    multiple ? styles.box : styles.ring,
                    row.mine || picked
                      ? {
                          backgroundColor: palette.accent,
                          borderColor: palette.accent,
                        }
                      : { borderColor: palette.neutral[4] },
                  ]}
                >
                  {row.mine || picked ? (
                    <SymbolView
                      name="checkmark"
                      size={10}
                      tintColor={palette.surface.paper}
                      weight="bold"
                    />
                  ) : null}
                </View>
              )}
              <AppText
                color={
                  showResults && !row.mine ? palette.neutral[7] : undefined
                }
                numberOfLines={2}
                style={styles.optionLabel}
              >
                {row.label}
              </AppText>
              {showResults ? (
                <View style={styles.percent}>
                  <SlotText
                    value={`${row.pct}%`}
                    textStyle={{
                      ...fonts.mono,
                      fontSize: 13,
                      lineHeight: 20,
                      color: row.mine ? palette.neutral[9] : palette.neutral[6],
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
      ) : footerLabel ? (
        <AppText color={palette.neutral[6]} variant="meta">
          {footerLabel}
        </AppText>
      ) : null}
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { gap: 14, marginVertical: 12, padding: 16 },
  eyebrowRow: { alignItems: 'baseline', flexDirection: 'row' },
  fill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  headerCol: { gap: 6 },
  optionCol: { gap: 8 },
  optionLabel: { flex: 1, fontSize: 15, lineHeight: 22 },
  mark: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  ring: { borderRadius: 9, borderWidth: 1.5 },
  box: { borderRadius: 5, borderWidth: 1.5 },
  percent: { alignItems: 'flex-end', minWidth: 36 },
  row: {
    alignItems: 'center',
    borderRadius: ROW_RADIUS,
    flexDirection: 'row',
    gap: 12,
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
