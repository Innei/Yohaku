'use client'

import { LinkFavicon } from '@haklex/rich-editor/static'

import type { InlineLinkProps } from '../../host'
import { getPlatformFromUrl, platformIconMap } from './platform-icons'

export function PortableInlineLink({
  children,
  className,
  href,
  rel,
  target,
}: InlineLinkProps) {
  return (
    <a className={className} href={href} rel={rel} target={target}>
      <LinkFavicon
        className="mr-1 inline-flex shrink-0 [&_svg]:inline [&_svg]:h-[0.8em]!"
        getPlatformFromUrl={getPlatformFromUrl}
        href={href}
        platformIconMap={platformIconMap}
      />
      {children}
    </a>
  )
}
