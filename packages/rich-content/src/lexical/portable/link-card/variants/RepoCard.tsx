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
      <span className="inline-flex items-center gap-1.5" key="lang">
        <span
          aria-hidden
          className="inline-block size-2 rounded-full"
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
          <div className="line-clamp-2 text-[0.9375rem] leading-relaxed text-neutral-7">
            {data.description}
          </div>
        ) : undefined
      }
      eyebrow={{
        icon: <RepoIcon className="size-3.5" />,
        kind: 'Repository',
        repo: owner,
        pill:
          starCount !== null && starCount > 0 ? (
            <EyebrowPill className="inline-flex items-center gap-1 border-transparent bg-transparent px-0 text-warning dark:bg-transparent">
              <StarIcon size="0.7rem" />
              {fmtCount(starCount)}
            </EyebrowPill>
          ) : undefined,
      }}
    />
  )
}
