import type { FontFamilyId } from './types'

export const EXCALIDRAW_FONT_STACK = {
  hand: '"Excalifont", "LXGW WenKai Screen", "Virgil", "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive',
  sans: 'Helvetica, "PingFang SC", "Microsoft YaHei", "Segoe UI Emoji", "Segoe UI Symbol", system-ui, sans-serif',
  mono: '"Cascadia Code", "Cascadia", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const

export function fontFamilyToCss(id: FontFamilyId | undefined): string {
  switch (id) {
    case 3: {
      return EXCALIDRAW_FONT_STACK.mono
    }
    default: {
      return EXCALIDRAW_FONT_STACK.hand
    }
  }
}
