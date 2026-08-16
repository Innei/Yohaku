'use client'

import { LinkFavicon } from '@haklex/rich-editor/static'
import type { ReactNode } from 'react'

import { useHost } from '../../host'
import { getPlatformFromUrl, platformIconMap } from './platform-icons'

export function PortableLinkCard({
  fallback,
  url,
}: {
  fallback?: ReactNode
  url: string
}) {
  const { enrichments } = useHost()
  const entry = url ? enrichments?.[url] : undefined
  if (!entry) return <>{fallback ?? null}</>

  return (
    <a
      className="yohaku-link-card group my-4 flex items-center gap-3 rounded-xl border border-neutral-3 bg-neutral-1 px-4 py-3 no-underline transition-colors hover:bg-neutral-2"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[15px] font-medium text-neutral-10">
          <LinkFavicon
            className="inline-flex shrink-0 [&_svg]:inline [&_svg]:h-[0.9em]!"
            getPlatformFromUrl={getPlatformFromUrl}
            href={url}
            platformIconMap={platformIconMap}
          />
          <span className="truncate">{entry.title}</span>
        </span>
        {entry.description ? (
          <span className="line-clamp-2 text-[13px] leading-relaxed text-neutral-7">
            {entry.description}
          </span>
        ) : null}
        <span className="truncate text-[12px] text-neutral-6">{url}</span>
      </span>
      {entry.image?.url ? (
        <img
          alt={entry.image.alt ?? ''}
          className="size-16 shrink-0 rounded-lg object-cover"
          src={entry.image.url}
        />
      ) : null}
    </a>
  )
}
