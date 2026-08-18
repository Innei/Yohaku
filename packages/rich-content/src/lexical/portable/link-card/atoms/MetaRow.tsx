import type { FC, ReactNode } from 'react'
import { Children, Fragment } from 'react'

import { clsxm } from '../../../../lib/clsxm'

interface Props {
  children: ReactNode
  className?: string
}

// Dot-separated meta line: children render with `·` separators between
// non-falsy nodes ("open · #42891 · 24 comments"). Falsy children drop out.
export const MetaRow: FC<Props> = ({ children, className }) => {
  const items = Children.toArray(children).filter(Boolean)
  if (!items.length) return null
  return (
    <div
      className={clsxm(
        'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.8125rem] text-neutral-7',
        className,
      )}
    >
      {items.map((node, idx) => (
        <Fragment key={idx}>
          {idx > 0 && (
            <span className="size-[3px] shrink-0 rounded-full bg-neutral-5" />
          )}
          {node}
        </Fragment>
      ))}
    </div>
  )
}
