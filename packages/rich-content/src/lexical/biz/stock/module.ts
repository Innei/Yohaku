import type { RichRendererModule } from '@haklex/rich-compose'

import { STOCK_NODE_KEY } from './augment'
import { StockBlock } from './block'
import { StockNode } from './node'

export const yohakuStockModule: RichRendererModule = {
  name: 'stock',
  nodes: [StockNode],
  renderers: { [STOCK_NODE_KEY]: StockBlock },
}
