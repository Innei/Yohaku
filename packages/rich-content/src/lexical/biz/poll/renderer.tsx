'use client'
import { sx } from '../../../lib/sx'
import { atoms } from '../../../styles/atoms.stylex'

import type {
  PollDataAdapter,
  PollOption,
  PollRendererProps,
  PollShowResults,
  PollState,
} from '@haklex/rich-compose/modules/poll'
import {
  useInitialPollState,
  usePollDataAdapter,
} from '@haklex/rich-compose/modules/poll'
import { usePrintFallback } from '../../../host'
import clsx from 'clsx'
import { useCallback, useMemo, useState } from 'react'

const FALLBACK_STATE: PollState = {
  tallies: {},
  totalVotes: 0,
  status: 'loading',
  closed: false,
  canVote: false,
}

function shouldShowTallies(
  state: PollState,
  showResults?: PollShowResults,
): boolean {
  if (showResults === 'after-vote')
    return state.userVote !== undefined || state.closed
  if (showResults === 'after-close') return state.closed
  return true
}

function PollFrame({
  children,
  closed,
}: {
  children: React.ReactNode
  closed?: boolean
}) {
  return (
    <div
      {...sx(
        atoms.border_accent, atoms.my_4, atoms.border_l_2, atoms.py_1, atoms.pl_4,
        closed && atoms.opacity_70,
      )}
    >
      {children}
    </div>
  )
}

function PollStaticFallback({ question, options }: PollRendererProps) {
  return (
    <PollFrame>
      <p {...sx(atoms.text_neutral_10, atoms.mb_3, atoms.text_copy_14, atoms.font_medium)}>
        {question}
      </p>
      <ul {...sx(atoms.m_0, atoms.list_none, atoms.p_0)}>
        {options.map((option) => (
          <li
            {...sx(atoms.text_neutral_7, atoms.border_border, atoms.flex, atoms.items_baseline, atoms.justify_between, atoms.gap_3, atoms.border_b, atoms.py__9px, atoms.last_border_b_0)}
            key={option.id}
          >
            <span>{option.label}</span>
          </li>
        ))}
      </ul>
    </PollFrame>
  )
}

interface PollInteractiveProps {
  adapter: PollDataAdapter
  closeAt?: string
  mode: 'single' | 'multiple'
  options: PollOption[]n  pollId: string
  question: string
  showResults?: PollShowResults
}

function PollInteractive({
  adapter,
  closeAt,
  mode,
  options,
  pollId,
  question,
  showResults,
}: PollInteractiveProps) {
  const initialState = useInitialPollState(pollId)
  const liveState = adapter.usePollState(pollId)
  const submit = adapter.useSubmit(pollId)
  const state: PollState = liveState ?? initialState ?? FALLBACK_STATE

  const [pendingSelection, setPendingSelection] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showTallies = shouldShowTallies(state, showResults)
  const userVoted = state.userVote !== undefined
  const isClosed = state.closed
  const canInteract = !isClosed && state.canVote && state.status !== 'loading'

  const tallyShare = useCallback(
    (optionId: string): number => {
      if (!showTallies || state.totalVotes <= 0) return 0
      const tally = state.tallies[optionId] ?? 0
      return Math.max(0, Math.min(1, tally / state.totalVotes))
    },
    [showTallies, state.tallies, state.totalVotes],
  )

  const handleSingleClick = useCallback(
    async (optionId: string) => {
      if (!canInteract || isSubmitting) return
      setIsSubmitting(true)
      try {
        await submit([optionId])
      } finally {
        setIsSubmitting(false)
      }
    },
    [canInteract, isSubmitting, submit],
  )

  const handleMultiToggle = useCallback(
    (optionId: string) => {
      if (!canInteract || isSubmitting) return
      setPendingSelection((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      )
    },
    [canInteract, isSubmitting],
  )

  const handleMultiSubmit = useCallback(async () => {
    if (!canInteract || isSubmitting || pendingSelection.length === 0) return
    setIsSubmitting(true)
    try {
      await submit([...pendingSelection])
      setPendingSelection([])
    } finally {
      setIsSubmitting(false)
    }
  }, [canInteract, isSubmitting, pendingSelection, submit])

  const showCounts = useMemo(() => userVoted || isClosed, [userVoted, isClosed])

  if (state.status === 'loading') {
    return (
      <PollFrame>
        <div {...sx(atoms.bg_neutral_3, atoms.mb_4, atoms.h__1dot1rem, atoms.w_3_5, atoms.animate_pulse, atoms.rounded_sm)} />
        {options.map((option) => (
          <div
            {...sx(atoms.bg_neutral_3, atoms.my__9px, atoms.h_5, atoms.animate_pulse, atoms.rounded_sm)}
            key={option.id}
          />
        ))}
      </PollFrame>
    )
  }

  return (
    <PollFrame closed={isClosed}>
      <p {...sx(atoms.text_neutral_10, atoms.mb_3, atoms.text_copy_14, atoms.font_medium)}>
        {question}
      </p>
      <ul {...sx(atoms.m_0, atoms.list_none, atoms.p_0)}>
        {options.map((option) => {
          const isUserChoice = state.userVote?.includes(option.id) ?? false
          const isPending = pendingSelection.includes(option.id)
          const labelHighlighted = isUserChoice || isPending
          const share = tallyShare(option.id)

          const handleClick = canInteract
            ? mode === 'single'
              ? () => handleSingleClick(option.id)
              : () => handleMultiToggle(option.id)
            : undefined

          return (
            <li
              key={option.id}
              {...sx(atoms.border_border, atoms.relative, atoms.flex, atoms.items_baseline, atoms.justify_between, atoms.gap_3, atoms.border_b, atoms.py__9px, atoms.transition_colors, atoms.duration_150, atoms.last_border_b_0, canInteract ? atoms.cursor_pointer : atoms.cursor_default, labelHighlighted
                  ? [atoms.text_neutral_10, atoms.font_medium]
                  : canInteract
                    ? [atoms.text_neutral_7, atoms.hover_text_neutral_9]
                    : atoms.text_neutral_7)} data-group=""
              onClick={handleClick}
              {...(canInteract
                ? {
                    role: 'button',
                    tabIndex: 0,
                    onKeyDown: (event: React.KeyboardEvent<HTMLLIElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleClick?.()
                      }
                    },
                  }
                : {})}
            >
              <span
                aria-hidden
                {...sx(atoms.pointer_events_none, atoms.absolute, atoms._bottom_px, atoms.left_0, atoms.h_px, atoms.transition__width_background_color, atoms.duration_300, isPending && mode === 'multiple'
                    ? [atoms.bg_accent_50, atoms.w_fullimportant_]
                    : isUserChoice
                      ? atoms.bg_accent
                      : atoms.bg_neutral_4)}
                style={{
                  width:
                    isPending && mode === 'multiple'
                      ? undefined
                      : `${share * 100}%`,
                }}
              />
              <span {...sx(atoms.min_w_0, atoms.flex_1)}>{option.label}</span>
              {showCounts ? (
                <span
                  {...sx(
                    atoms.font_mono, atoms.text_label_12, atoms.tabular_nums,
                    labelHighlighted ? atoms.text_neutral_10 : atoms.text_neutral_6,
                  )}
                >
                  {Math.round(share * 100)}%
                </span>
              ) : canInteract && mode === 'single' ? (
                <span {...sx(atoms.text_neutral_5, atoms.font_mono, atoms.text__0dot7rem, atoms.opacity_0, atoms.transition_opacity, atoms.duration_150, atoms.group_hover_opacity_100)}>
                  点选即投
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      {canInteract && mode === 'multiple' && (
        <div {...sx(atoms.mt_3)}>
          <button
            aria-busy={isSubmitting || undefined}
            disabled={pendingSelection.length === 0 || isSubmitting}
            type="button"
            {...sx(
              atoms.inline_flex, atoms.select_none, atoms.items_center, atoms.justify_center, atoms.gap_1dot5, atoms.rounded_md, atoms.border, atoms.px_2dot5, atoms.py_0dot5, atoms.text_label_12, atoms.font_medium, atoms.transition_all, atoms.duration_200,
              atoms.border_accent_30, atoms.bg_accent_8, atoms.text_accent, atoms.hover_bg_accent_12, atoms.hover_border_accent_45,
              atoms.disabled_cursor_not_allowed, atoms.disabled_border_accent_15, atoms.disabled_bg_accent_4, atoms.disabled_text_accent_40,
            )}
            onClick={handleMultiSubmit}
          >
            {isSubmitting
              ? '提交中…'
              : pendingSelection.length === 0
                ? '提交'
                : `提交 · ${pendingSelection.length} 项`}
          </button>
        </div>
      )}

      <div {...sx(atoms.text_neutral_6, atoms.mt_3, atoms.flex, atoms.justify_between, atoms.font_mono, atoms.text__0dot7rem)}>
        {showCounts && state.totalVotes > 0 ? (
          <span>{state.totalVotes.toLocaleString()} 票</span>
        ) : (
          <span />
        )}
        {isClosed ? (
          <span {...sx(atoms.text_accent)}>已闭</span>
        ) : closeAt ? (
          <span>{closeAt} 截</span>
        ) : (
          <span />
        )}
      </div>

      {state.status === 'error' && state.errorMessage ? (
        <p {...sx(atoms.text_error, atoms.mt_2, atoms.font_mono, atoms.text__0dot7rem)}>
          {state.errorMessage}
        </p>
      ) : !state.canVote && !userVoted && !isClosed && state.errorMessage ? (
        <p {...sx(atoms.text_neutral_6, atoms.mt_2, atoms.font_mono, atoms.text__0dot7rem)}>
          {state.errorMessage}
        </p>
      ) : null}
    </PollFrame>
  )
}

export function YohakuPollRenderer(props: PollRendererProps) {
  const printFallback = usePrintFallback('poll', {
    count: props.options.length,
    question: props.question,
  })
  const adapter = usePollDataAdapter()
  if (printFallback !== null) {
    return <p className="print-block-fallback">{printFallback}</p>
  }
  if (!adapter) return <PollStaticFallback {...props} />
  return <PollInteractive adapter={adapter} {...props} />
}
