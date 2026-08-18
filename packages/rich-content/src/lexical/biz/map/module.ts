import type { RichRendererModule } from '@haklex/rich-compose'

import { MAP_NODE_KEY } from './augment'
import { MapDisplayNode } from './node'
import { YohakuMapRenderer } from './renderer'

export const yohakuMapModule: RichRendererModule = {
  name: 'map',
  nodes: [MapDisplayNode],
  renderers: { [MAP_NODE_KEY]: YohakuMapRenderer },
}
