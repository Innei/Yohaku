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
    className={clsxm('bg-neutral-2 object-cover', sizeClass(shape))}
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
    className={clsxm(
      'flex items-center justify-center bg-neutral-2 text-neutral-6',
      sizeClass(shape),
    )}
  >
    {children}
  </div>
)
