import type { FC, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'

interface Props {
  children: ReactNode
  className?: string
}

export const EyebrowPill: FC<Props> = ({ children, className }) => (
  <span
    className={clsxm(
      'shrink-0 rounded-md border border-border/60 bg-neutral-2/60 px-1.5 py-0.5 font-mono text-[0.7rem] text-neutral-7 dark:bg-neutral-3/40',
      className,
    )}
  >
    {children}
  </span>
)
