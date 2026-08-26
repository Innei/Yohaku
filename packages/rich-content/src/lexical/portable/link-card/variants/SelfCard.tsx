'use client'
import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'

import type { FC, MouseEvent, ReactNode } from 'react'
import { useCallback } from 'react'

import type { HostEnrichment } from '../../../../host'
import { useOptionalHost } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import { HostStamp, LinkCardShell } from '../atoms'

interface Props {
  className?: string
  data: HostEnrichment
  fallback?: ReactNode
}

/**
 * Normalize the enrichment URL into an in-site absolute path. Three shapes
 * can land here:
 *
 *  1. New mx-space provider output — already an absolute path
 *     (`/posts/...`, `/notes/...`). Pass through.
 *  2. Legacy cached rows where `url` is the provider id, e.g.
 *     `post:cat/slug`, `note:42`, `note-date:Y/M/D/slug`. These look like
 *     URLs with a custom scheme to `new URL()`, whose `.pathname` is
 *     scheme-relative (no leading `/`) — convert them back to the real
 *     on-site path explicitly.
 *  3. A real `http(s)` URL (some authors paste the full site URL). Strip
 *     down to the pathname.
 *
 * Anything else returns `null` so the caller can fall back to a plain link
 * instead of rendering a broken href.
 */
export function toSelfPath(url: string): string | null {
  if (!url) return null
  if (url.startsWith('/')) return url

  if (url.startsWith('post:')) {
    const rest = url.slice('post:'.length)
    return rest.includes('/') ? `/posts/${rest}` : null
  }
  if (url.startsWith('note-date:')) {
    return `/notes/${url.slice('note-date:'.length)}`
  }
  if (url.startsWith('note:')) {
    return `/notes/${url.slice('note:'.length)}`
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.pathname || null
  } catch {
    return null
  }
}

/**
 * Variant for `category === 'self'` (own posts / notes). Mirrors FallbackCard
 * but defaults the right-side stamp to the site owner's avatar (via
 * `host.site`) so a self link visibly reads as "my content". The anchor is
 * prefixed with `host.webOrigin`: hosts intercept clicks via the resolved
 * `link.href`, and a bare path would resolve against the WebView's own
 * origin (Metro / file://) instead of the site — the mobile link router
 * only recognizes site-host URLs for in-app navigation. On web the host may
 * instead consume normal clicks via `interceptSelfLink` (peek modal /
 * client-side push); cmd/ctrl-clicks always fall through to the anchor. The
 * host is optional — the web markdown pipeline renders outside any
 * HostProvider and degrades to a plain bare-path anchor.
 */
export const SelfCard: FC<Props> = ({ data, className, fallback }) => {
  const host = useOptionalHost()
  const selfPath = toSelfPath(data.url)

  const interceptSelfLink = host?.interceptSelfLink
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!selfPath || !interceptSelfLink) return
      if (event.metaKey || event.ctrlKey) return
      if (interceptSelfLink(selfPath)) event.preventDefault()
    },
    [interceptSelfLink, selfPath],
  )

  if (!selfPath) return <>{fallback ?? null}</>

  const webOrigin = host?.webOrigin
  const href = webOrigin ? `${webOrigin}${selfPath}` : selfPath
  const ownerAvatar = host?.site?.ownerAvatar

  return (
    <LinkCardShell
      {...sx(atoms.w_full, atoms.max_w__36rem, className)}
      external={false}
      href={href}
      onClick={handleClick}
    >
      <div {...sx(atoms.min_w_0, atoms.flex_1)}>
        <div {...sx(atoms.line_clamp_2, atoms.text_copy_16, atoms.leading_6, atoms.font_medium, atoms.text_neutral_10)}>
          {data.title}
        </div>
        {data.description && (
          <div {...sx(atoms.mt_2, atoms.line_clamp_2, atoms.text__0dot9375rem, atoms.leading_relaxed, atoms.text_neutral_7)}>
            {data.description}
          </div>
        )}
      </div>
      {data.thumbnailImage?.url ? (
        <img
          alt={data.thumbnailImage.alt ?? data.title}
          {...sx(atoms.size_14, atoms.shrink_0, atoms.rounded_lg, atoms.bg_neutral_2, atoms.object_cover)}
          loading="lazy"
          src={data.thumbnailImage.url}
        />
      ) : ownerAvatar ? (
        <HostStamp {...sx(atoms.overflow_hidden, atoms.p_0)}>
          <img
            alt={host?.site?.ownerName ?? ''}
            {...sx(atoms.size_full, atoms.object_cover)}
            loading="lazy"
            src={ownerAvatar}
          />
        </HostStamp>
      ) : (
        <HostStamp />
      )}
    </LinkCardShell>
  )
}
