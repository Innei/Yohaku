import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import { extras } from '../../../../styles/extras.stylex'
import type { CSSProperties, FC, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'
import { LinkCardShell } from './LinkCardShell'
import { MetaRow } from './MetaRow'

interface EyebrowProps {
  icon?: ReactNode
  kind: string
  pill?: ReactNode
  repo?: string | null
}

interface TitleProps {
  leadingIcon?: ReactNode
  text: string
}

interface Props {
  aside?: ReactNode
  body?: ReactNode
  className?: string
  eyebrow: EyebrowProps
  href: string
  meta?: ReactNode[]
  tintColor?: string
  title: TitleProps
}

export const GhCardLayout: FC<Props> = ({
  href,
  className,
  tintColor,
  eyebrow,
  title,
  body,
  meta,
  aside,
}) => {
  const borderStyle: CSSProperties | undefined = tintColor
    ? { borderColor: `${tintColor}4d` }
    : undefined
  const washStyle: CSSProperties | undefined = tintColor
    ? { backgroundColor: tintColor }
    : undefined
  const repoLabel = eyebrow.repo ? ` · ${eyebrow.repo}` : ''

  return (
    <LinkCardShell
      external
      {...sx(atoms.w_full, atoms.max_w__36rem, className)}
      href={href}
      style={borderStyle}
    >
      {tintColor && (
        <span
          aria-hidden
          {...sx(extras.opacity06, atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms.z_0)}
          style={washStyle}
        />
      )}
      <div {...sx(atoms.relative, atoms.z__1, atoms.min_w_0, atoms.flex_1)}>
        <div {...sx(atoms.flex, atoms.items_center, atoms.justify_between, atoms.gap_3)}>
          <div {...sx(atoms.inline_flex, atoms.min_w_0, atoms.items_center, atoms.gap_1dot5, atoms.text__0dot7rem, atoms.font_medium, atoms.tracking__0dot06em, atoms.text_neutral_6, atoms.uppercase)}>
            {eyebrow.icon}
            <span {...sx(atoms.truncate)}>
              {eyebrow.kind}
              {repoLabel}
            </span>
          </div>
          {eyebrow.pill}
        </div>

        <div {...sx(atoms.mt_2, atoms.flex, atoms.items_start, atoms.gap_2)}>
          {title.leadingIcon}
          <span {...sx(atoms.line_clamp_2, atoms.flex_1, atoms.text_copy_16, atoms.leading_snug, atoms.font_medium, atoms.text_neutral_10)}>
            {title.text}
          </span>
        </div>

        {body && <div {...sx(atoms.mt_2)}>{body}</div>}

        {meta && meta.length > 0 && <MetaRow>{meta}</MetaRow>}
      </div>

      {aside && <div {...sx(atoms.relative, atoms.z__1, atoms.shrink_0)}>{aside}</div>}
    </LinkCardShell>
  )
}
