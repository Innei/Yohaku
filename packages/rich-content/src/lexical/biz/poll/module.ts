import type { RichRendererModule } from '@haklex/rich-compose'
import { POLL_NODE_KEY, pollNodes } from '@haklex/rich-compose/modules/poll'

import { YohakuPollRenderer } from './renderer'

export const yohakuPollModule: RichRendererModule = {
  name: 'poll',
  nodes: pollNodes,
  renderers: { [POLL_NODE_KEY]: YohakuPollRenderer },
}
