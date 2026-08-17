import type { FC } from 'react'

import { clsxm } from '../../../../lib/clsxm'

export type StateTone = 'info' | 'success' | 'warning' | 'error' | 'neutral'

const TONE_TEXT: Record<StateTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-neutral-7',
}

const TONE_DOT: Record<StateTone, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-neutral-6',
}

interface Props {
  className?: string
  label: string
  tone: StateTone
}

export const StatePill: FC<Props> = ({ tone, label, className }) => (
  <span
    className={clsxm(
      'inline-flex items-center gap-1 font-medium',
      TONE_TEXT[tone],
      className,
    )}
  >
    <span
      className={clsxm('inline-block size-1.5 rounded-full', TONE_DOT[tone])}
    />
    {label}
  </span>
)
