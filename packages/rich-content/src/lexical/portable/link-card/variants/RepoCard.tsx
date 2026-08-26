import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC, ReactNode } from 'react'

import type { HostEnrichment } from '../../../../host'
import {
  AsideAvatar,
  EyebrowPill,
  GhCardLayout,
  RepoIcon,
  StarIcon,
} from '../atoms'
import { findAttr, fmtCount } from '../enrichment'
import { LanguageToColorMap } from '../language-colors'

interface Props {
  className?: string
  data: HostEnrichment
}

function splitOwner(title: string): { owner: string | null; name: string } {
  const idx = title.lastIndexOf('/')
  if (idx < 0) return { owner: null, name: title }
  return { owner: title.slice(0, idx), name: title.slice(idx + 1) }
}

export const RepoCard: FC<Props> = ({ data, className }) => {
  const language =
    typeof findAttr(data, 'language')?.value === 'string'
      ? (findAttr(data, 'language')!.value as string)
      : null
  const langColor = language
    ? LanguageToColorMap[language.toLowerCase()]
    : undefined

  const stars = findAttr(data, 'stars')
  const starCount = typeof stars?.value === 'number' ? stars.value : null

  const { owner, name } = splitOwner(data.title)
  const ownerAvatar = data.thumbnailImage?.url

  const meta: ReactNode[] = []
  if (language) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="lang">
        <span
          aria-hidden
          {...sx(atoms.inline_block, atoms.size_2, atoms.rounded_full)}
          style={langColor ? { backgroundColor: langColor } : undefined}
        />
        {language}
      </span>,
    )
  }

  return (
    <GhCardLayout
      className={className}
      href={data.url}
      meta={meta}
      tintColor={langColor}
      title={{ text: name }}
      aside={
        ownerAvatar ? (
          <AsideAvatar alt={data.title} src={ownerAvatar} />
        ) : undefined
      }
      body={
        data.description ? (
          <div {...sx(atoms.line_clamp_2, atoms.text__0dot9375rem, atoms.leading_relaxed, atoms.text_neutral_7)}>
            {data.description}
          </div>
        ) : undefined
      }
      eyebrow={{
        icon: <RepoIcon {...sx(atoms.size_3dot5)} />,
        kind: 'Repository',
        repo: owner,
        pill:
          starCount !== null && starCount > 0 ? (
            <EyebrowPill {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.border_transparent, atoms.bg_transparent, atoms.px_0, atoms.text_warning, atoms.dark_bg_transparent)}>
              <StarIcon size="0.7rem" />
              {fmtCount(starCount)}
            </EyebrowPill>
          ) : undefined,
      }}
    />
  )
}
