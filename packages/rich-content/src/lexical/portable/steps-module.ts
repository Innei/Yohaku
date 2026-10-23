import type { RichRendererModule } from '@haklex/rich-compose'
import { STEPS_MODULE_NAME } from '@haklex/rich-compose/modules/steps'
import { stepsNodes } from '@haklex/rich-ext-steps/node'

import { LexicalStepsOverride } from './steps'

export const yohakuStepsModule: RichRendererModule = {
  name: STEPS_MODULE_NAME,
  nodes: stepsNodes,
  renderers: { Steps: LexicalStepsOverride },
}
