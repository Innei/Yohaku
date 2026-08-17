import type { FC, ReactNode } from 'react'

import type { HostEnrichment } from '../../../host'
import {
  AlbumCard,
  BookCard,
  CommitCard,
  DiscussionCard,
  FallbackCard,
  IssueCard,
  LeetcodeCard,
  MovieCard,
  PaperCard,
  PrCard,
  RepoCard,
  SelfCard,
  UserCard,
} from './variants'

interface Props {
  className?: string
  data: HostEnrichment
  fallback?: ReactNode
}

/**
 * True when the enrichment renders as a `PosterCard`-derived variant
 * (movie / tv / book / album / song / music). Article wrappers use this
 * to opt these wide horizontal cards out of the default `max-w-[36rem]`
 * column — at the constrained width, long meta rows wrap and overflow
 * the fixed card height.
 */
export function isPosterEnrichment(data: HostEnrichment): boolean {
  const subtype = data.subtype ?? ''
  const category = data.category ?? ''
  if (category === 'media') {
    return (
      subtype === 'movie' ||
      subtype === 'tv' ||
      subtype === 'book' ||
      subtype === 'music' ||
      subtype === 'album' ||
      subtype === 'song'
    )
  }
  return category === 'book' || category === 'music'
}

/**
 * Pick the visual variant for an enrichment based on (category, subtype).
 * Subtype takes precedence; categories with no specific subtype hit the
 * category-default branch. Mirrors the web dispatcher so serialized posts
 * render the same card family on every host.
 */
export const LinkCardVariant: FC<Props> = ({ data, className, fallback }) => {
  const subtype = data.subtype ?? ''
  const category = data.category ?? ''

  if (category === 'github') {
    switch (subtype) {
      case 'repo': {
        return <RepoCard className={className} data={data} />
      }
      case 'issue': {
        return <IssueCard className={className} data={data} />
      }
      case 'pr':
      case 'pull-request': {
        return <PrCard className={className} data={data} />
      }
      case 'discussion': {
        return <DiscussionCard className={className} data={data} />
      }
      case 'user': {
        return <UserCard className={className} data={data} />
      }
      case 'commit': {
        return <CommitCard className={className} data={data} />
      }
    }
  }

  if (category === 'media') {
    if (subtype === 'movie' || subtype === 'tv') {
      return <MovieCard className={className} data={data} />
    }
    if (subtype === 'book') {
      return <BookCard className={className} data={data} />
    }
    if (subtype === 'music' || subtype === 'album' || subtype === 'song') {
      return <AlbumCard className={className} data={data} />
    }
  }

  if (category === 'book') return <BookCard className={className} data={data} />
  if (category === 'music')
    return <AlbumCard className={className} data={data} />
  if (category === 'academic')
    return <PaperCard className={className} data={data} />
  if (category === 'code')
    return <LeetcodeCard className={className} data={data} />
  if (category === 'self')
    return <SelfCard className={className} data={data} fallback={fallback} />

  return <FallbackCard className={className} data={data} />
}
