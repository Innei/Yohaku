import type { FC, MouseEvent, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'
import { InkWash } from './InkWash'

interface Props {
  children: ReactNode
  className?: string
  external?: boolean
  href: string
  innerClassName?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  style?: React.CSSProperties
  vertical?: boolean
}

// Pin typography explicitly. `.not-prose` disables `.prose` rules but does
// not reset inherited values, so without these the card silently picks up
// the article's serif/italic/leading. Inner variant elements override the
// scalars they care about (e.g. `text-copy-16 font-medium` for titles).
// `isolate` confines the ink wash's negative z-index to this stacking context
// — it sinks below variant content (e.g. RepoCard's language wash) but stays
// above the shell's background.
const baseClass = clsxm(
  'yohaku-link-card group relative isolate not-prose no-underline cursor-pointer',
  'my-4 w-full max-w-full overflow-hidden',
  'rounded-xl',
  'bg-neutral-1 dark:bg-neutral-2 text-neutral-9',
  'ring-1 ring-border',
  'transition-colors duration-200',
  'font-sans text-copy-14 font-normal not-italic leading-normal tracking-normal',
)

const horizontalClass =
  'flex flex-row items-center gap-5 min-h-[6.5rem] px-6 py-4'
const verticalClass = 'flex flex-col items-stretch'

export const LinkCardShell: FC<Props> = ({
  href,
  external,
  className,
  innerClassName,
  onClick,
  style,
  vertical,
  children,
}) => {
  const layoutClass = vertical ? verticalClass : horizontalClass

  return (
    <a
      data-hide-print
      className={clsxm(baseClass, layoutClass, className)}
      href={href}
      rel={external ? 'noreferrer' : undefined}
      style={style}
      target={external ? '_blank' : undefined}
      onClick={onClick}
    >
      <InkWash />
      <div
        className={clsxm(
          'flex w-full',
          vertical ? 'flex-col items-stretch' : 'items-center gap-5',
          innerClassName,
        )}
      >
        {children}
      </div>
    </a>
  )
}
