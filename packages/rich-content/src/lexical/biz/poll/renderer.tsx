'use client'

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
      className={clsx(
        'border-accent my-4 border-l-2 py-1 pl-4',
        closed && 'opacity-70',
      )}
    >
      {children}
    </div>
  )
}

function PollStaticFallback({ question, options }: PollRendererProps) {
  return (
    <PollFrame>
      <p className="text-neutral-10 mb-3 text-copy-14 font-medium">
        {question}
      </p>
      <ul className="m-0 list-none p-0">
        {options.map((option) => (
          <li
            className="text-neutral-7 border-border flex items-baseline justify-between gap-3 border-b py-[9px] last:border-b-0"
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
  options: PollOption[]
  pollId: string
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
        <div className="bg-neutral-3 mb-4 h-[1.1rem] w-3/5 animate-pulse rounded-sm" />
        {options.map((option) => (
          <div
            className="bg-neutral-3 my-[9px] h-5 animate-pulse rounded-sm"
            key={option.id}
          />
        ))}
      </PollFrame>
    )
  }

  return (
    <PollFrame closed={isClosed}>
      <p className="text-neutral-10 mb-3 text-copy-14 font-medium">
        {question}
      </p>
      <ul className="m-0 list-none p-0">
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
              className={clsx(
                'group border-border relative flex items-baseline justify-between gap-3 border-b py-[9px] transition-colors duration-150 last:border-b-0',
                canInteract ? 'cursor-pointer' : 'cursor-default',
                labelHighlighted
                  ? 'text-neutral-10 font-medium'
                  : canInteract
                    ? 'text-neutral-7 hover:text-neutral-9'
                    : 'text-neutral-7',
              )}
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
                className={clsx(
                  'pointer-events-none absolute -bottom-px left-0 h-px transition-[width,background-color] duration-300',
                  isPending && mode === 'multiple'
                    ? 'bg-accent/50 w-full!'
                    : isUserChoice
                      ? 'bg-accent'
                      : 'bg-neutral-4',
                )}
                style={{
                  width:
                    isPending && mode === 'multiple'
                      ? undefined
                      : `${share * 100}%`,
                }}
              />
              <span className="min-w-0 flex-1">{option.label}</span>
              {showCounts ? (
                <span
                  className={clsx(
                    'font-mono text-label-12 tabular-nums',
                    labelHighlighted ? 'text-neutral-10' : 'text-neutral-6',
                  )}
                >
                  {Math.round(share * 100)}%
                </span>
              ) : canInteract && mode === 'single' ? (
                <span className="text-neutral-5 font-mono text-[0.7rem] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  点选即投
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      {canInteract && mode === 'multiple' && (
        <div className="mt-3">
          <button
            aria-busy={isSubmitting || undefined}
            disabled={pendingSelection.length === 0 || isSubmitting}
            type="button"
            className={clsx(
              'inline-flex select-none items-center justify-center gap-1.5 rounded-md border px-2.5 py-0.5 text-label-12 font-medium transition-all duration-200',
              'border-accent/30 bg-accent/8 text-accent hover:bg-accent/12 hover:border-accent/45',
              'disabled:cursor-not-allowed disabled:border-accent/15 disabled:bg-accent/4 disabled:text-accent/40',
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

      <div className="text-neutral-6 mt-3 flex justify-between font-mono text-[0.7rem]">
        {showCounts && state.totalVotes > 0 ? (
          <span>{state.totalVotes.toLocaleString()} 票</span>
        ) : (
          <span />
        )}
        {isClosed ? (
          <span className="text-accent">已闭</span>
        ) : closeAt ? (
          <span>{closeAt} 截</span>
        ) : (
          <span />
        )}
      </div>

      {state.status === 'error' && state.errorMessage ? (
        <p className="text-error mt-2 font-mono text-[0.7rem]">
          {state.errorMessage}
        </p>
      ) : !state.canVote && !userVoted && !isClosed && state.errorMessage ? (
        <p className="text-neutral-6 mt-2 font-mono text-[0.7rem]">
          {state.errorMessage}
        </p>
      ) : null}
    </PollFrame>
  )
}

export function YohakuPollRenderer(props: PollRendererProps) {
  const adapter = usePollDataAdapter()
  if (!adapter) return <PollStaticFallback {...props} />
  return <PollInteractive adapter={adapter} {...props} />
}
