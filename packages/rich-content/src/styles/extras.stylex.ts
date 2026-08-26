import * as stylex from '@stylexjs/stylex'

import { yohaku } from './yohaku.stylex'

export const extras = stylex.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollbarNone: {
    scrollbarWidth: 'none',
  },
  textCaption12: {
    fontSize: yohaku.label12,
    lineHeight: yohaku.label12Line,
  },
  breakInsideAvoid: {
    breakInside: 'avoid',
  },
  pointerCoarseOpacity90: {
    '@media (pointer: coarse)': { opacity: 0.9 },
  },
  groupHoverTranslateX05: {
    ':is(:where([data-group]):hover *)': {
      transform: 'translateX(0.125rem)',
    },
  },
  opacity06: {
    opacity: 0.06,
  },
  fontSystemUi: {
    fontFamily: 'system-ui, sans-serif',
  },
  alignNeg015em: {
    verticalAlign: '-0.15em',
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
})
