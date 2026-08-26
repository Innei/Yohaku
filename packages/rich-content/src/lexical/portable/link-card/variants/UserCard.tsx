import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC, ReactNode } from 'react'

import type { HostEnrichment } from '../../../../host'
import {
  AsideAvatar,
  AsidePlaceholder,
  EyebrowPill,
  GhCardLayout,
  LocationIcon,
  PersonIcon,
  RepoIcon,
} from '../atoms'
import { findAttr } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

function fmtCountLoose(n: unknown): string {
  const num = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(num)) return String(n ?? '')
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`
  return String(num)
}

export const UserCard: FC<Props> = ({ data, className }) => {
  const handle = findAttr(data, 'login')?.value
  const company = findAttr(data, 'company')?.value
  const location = findAttr(data, 'location')?.value
  const repos = findAttr(data, 'public_repos')?.value
  const followers = findAttr(data, 'followers')?.value
  const bio = data.description

  const meta: ReactNode[] = []
  if (repos != null) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="repos">
        <RepoIcon size="0.875rem" />
        <span {...sx(atoms.font_medium, atoms.text_neutral_9)}>
          {fmtCountLoose(repos)}
        </span>
        <span {...sx(atoms.text_neutral_6)}>repos</span>
      </span>,
    )
  }
  if (followers != null) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="followers">
        <PersonIcon size="0.875rem" />
        <span {...sx(atoms.font_medium, atoms.text_neutral_9)}>
          {fmtCountLoose(followers)}
        </span>
        <span {...sx(atoms.text_neutral_6)}>followers</span>
      </span>,
    )
  }
  if (location) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="location">
        <LocationIcon size="0.875rem" />
        <span>{String(location)}</span>
      </span>,
    )
  }
  if (company) {
    meta.push(
      <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1dot5)} key="company">
        <i {...sxClass("i-mingcute-building-1-line", atoms.text__0dot875rem)} />
        <span {...sx(atoms.text_neutral_6)}>{String(company)}</span>
      </span>,
    )
  }

  const avatarUrl = data.thumbnailImage?.url

  return (
    <GhCardLayout
      className={className}
      href={data.url}
      meta={meta}
      title={{ text: data.title }}
      aside={
        avatarUrl ? (
          <AsideAvatar alt={data.title} shape="circle" src={avatarUrl} />
        ) : (
          <AsidePlaceholder shape="circle">
            <PersonIcon size="1.5rem" />
          </AsidePlaceholder>
        )
      }
      body={
        bio ? (
          <div {...sx(atoms.line_clamp_2, atoms.text__0dot9375rem, atoms.leading_relaxed, atoms.text_neutral_7)}>
            {bio}
          </div>
        ) : undefined
      }
      eyebrow={{
        icon: <PersonIcon {...sx(atoms.size_3dot5)} />,
        kind: 'GitHub User',
        pill: handle ? <EyebrowPill>@{String(handle)}</EyebrowPill> : undefined,
      }}
    />
  )
}
