import type {} from '@haklex/rich-editor/static'
import type { ComponentType } from 'react'

import type { MapSlotProps } from '../../../host'

export const MAP_NODE_KEY = 'Map' as const

export type { MapSlotProps } from '../../../host'

declare module '@haklex/rich-editor/static' {
  interface RendererConfig {
    Map?: ComponentType<MapSlotProps>
  }
}

export {}
