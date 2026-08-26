'use client'
import { sx } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

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
        {...sx(atoms.mr_1, atoms.inline_flex, atoms.shrink_0, atoms._and_svg_inline, atoms._and_svg_h__0dot8emimportant_)}
        getPlatformFromUrl={getPlatformFromUrl}
        href={href}
        platformIconMap={platformIconMap}
      />
      {children}
    </a>
  )
}
