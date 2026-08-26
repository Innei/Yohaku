import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
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
      {...sx(
        atoms.mt_1, atoms.flex, atoms.flex_wrap, atoms.items_center, atoms.gap_x_1dot5, atoms.gap_y_0dot5, atoms.text__0dot8125rem, atoms.text_neutral_7,
        className,
      )}
    >
      {items.map((node, idx) => (
        <Fragment key={idx}>
          {idx > 0 && (
            <span {...sx(atoms.size__3px, atoms.shrink_0, atoms.rounded_full, atoms.bg_neutral_5)} />
          )}
          {node}
        </Fragment>
      ))}
    </div>
  )
}
