import type {} from '@haklex/rich-editor/static'
import type {
  AfilmoryBlockProps,
  AfilmoryFilter,
  AfilmoryLayout,
  AfilmoryListItem,
  AfilmorySource,
} from '@mx-space/editor'
import type { ComponentType } from 'react'

export const AFILMORY_NODE_KEY = 'Afilmory' as const

export type { AfilmoryFilter, AfilmoryLayout, AfilmoryListItem, AfilmorySource }

export type AfilmorySlotProps = AfilmoryBlockProps

declare module '@haklex/rich-editor/static' {
  interface RendererConfig {
    Afilmory?: ComponentType<AfilmorySlotProps>
  }
}

export {}
