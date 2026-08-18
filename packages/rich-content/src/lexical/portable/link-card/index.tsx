'use client'

import type { ReactNode } from 'react'

import { useHost } from '../../../host'
import { parseGithubFileUrl } from '../github-file'
import { PortableGithubFileEmbed } from '../github-file-embed'
import { LinkCardVariant } from './dispatch'

export function PortableLinkCard({
  fallback,
  url,
}: {
  fallback?: ReactNode
  url: string
}) {
  const { enrichments } = useHost()
  if (url && parseGithubFileUrl(url)) {
    return <PortableGithubFileEmbed href={url} />
  }

  const entry = url ? enrichments?.[url] : undefined
  if (!entry) return <>{fallback ?? null}</>

  return <LinkCardVariant data={entry} fallback={fallback} />
}
