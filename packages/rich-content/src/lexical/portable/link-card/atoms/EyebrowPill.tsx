import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'

interface Props {
  children: ReactNode
  className?: string
}

export const EyebrowPill: FC<Props> = ({ children, className }) => (
  <span
    {...sx(
      atoms.shrink_0, atoms.rounded_md, atoms.border, atoms.border_border_60, atoms.bg_neutral_2_60, atoms.px_1dot5, atoms.py_0dot5, atoms.font_mono, atoms.text__0dot7rem, atoms.text_neutral_7, atoms.dark_bg_neutral_3_40,
      className,
    )}
  >
    {children}
  </span>
)
