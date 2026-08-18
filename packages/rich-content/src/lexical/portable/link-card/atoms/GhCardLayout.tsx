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
      className={clsxm('w-full max-w-[36rem]', className)}
      href={href}
      style={borderStyle}
    >
      {tintColor && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={washStyle}
        />
      )}
      <div className="relative z-[1] min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex min-w-0 items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.06em] text-neutral-6 uppercase">
            {eyebrow.icon}
            <span className="truncate">
              {eyebrow.kind}
              {repoLabel}
            </span>
          </div>
          {eyebrow.pill}
        </div>

        <div className="mt-2 flex items-start gap-2">
          {title.leadingIcon}
          <span className="line-clamp-2 flex-1 text-copy-16 leading-snug font-medium text-neutral-10">
            {title.text}
          </span>
        </div>

        {body && <div className="mt-2">{body}</div>}

        {meta && meta.length > 0 && <MetaRow>{meta}</MetaRow>}
      </div>

      {aside && <div className="relative z-[1] shrink-0">{aside}</div>}
    </LinkCardShell>
  )
}
