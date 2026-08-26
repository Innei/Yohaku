import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { FC, ReactNode } from 'react'

import { clsxm } from '../../../../lib/clsxm'

type Shape = 'square' | 'circle'

interface ImageProps {
  alt: string
  shape?: Shape
  src: string
}

interface PlaceholderProps {
  children: ReactNode
  shape?: Shape
}

const sizeClass = (shape: Shape) =>
  shape === 'circle'
    ? 'size-20 rounded-full ring-1 ring-border/60'
    : 'size-14 rounded-lg'

export const AsideAvatar: FC<ImageProps> = ({ src, alt, shape = 'square' }) => (
  <img
    alt={alt}
    {...sx(atoms.bg_neutral_2, atoms.object_cover, sizeClass(shape))}
    loading="lazy"
    src={src}
  />
)

export const AsidePlaceholder: FC<PlaceholderProps> = ({
  shape = 'square',
  children,
}) => (
  <div
    aria-hidden
    {...sx(
      atoms.flex, atoms.items_center, atoms.justify_center, atoms.bg_neutral_2, atoms.text_neutral_6,
      sizeClass(shape),
    )}
  >
    {children}
  </div>
)
