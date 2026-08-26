import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
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
    {...sx(
      atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.font_medium,
      TONE_TEXT[tone],
      className,
    )}
  >
    <span
      {...sx(atoms.inline_block, atoms.size_1dot5, atoms.rounded_full, TONE_DOT[tone])}
    />
    {label}
  </span>
)
