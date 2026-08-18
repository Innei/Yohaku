import type { RichRendererModule } from '@haklex/rich-compose'

import { AFILMORY_NODE_KEY } from './afilmory-augment'
import { AfilmoryNode } from './afilmory-node'
import { AfilmoryRenderer } from './AfilmoryRenderer'

export const yohakuAfilmoryModule: RichRendererModule = {
  name: 'afilmory',
  nodes: [AfilmoryNode],
  renderers: { [AFILMORY_NODE_KEY]: AfilmoryRenderer },
}
