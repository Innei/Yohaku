import type { RichRendererModule } from '@haklex/rich-compose'
import { CHAT_MODULE_NAME } from '@haklex/rich-compose/modules/chat'
import { chatNodes } from '@haklex/rich-ext-chat/node'

import { LexicalChatOverride } from './chat'

export const yohakuChatModule: RichRendererModule = {
  name: CHAT_MODULE_NAME,
  nodes: chatNodes,
  renderers: { Chat: LexicalChatOverride },
}
