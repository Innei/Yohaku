import type { FC, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'

interface Props {
  children?: ReactNode
  className?: string
  size?: number
}

// Square placeholder for the right-side image slot when no provider cover
// image is available (paper / leetcode / fallback). Default content is the
// globe icon; pass `children` to override (e.g. brand glyph).
export const HostStamp: FC<Props> = ({ children, className, size = 3.5 }) => (
  <div
    style={{ width: `${size}rem`, height: `${size}rem` }}
    className={clsxm(
      'flex shrink-0 items-center justify-center rounded-lg bg-neutral-2 ring-1 ring-border/60 text-neutral-6',
      className,
    )}
  >
    {children ?? <GlobeIcon />}
  </div>
)

const GlobeIcon: FC = () => (
  <svg
    aria-hidden
    fill="none"
    height="28"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="28"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13.5 13.5 0 010 18" />
    <path d="M12 3a13.5 13.5 0 000 18" />
  </svg>
)
