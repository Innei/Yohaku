import * as stylex from '@stylexjs/stylex'
import {
  animations,
  aspectRatios,
  blurs,
  colors,
  containers,
  defaults,
  easings,
  fontSizeLineHeights,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeights,
  maxWidths,
  mediaQueries,
  radii,
  shadows,
  spacing,
} from 'tailwind-stylex/tokens.stylex'

import { DARK, yohaku } from './yohaku.stylex'

export const atoms = stylex.create({
  /** !gap-0 */
  important_gap_0: {
    gap: `${spacing[0]} !important`,
  },
  /** !items-stretch */
  important_items_stretch: {
    alignItems: 'stretch !important',
  },
  /** !px-0 */
  important_px_0: {
    paddingLeft: `${spacing[0]} !important`,
    paddingRight: `${spacing[0]} !important`,
  },
  /** !py-0 */
  important_py_0: {
    paddingTop: `${spacing[0]} !important`,
    paddingBottom: `${spacing[0]} !important`,
  },
  /** -bottom-1 */
  _bottom_1: {
    bottom: `calc(-1 * ${spacing[1]})`,
  },
  /** -bottom-px */
  _bottom_px: {
    bottom: `calc(-1 * ${spacing.px})`,
  },
  /** -ml-2 */
  _ml_2: {
    marginLeft: `calc(-1 * ${spacing[2]})`,
  },
  /** -top-[2.5px] */
  _top__2dot5px: {
    top: 'calc(-1 * 2.5px)',
  },
  /** -z-10 */
  _z_10: {
    zIndex: -10,
  },
  /** [&>div]:min-h-0! */
  _and_div_min_h_0important_: {
    ":not(#\\#)>div": {
      minHeight: `${spacing[0]} !important`,
    },
  },
  /** [&_p]:my-1! */
  _and_p_my_1important_: {
    ":not(#\\#)  p": {
      marginTop: `${spacing[1]} !important`,
      marginBottom: `${spacing[1]} !important`,
    },
  },
  /** [&_svg]:h-[0.8em]! */
  _and_svg_h__0dot8emimportant_: {
    ":not(#\\#)  svg": {
      height: '0.8em !important',
    },
  },
  /** [&_svg]:h-[14px]! */
  _and_svg_h__14pximportant_: {
    ":not(#\\#)  svg": {
      height: '14px !important',
    },
  },
  /** [&_svg]:inline */
  _and_svg_inline: {
    ":not(#\\#)  svg": {
      display: 'inline',
    },
  },
  /** [&_svg]:w-[14px]! */
  _and_svg_w__14pximportant_: {
    ":not(#\\#)  svg": {
      width: '14px !important',
    },
  },
  /** [&_tr:last-child_td]:border-b-0 */
  _and_tr_last_child_td_border_b_0: {
    ":not(#\\#)  tr:last-child td": {
      borderBottomWidth: '0px',
    },
  },
  /** [-webkit-overflow-scrolling:touch] */
  __webkit_overflow_scrolling_touch: {
    WebkitOverflowScrolling: 'touch',
  },
  /** [.rr-image-frame:hover_&]:opacity-0 */
  _dotrr_image_frame_hover_and_opacity_0: {
    ":not(#\\#) .rr-image-frame:hover &": {
      opacity: 0,
    },
  },
  /** [.rr-image-frame:hover_&]:opacity-100 */
  _dotrr_image_frame_hover_and_opacity_100: {
    ":not(#\\#) .rr-image-frame:hover &": {
      opacity: 1,
    },
  },
  /** absolute */
  absolute: {
    position: 'absolute',
  },
  /** active:scale-[0.96] */
  active_scale__0dot96: {
    ':active': {
      transform: 'scale(0.96)',
    },
  },
  /** after:-translate-x-1/2 */
  after__translate_x_1_2: {
    '::after': {
      transform: 'translateX(-50%)',
    },
  },
  /** after:-translate-y-1/2 */
  after__translate_y_1_2: {
    '::after': {
      transform: 'translateY(-50%)',
    },
  },
  /** after:absolute */
  after_absolute: {
    '::after': {
      position: 'absolute',
    },
  },
  /** after:left-1/2 */
  after_left_1_2: {
    '::after': {
      left: '50%',
    },
  },
  /** after:size-10 */
  after_size_10: {
    '::after': {
      width: spacing[10],
      height: spacing[10],
    },
  },
  /** after:top-1/2 */
  after_top_1_2: {
    '::after': {
      top: '50%',
    },
  },
  /** align-bottom */
  align_bottom: {
    verticalAlign: 'bottom',
  },
  /** align-middle */
  align_middle: {
    verticalAlign: 'middle',
  },
  /** align-top */
  align_top: {
    verticalAlign: 'top',
  },
  /** animate-pulse */
  animate_pulse: {
    animation: animations.pulse,
  },
  /** aspect-[16/9] */
  aspect__16_9: {
    aspectRatio: '16/9',
  },
  /** backdrop-blur-xs */
  backdrop_blur_xs: {
    backdropFilter: `blur(${blurs.xs})`,
  },
  /** bg-(--color-neutral-1) */
  bg____color_neutral_1: {
    backgroundColor: '--color-neutral-1',
  },
  /** bg-(--color-neutral-2) */
  bg____color_neutral_2: {
    backgroundColor: '--color-neutral-2',
  },
  /** bg-(--color-neutral-3) */
  bg____color_neutral_3: {
    backgroundColor: '--color-neutral-3',
  },
  /** bg-(--color-neutral-5) */
  bg____color_neutral_5: {
    backgroundColor: '--color-neutral-5',
  },
  /** bg-(--surface-paper) */
  bg____surface_paper: {
    backgroundColor: '--surface-paper',
  },
  /** bg-[linear-gradient(to_bottom,transparent,var(--surface-paper))] */
  bg__linear_gradient_to_bottom_transparent_var___surface_paper: {
    backgroundImage: 'linear-gradient(to bottom,transparent,var(--surface-paper))',
  },
  /** bg-accent */
  bg_accent: {
    backgroundColor: yohaku.accent,
  },
  /** bg-accent/50 */
  bg_accent_50: {
    backgroundColor: `color-mix(in oklab, ${yohaku.accent} 50%, transparent)`,
  },
  /** bg-accent/8 */
  bg_accent_8: {
    backgroundColor: `color-mix(in oklab, ${yohaku.accent} 8%, transparent)`,
  },
  /** bg-black/35 */
  bg_black_35: {
    backgroundColor: `color-mix(in oklab, ${colors.black} 35%, transparent)`,
  },
  /** bg-black/55 */
  bg_black_55: {
    backgroundColor: `color-mix(in oklab, ${colors.black} 55%, transparent)`,
  },
  /** bg-gradient-to-b */
  bg_gradient_to_b: {
    backgroundImage: 'linear-gradient(to bottom, var(--sx-gradient-stops))',
  },
  /** bg-gradient-to-t */
  bg_gradient_to_t: {
    backgroundImage: 'linear-gradient(to top, var(--sx-gradient-stops))',
  },
  /** bg-neutral-1 */
  bg_neutral_1: {
    backgroundColor: yohaku.neutral1,
  },
  /** bg-neutral-2 */
  bg_neutral_2: {
    backgroundColor: yohaku.neutral2,
  },
  /** bg-neutral-2/60 */
  bg_neutral_2_60: {
    backgroundColor: `color-mix(in oklab, ${yohaku.neutral2} 60%, transparent)`,
  },
  /** bg-neutral-3 */
  bg_neutral_3: {
    backgroundColor: yohaku.neutral3,
  },
  /** bg-neutral-3/60 */
  bg_neutral_3_60: {
    backgroundColor: `color-mix(in oklab, ${yohaku.neutral3} 60%, transparent)`,
  },
  /** bg-neutral-4 */
  bg_neutral_4: {
    backgroundColor: yohaku.neutral4,
  },
  /** bg-neutral-5 */
  bg_neutral_5: {
    backgroundColor: yohaku.neutral5,
  },
  /** bg-neutral-9 */
  bg_neutral_9: {
    backgroundColor: yohaku.neutral9,
  },
  /** bg-neutral-9/10 */
  bg_neutral_9_10: {
    backgroundColor: `color-mix(in oklab, ${yohaku.neutral9} 10%, transparent)`,
  },
  /** bg-paper */
  bg_paper: {
    backgroundColor: yohaku.paper,
  },
  /** bg-transparent */
  bg_transparent: {
    backgroundColor: colors.transparent,
  },
  /** bg-white */
  bg_white: {
    backgroundColor: colors.white,
  },
  /** bg-white/70 */
  bg_white_70: {
    backgroundColor: `color-mix(in oklab, ${colors.white} 70%, transparent)`,
  },
  /** block */
  block: {
    display: 'block',
  },
  /** border */
  border: {
    borderWidth: '1px',
  },
  /** border-(--color-neutral-3) */
  border____color_neutral_3: {
    borderColor: '--color-neutral-3',
  },
  /** border-accent */
  border_accent: {
    borderColor: yohaku.accent,
  },
  /** border-accent/30 */
  border_accent_30: {
    borderColor: `color-mix(in oklab, ${yohaku.accent} 30%, transparent)`,
  },
  /** border-b */
  border_b: {
    borderBottomWidth: '1px',
  },
  /** border-border */
  border_border: {
    borderColor: yohaku.border,
  },
  /** border-border/60 */
  border_border_60: {
    borderColor: `color-mix(in oklab, ${yohaku.border} 60%, transparent)`,
  },
  /** border-collapse */
  border_collapse: {
    borderCollapse: 'collapse',
  },
  /** border-l */
  border_l: {
    borderLeftWidth: '1px',
  },
  /** border-l-2 */
  border_l_2: {
    borderLeftWidth: '2px',
  },
  /** border-neutral-3 */
  border_neutral_3: {
    borderColor: yohaku.neutral3,
  },
  /** border-neutral-3/50 */
  border_neutral_3_50: {
    borderColor: `color-mix(in oklab, ${yohaku.neutral3} 50%, transparent)`,
  },
  /** border-t */
  border_t: {
    borderTopWidth: '1px',
  },
  /** border-transparent */
  border_transparent: {
    borderColor: colors.transparent,
  },
  /** border-white/12 */
  border_white_12: {
    borderColor: `color-mix(in oklab, ${colors.white} 12%, transparent)`,
  },
  /** border-y */
  border_y: {
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
  },
  /** bottom-0 */
  bottom_0: {
    bottom: spacing[0],
  },
  /** bottom-2 */
  bottom_2: {
    bottom: spacing[2],
  },
  /** bottom-2.5 */
  bottom_2dot5: {
    bottom: spacing['2.5'],
  },
  /** bottom-[14px] */
  bottom__14px: {
    bottom: '14px',
  },
  /** col-span-2 */
  col_span_2: {
    gridColumn: 'span 2 / span 2',
  },
  /** columns-2 */
  columns_2: {
    columns: 2,
  },
  /** cursor-default */
  cursor_default: {
    cursor: 'default',
  },
  /** cursor-pointer */
  cursor_pointer: {
    cursor: 'pointer',
  },
  /** dark:bg-neutral-1 */
  dark_bg_neutral_1: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      backgroundColor: yohaku.neutral1,
    },
  },
  /** dark:bg-neutral-2 */
  dark_bg_neutral_2: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      backgroundColor: yohaku.neutral2,
    },
  },
  /** dark:bg-neutral-3 */
  dark_bg_neutral_3: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      backgroundColor: yohaku.neutral3,
    },
  },
  /** dark:bg-neutral-3/40 */
  dark_bg_neutral_3_40: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      backgroundColor: `color-mix(in oklab, ${yohaku.neutral3} 40%, transparent)`,
    },
  },
  /** dark:bg-transparent */
  dark_bg_transparent: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      backgroundColor: colors.transparent,
    },
  },
  /** dark:text-[#5CB7D2] */
  dark_text__hash5CB7D2: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      color: '#5CB7D2',
    },
  },
  /** dark:text-[#FFFFFF] */
  dark_text__hashFFFFFF: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      color: '#FFFFFF',
    },
  },
  /** dark:text-neutral-6 */
  dark_text_neutral_6: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      color: yohaku.neutral6,
    },
  },
  /** dark:text-neutral-7 */
  dark_text_neutral_7: {
    [':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)']: {
      color: yohaku.neutral7,
    },
  },
  /** disabled:bg-accent/4 */
  disabled_bg_accent_4: {
    ':disabled': {
      backgroundColor: `color-mix(in oklab, ${yohaku.accent} 4%, transparent)`,
    },
  },
  /** disabled:border-accent/15 */
  disabled_border_accent_15: {
    ':disabled': {
      borderColor: `color-mix(in oklab, ${yohaku.accent} 15%, transparent)`,
    },
  },
  /** disabled:cursor-not-allowed */
  disabled_cursor_not_allowed: {
    ':disabled': {
      cursor: 'not-allowed',
    },
  },
  /** disabled:text-accent/40 */
  disabled_text_accent_40: {
    ':disabled': {
      color: `color-mix(in oklab, ${yohaku.accent} 40%, transparent)`,
    },
  },
  /** duration-150 */
  duration_150: {
    transitionDuration: '150ms',
  },
  /** duration-200 */
  duration_200: {
    transitionDuration: '200ms',
  },
  /** duration-300 */
  duration_300: {
    transitionDuration: '300ms',
  },
  /** duration-700 */
  duration_700: {
    transitionDuration: '700ms',
  },
  /** duration-[220ms] */
  duration__220ms: {
    transitionDuration: '220ms',
  },
  /** duration-[250ms] */
  duration__250ms: {
    transitionDuration: '250ms',
  },
  /** ease-out */
  ease_out: {
    transitionTimingFunction: easings.out,
  },
  /** fill-neutral-10 */
  fill_neutral_10: {
    fill: yohaku.neutral10,
  },
  /** flex */
  flex: {
    display: 'flex',
  },
  /** flex-1 */
  flex_1: {
    flex: '1 1 0%',
  },
  /** flex-col */
  flex_col: {
    flexDirection: 'column',
  },
  /** flex-nowrap */
  flex_nowrap: {
    flexWrap: 'nowrap',
  },
  /** flex-row */
  flex_row: {
    flexDirection: 'row',
  },
  /** flex-shrink-0 */
  flex_shrink_0: {
    flexShrink: 0,
  },
  /** flex-wrap */
  flex_wrap: {
    flexWrap: 'wrap',
  },
  /** focus-visible:outline-none */
  focus_visible_outline_none: {
    ':focus-visible': {
      outline: 'none',
    },
  },
  /** focus-visible:ring-(--a) */
  focus_visible_ring____a: {
    ':focus-visible': {
      boxShadow: `0 0 0 var(--sx-ring-offset-width, 0px) var(--sx-ring-offset-color, transparent), 0 0 0 calc(2px + var(--sx-ring-offset-width, 0px)) ${'--a'}`,
    },
  },
  /** focus-visible:ring-2 */
  focus_visible_ring_2: {
    ':focus-visible': {
      boxShadow: '0 0 0 2px var(--color-border, currentColor)',
    },
  },
  /** focus-within:opacity-100 */
  focus_within_opacity_100: {
    ':focus-within': {
      opacity: 1,
    },
  },
  /** font-bold */
  font_bold: {
    fontWeight: fontWeights.bold,
  },
  /** font-medium */
  font_medium: {
    fontWeight: fontWeights.medium,
  },
  /** font-mono */
  font_mono: {
    fontFamily: yohaku.fontMono,
  },
  /** font-normal */
  font_normal: {
    fontWeight: fontWeights.normal,
  },
  /** font-sans */
  font_sans: {
    fontFamily: yohaku.fontSans,
  },
  /** font-semibold */
  font_semibold: {
    fontWeight: fontWeights.semibold,
  },
  /** font-serif */
  font_serif: {
    fontFamily: yohaku.fontSerif,
  },
  /** from-black/55 */
  from_black_55: {
    "--sx-gradient-from": `color-mix(in oklab, ${colors.black} 55%, transparent)`,
    "--sx-gradient-stops": `${`color-mix(in oklab, ${colors.black} 55%, transparent)`}, var(--sx-gradient-to, transparent)`,
  },
  /** from-transparent */
  from_transparent: {
    "--sx-gradient-from": colors.transparent,
    "--sx-gradient-stops": `${colors.transparent}, var(--sx-gradient-to, transparent)`,
  },
  /** gap-0 */
  gap_0: {
    gap: spacing[0],
  },
  /** gap-1 */
  gap_1: {
    gap: spacing[1],
  },
  /** gap-1.5 */
  gap_1dot5: {
    gap: spacing['1.5'],
  },
  /** gap-2 */
  gap_2: {
    gap: spacing[2],
  },
  /** gap-2.5 */
  gap_2dot5: {
    gap: spacing['2.5'],
  },
  /** gap-3 */
  gap_3: {
    gap: spacing[3],
  },
  /** gap-4 */
  gap_4: {
    gap: spacing[4],
  },
  /** gap-5 */
  gap_5: {
    gap: spacing[5],
  },
  /** gap-x-1.5 */
  gap_x_1dot5: {
    columnGap: spacing['1.5'],
  },
  /** gap-x-5 */
  gap_x_5: {
    columnGap: spacing[5],
  },
  /** gap-y-0.5 */
  gap_y_0dot5: {
    rowGap: spacing['0.5'],
  },
  /** gap-y-1 */
  gap_y_1: {
    rowGap: spacing[1],
  },
  /** grid */
  grid: {
    display: 'grid',
  },
  /** grid-cols-2 */
  grid_cols_2: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  /** group-hover/afilmory:opacity-100 */
  group_hover_afilmory_opacity_100: {
    ':is(:where([data-group="afilmory"]):hover *)': {
      opacity: 1,
    },
  },
  /** group-hover/excalidraw:opacity-100 */
  group_hover_excalidraw_opacity_100: {
    ':is(:where([data-group="excalidraw"]):hover *)': {
      opacity: 1,
    },
  },
  /** group-hover/image:opacity-0 */
  group_hover_image_opacity_0: {
    ':is(:where([data-group="image"]):hover *)': {
      opacity: 0,
    },
  },
  /** group-hover/image:opacity-100 */
  group_hover_image_opacity_100: {
    ':is(:where([data-group="image"]):hover *)': {
      opacity: 1,
    },
  },
  /** group-hover/tile:opacity-100 */
  group_hover_tile_opacity_100: {
    ':is(:where([data-group="tile"]):hover *)': {
      opacity: 1,
    },
  },
  /** group-hover/tile:scale-[1.04] */
  group_hover_tile_scale__1dot04: {
    ':is(:where([data-group="tile"]):hover *)': {
      transform: 'scale(1.04)',
    },
  },
  /** group-hover:opacity-100 */
  group_hover_opacity_100: {
    ':is(:where([data-group]):hover *)': {
      opacity: 1,
    },
  },
  /** h-1.5 */
  h_1dot5: {
    height: spacing['1.5'],
  },
  /** h-10 */
  h_10: {
    height: spacing[10],
  },
  /** h-3 */
  h_3: {
    height: spacing[3],
  },
  /** h-4 */
  h_4: {
    height: spacing[4],
  },
  /** h-48 */
  h_48: {
    height: spacing[48],
  },
  /** h-5 */
  h_5: {
    height: spacing[5],
  },
  /** h-64 */
  h_64: {
    height: spacing[64],
  },
  /** h-9 */
  h_9: {
    height: spacing[9],
  },
  /** h-[1.1rem] */
  h__1dot1rem: {
    height: '1.1rem',
  },
  /** h-[12px] */
  h__12px: {
    height: '12px',
  },
  /** h-[13px] */
  h__13px: {
    height: '13px',
  },
  /** h-[220px] */
  h__220px: {
    height: '220px',
  },
  /** h-[3px] */
  h__3px: {
    height: '3px',
  },
  /** h-px */
  h_px: {
    height: spacing.px,
  },
  /** hidden */
  hidden: {
    display: 'none',
  },
  /** hover:bg-accent/12 */
  hover_bg_accent_12: {
    ':hover': {
      backgroundColor: `color-mix(in oklab, ${yohaku.accent} 12%, transparent)`,
    },
  },
  /** hover:bg-neutral-2 */
  hover_bg_neutral_2: {
    ':hover': {
      backgroundColor: yohaku.neutral2,
    },
  },
  /** hover:border-(--color-accent) */
  hover_border____color_accent: {
    ':hover': {
      borderColor: '--color-accent',
    },
  },
  /** hover:border-accent/45 */
  hover_border_accent_45: {
    ':hover': {
      borderColor: `color-mix(in oklab, ${yohaku.accent} 45%, transparent)`,
    },
  },
  /** hover:border-neutral-5 */
  hover_border_neutral_5: {
    ':hover': {
      borderColor: yohaku.neutral5,
    },
  },
  /** hover:text-(--afilmory-accent,--color-accent) */
  hover_text____afilmory_accent___color_accent: {
    ':hover': {
      color: '--afilmory-accent,--color-accent',
    },
  },
  /** hover:text-neutral-10 */
  hover_text_neutral_10: {
    ':hover': {
      color: yohaku.neutral10,
    },
  },
  /** hover:text-neutral-9 */
  hover_text_neutral_9: {
    ':hover': {
      color: yohaku.neutral9,
    },
  },
  /** inline-block */
  inline_block: {
    display: 'inline-block',
  },
  /** inline-flex */
  inline_flex: {
    display: 'inline-flex',
  },
  /** inset-0 */
  inset_0: {
    inset: spacing[0],
  },
  /** inset-x-0 */
  inset_x_0: {
    left: spacing[0],
    right: spacing[0],
  },
  /** isolate */
  isolate: {
    isolation: 'isolate',
  },
  /** italic */
  italic: {
    fontStyle: 'italic',
  },
  /** items-baseline */
  items_baseline: {
    alignItems: 'baseline',
  },
  /** items-center */
  items_center: {
    alignItems: 'center',
  },
  /** items-end */
  items_end: {
    alignItems: 'flex-end',
  },
  /** items-start */
  items_start: {
    alignItems: 'flex-start',
  },
  /** items-stretch */
  items_stretch: {
    alignItems: 'stretch',
  },
  /** justify-between */
  justify_between: {
    justifyContent: 'space-between',
  },
  /** justify-center */
  justify_center: {
    justifyContent: 'center',
  },
  /** justify-end */
  justify_end: {
    justifyContent: 'flex-end',
  },
  /** last:border-b-0 */
  last_border_b_0: {
    ':last-child': {
      borderBottomWidth: '0px',
    },
  },
  /** leading-6 */
  leading_6: {
    lineHeight: spacing[6],
  },
  /** leading-none */
  leading_none: {
    lineHeight: '1',
  },
  /** leading-normal */
  leading_normal: {
    lineHeight: lineHeights.normal,
  },
  /** leading-relaxed */
  leading_relaxed: {
    lineHeight: lineHeights.relaxed,
  },
  /** leading-snug */
  leading_snug: {
    lineHeight: lineHeights.snug,
  },
  /** leading-tight */
  leading_tight: {
    lineHeight: lineHeights.tight,
  },
  /** left-0 */
  left_0: {
    left: spacing[0],
  },
  /** left-[18px] */
  left__18px: {
    left: '18px',
  },
  /** line-clamp-1 */
  line_clamp_1: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
  },
  /** line-clamp-2 */
  line_clamp_2: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  },
  /** line-clamp-3 */
  line_clamp_3: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
  },
  /** list-none */
  list_none: {
    listStyleType: 'none',
  },
  /** m-0 */
  m_0: {
    margin: spacing[0],
  },
  /** max-w-[36rem] */
  max_w__36rem: {
    maxWidth: '36rem',
  },
  /** max-w-[38rem] */
  max_w__38rem: {
    maxWidth: '38rem',
  },
  /** max-w-[40rem] */
  max_w__40rem: {
    maxWidth: '40rem',
  },
  /** max-w-[440px] */
  max_w__440px: {
    maxWidth: '440px',
  },
  /** max-w-full */
  max_w_full: {
    maxWidth: '100%',
  },
  /** mb-1 */
  mb_1: {
    marginBottom: spacing[1],
  },
  /** mb-2 */
  mb_2: {
    marginBottom: spacing[2],
  },
  /** mb-3 */
  mb_3: {
    marginBottom: spacing[3],
  },
  /** mb-4 */
  mb_4: {
    marginBottom: spacing[4],
  },
  /** md:columns-4 */
  md_columns_4: {
    ['@media (min-width: 48rem)']: {
      columns: 4,
    },
  },
  /** min-h-[120px] */
  min_h__120px: {
    minHeight: '120px',
  },
  /** min-h-[6.5rem] */
  min_h__6dot5rem: {
    minHeight: '6.5rem',
  },
  /** min-w-0 */
  min_w_0: {
    minWidth: spacing[0],
  },
  /** min-w-[3.25rem] */
  min_w__3dot25rem: {
    minWidth: '3.25rem',
  },
  /** min-w-full */
  min_w_full: {
    minWidth: '100%',
  },
  /** ml-2 */
  ml_2: {
    marginLeft: spacing[2],
  },
  /** mr-0 */
  mr_0: {
    marginRight: spacing[0],
  },
  /** mr-1 */
  mr_1: {
    marginRight: spacing[1],
  },
  /** mr-1.5 */
  mr_1dot5: {
    marginRight: spacing['1.5'],
  },
  /** mt-0.5 */
  mt_0dot5: {
    marginTop: spacing['0.5'],
  },
  /** mt-1 */
  mt_1: {
    marginTop: spacing[1],
  },
  /** mt-1.5 */
  mt_1dot5: {
    marginTop: spacing['1.5'],
  },
  /** mt-2 */
  mt_2: {
    marginTop: spacing[2],
  },
  /** mt-2.5 */
  mt_2dot5: {
    marginTop: spacing['2.5'],
  },
  /** mt-3 */
  mt_3: {
    marginTop: spacing[3],
  },
  /** mt-4 */
  mt_4: {
    marginTop: spacing[4],
  },
  /** mx-0.5 */
  mx_0dot5: {
    marginLeft: spacing['0.5'],
    marginRight: spacing['0.5'],
  },
  /** mx-auto */
  mx_auto: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  /** my-0 */
  my_0: {
    marginTop: spacing[0],
    marginBottom: spacing[0],
  },
  /** my-4 */
  my_4: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  /** my-5 */
  my_5: {
    marginTop: spacing[5],
    marginBottom: spacing[5],
  },
  /** my-6 */
  my_6: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  /** my-8 */
  my_8: {
    marginTop: spacing[8],
    marginBottom: spacing[8],
  },
  /** my-[9px] */
  my__9px: {
    marginTop: '9px',
    marginBottom: '9px',
  },
  /** no-underline */
  no_underline: {
    textDecorationLine: 'none',
  },
  /** not-italic */
  not_italic: {
    fontStyle: 'normal',
  },
  /** object-contain */
  object_contain: {
    objectFit: 'contain',
  },
  /** object-cover */
  object_cover: {
    objectFit: 'cover',
  },
  /** opacity-0 */
  opacity_0: {
    opacity: 0,
  },
  /** opacity-100 */
  opacity_100: {
    opacity: 1,
  },
  /** opacity-40 */
  opacity_40: {
    opacity: '0.4',
  },
  /** opacity-60 */
  opacity_60: {
    opacity: '0.6',
  },
  /** opacity-70 */
  opacity_70: {
    opacity: '0.7',
  },
  /** overflow-hidden */
  overflow_hidden: {
    overflow: 'hidden',
  },
  /** overflow-x-auto */
  overflow_x_auto: {
    overflowX: 'auto',
  },
  /** overscroll-x-contain */
  overscroll_x_contain: {
    overscrollBehaviorX: 'contain',
  },
  /** p-0 */
  p_0: {
    padding: spacing[0],
  },
  /** p-2 */
  p_2: {
    padding: spacing[2],
  },
  /** p-4 */
  p_4: {
    padding: spacing[4],
  },
  /** p-[12px] */
  p__12px: {
    padding: '12px',
  },
  /** p-px */
  p_px: {
    padding: spacing.px,
  },
  /** pb-1.5 */
  pb_1dot5: {
    paddingBottom: spacing['1.5'],
  },
  /** pb-2 */
  pb_2: {
    paddingBottom: spacing[2],
  },
  /** pb-3 */
  pb_3: {
    paddingBottom: spacing[3],
  },
  /** pb-[52px] */
  pb__52px: {
    paddingBottom: '52px',
  },
  /** pl-4 */
  pl_4: {
    paddingLeft: spacing[4],
  },
  /** pl-6 */
  pl_6: {
    paddingLeft: spacing[6],
  },
  /** pl-7 */
  pl_7: {
    paddingLeft: spacing[7],
  },
  /** pointer-events-auto */
  pointer_events_auto: {
    pointerEvents: 'auto',
  },
  /** pointer-events-none */
  pointer_events_none: {
    pointerEvents: 'none',
  },
  /** pr-4 */
  pr_4: {
    paddingRight: spacing[4],
  },
  /** pt-1 */
  pt_1: {
    paddingTop: spacing[1],
  },
  /** pt-2 */
  pt_2: {
    paddingTop: spacing[2],
  },
  /** px-0 */
  px_0: {
    paddingLeft: spacing[0],
    paddingRight: spacing[0],
  },
  /** px-1 */
  px_1: {
    paddingLeft: spacing[1],
    paddingRight: spacing[1],
  },
  /** px-1.5 */
  px_1dot5: {
    paddingLeft: spacing['1.5'],
    paddingRight: spacing['1.5'],
  },
  /** px-2 */
  px_2: {
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
  },
  /** px-2.5 */
  px_2dot5: {
    paddingLeft: spacing['2.5'],
    paddingRight: spacing['2.5'],
  },
  /** px-3 */
  px_3: {
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
  },
  /** px-4 */
  px_4: {
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
  },
  /** px-5 */
  px_5: {
    paddingLeft: spacing[5],
    paddingRight: spacing[5],
  },
  /** px-6 */
  px_6: {
    paddingLeft: spacing[6],
    paddingRight: spacing[6],
  },
  /** py-0.5 */
  py_0dot5: {
    paddingTop: spacing['0.5'],
    paddingBottom: spacing['0.5'],
  },
  /** py-1 */
  py_1: {
    paddingTop: spacing[1],
    paddingBottom: spacing[1],
  },
  /** py-1.5 */
  py_1dot5: {
    paddingTop: spacing['1.5'],
    paddingBottom: spacing['1.5'],
  },
  /** py-3 */
  py_3: {
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  /** py-4 */
  py_4: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  /** py-5 */
  py_5: {
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
  },
  /** py-8 */
  py_8: {
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
  },
  /** py-[3px] */
  py__3px: {
    paddingTop: '3px',
    paddingBottom: '3px',
  },
  /** py-[9px] */
  py__9px: {
    paddingTop: '9px',
    paddingBottom: '9px',
  },
  /** py-px */
  py_px: {
    paddingTop: spacing.px,
    paddingBottom: spacing.px,
  },
  /** relative */
  relative: {
    position: 'relative',
  },
  /** right-2 */
  right_2: {
    right: spacing[2],
  },
  /** right-2.5 */
  right_2dot5: {
    right: spacing['2.5'],
  },
  /** right-[18px] */
  right__18px: {
    right: '18px',
  },
  /** ring-(--color-neutral-3) */
  ring____color_neutral_3: {
    boxShadow: `0 0 0 var(--sx-ring-offset-width, 0px) var(--sx-ring-offset-color, transparent), 0 0 0 calc(2px + var(--sx-ring-offset-width, 0px)) ${'--color-neutral-3'}`,
  },
  /** ring-1 */
  ring_1: {
    boxShadow: '0 0 0 1px var(--color-border, currentColor)',
  },
  /** ring-border */
  ring_border: {
    boxShadow: `0 0 0 var(--sx-ring-offset-width, 0px) var(--sx-ring-offset-color, transparent), 0 0 0 calc(2px + var(--sx-ring-offset-width, 0px)) ${yohaku.border}`,
  },
  /** ring-border/60 */
  ring_border_60: {
    boxShadow: `0 0 0 var(--sx-ring-offset-width, 0px) var(--sx-ring-offset-color, transparent), 0 0 0 calc(2px + var(--sx-ring-offset-width, 0px)) ${`color-mix(in oklab, ${yohaku.border} 60%, transparent)`}`,
  },
  /** rounded */
  rounded: {
    borderRadius: radii.default,
  },
  /** rounded-[4px] */
  rounded__4px: {
    borderRadius: '4px',
  },
  /** rounded-full */
  rounded_full: {
    borderRadius: radii.full,
  },
  /** rounded-lg */
  rounded_lg: {
    borderRadius: radii.lg,
  },
  /** rounded-md */
  rounded_md: {
    borderRadius: radii.md,
  },
  /** rounded-sm */
  rounded_sm: {
    borderRadius: radii.sm,
  },
  /** rounded-xl */
  rounded_xl: {
    borderRadius: radii.xl,
  },
  /** scale-100 */
  scale_100: {
    transform: 'scale(1)',
  },
  /** scale-90 */
  scale_90: {
    transform: 'scale(.9)',
  },
  /** scale-95 */
  scale_95: {
    transform: 'scale(.95)',
  },
  /** select-none */
  select_none: {
    userSelect: 'none',
  },
  /** self-start */
  self_start: {
    alignSelf: 'flex-start',
  },
  /** self-stretch */
  self_stretch: {
    alignSelf: 'stretch',
  },
  /** shrink-0 */
  shrink_0: {
    flexShrink: 0,
  },
  /** size-1 */
  size_1: {
    width: spacing[1],
    height: spacing[1],
  },
  /** size-1.5 */
  size_1dot5: {
    width: spacing['1.5'],
    height: spacing['1.5'],
  },
  /** size-14 */
  size_14: {
    width: spacing[14],
    height: spacing[14],
  },
  /** size-2 */
  size_2: {
    width: spacing[2],
    height: spacing[2],
  },
  /** size-20 */
  size_20: {
    width: spacing[20],
    height: spacing[20],
  },
  /** size-3.5 */
  size_3dot5: {
    width: spacing['3.5'],
    height: spacing['3.5'],
  },
  /** size-4 */
  size_4: {
    width: spacing[4],
    height: spacing[4],
  },
  /** size-7 */
  size_7: {
    width: spacing[7],
    height: spacing[7],
  },
  /** size-[11px] */
  size__11px: {
    width: '11px',
    height: '11px',
  },
  /** size-[14px] */
  size__14px: {
    width: '14px',
    height: '14px',
  },
  /** size-[3px] */
  size__3px: {
    width: '3px',
    height: '3px',
  },
  /** size-full */
  size_full: {
    width: '100%',
    height: '100%',
  },
  /** sm:block */
  sm_block: {
    ['@media (min-width: 40rem)']: {
      display: 'block',
    },
  },
  /** sm:columns-3 */
  sm_columns_3: {
    ['@media (min-width: 40rem)']: {
      columns: 3,
    },
  },
  /** sm:flex-row */
  sm_flex_row: {
    ['@media (min-width: 40rem)']: {
      flexDirection: 'row',
    },
  },
  /** sm:gap-8 */
  sm_gap_8: {
    ['@media (min-width: 40rem)']: {
      gap: spacing[8],
    },
  },
  /** sm:items-start */
  sm_items_start: {
    ['@media (min-width: 40rem)']: {
      alignItems: 'flex-start',
    },
  },
  /** sm:justify-between */
  sm_justify_between: {
    ['@media (min-width: 40rem)']: {
      justifyContent: 'space-between',
    },
  },
  /** sm:min-w-[220px] */
  sm_min_w__220px: {
    ['@media (min-width: 40rem)']: {
      minWidth: '220px',
    },
  },
  /** sm:pt-1 */
  sm_pt_1: {
    ['@media (min-width: 40rem)']: {
      paddingTop: spacing[1],
    },
  },
  /** sm:w-[220px] */
  sm_w__220px: {
    ['@media (min-width: 40rem)']: {
      width: '220px',
    },
  },
  /** space-y-1.5 */
  space_y_1dot5: {
    ':where(& > :not(:last-child))': {
      marginBottom: spacing['1.5'],
    },
  },
  /** tabular-nums */
  tabular_nums: {
    fontVariantNumeric: 'tabular-nums',
  },
  /** text-(--color-accent) */
  text____color_accent: {
    color: '--color-accent',
  },
  /** text-(--color-neutral-6) */
  text____color_neutral_6: {
    color: '--color-neutral-6',
  },
  /** text-(--color-neutral-7) */
  text____color_neutral_7: {
    color: '--color-neutral-7',
  },
  /** text-(--color-neutral-8) */
  text____color_neutral_8: {
    color: '--color-neutral-8',
  },
  /** text-(--color-neutral-9) */
  text____color_neutral_9: {
    color: '--color-neutral-9',
  },
  /** text-[#0084FF] */
  text__hash0084FF: {
    color: '#0084FF',
  },
  /** text-[#0D243F] */
  text__hash0D243F: {
    color: '#0D243F',
  },
  /** text-[#1D2127] */
  text__hash1D2127: {
    color: '#1D2127',
  },
  /** text-[#2AABEE] */
  text__hash2AABEE: {
    color: '#2AABEE',
  },
  /** text-[#469ECF] */
  text__hash469ECF: {
    color: '#469ECF',
  },
  /** text-[#8cb4ff] */
  text__hash8cb4ff: {
    color: '#8cb4ff',
  },
  /** text-[#A259FF] */
  text__hashA259FF: {
    color: '#A259FF',
  },
  /** text-[#FE2442] */
  text__hashFE2442: {
    color: '#FE2442',
  },
  /** text-[0.7rem] */
  text__0dot7rem: {
    fontSize: '0.7rem',
  },
  /** text-[0.8125rem] */
  text__0dot8125rem: {
    fontSize: '0.8125rem',
  },
  /** text-[0.82em] */
  text__0dot82em: {
    fontSize: '0.82em',
  },
  /** text-[0.875em] */
  text__0dot875em: {
    fontSize: '0.875em',
  },
  /** text-[0.875rem] */
  text__0dot875rem: {
    fontSize: '0.875rem',
  },
  /** text-[0.9375rem] */
  text__0dot9375rem: {
    fontSize: '0.9375rem',
  },
  /** text-[1.0625rem] */
  text__1dot0625rem: {
    fontSize: '1.0625rem',
  },
  /** text-[10px] */
  text__10px: {
    fontSize: '10px',
  },
  /** text-[11px] */
  text__11px: {
    fontSize: '11px',
  },
  /** text-[12px] */
  text__12px: {
    fontSize: '12px',
  },
  /** text-[13px] */
  text__13px: {
    fontSize: '13px',
  },
  /** text-[9px] */
  text__9px: {
    fontSize: '9px',
  },
  /** text-accent */
  text_accent: {
    color: yohaku.accent,
  },
  /** text-caption-10 */
  text_caption_10: {
    fontSize: yohaku.caption10,
    lineHeight: yohaku.caption10Line,
  },
  /** text-center */
  text_center: {
    textAlign: 'center',
  },
  /** text-copy-13 */
  text_copy_13: {
    fontSize: yohaku.copy13,
    lineHeight: yohaku.copy13Line,
  },
  /** text-copy-14 */
  text_copy_14: {
    fontSize: yohaku.copy14,
    lineHeight: yohaku.copy14Line,
  },
  /** text-copy-15 */
  text_copy_15: {
    fontSize: yohaku.copy15,
    lineHeight: yohaku.copy15Line,
  },
  /** text-copy-16 */
  text_copy_16: {
    fontSize: yohaku.copy16,
    lineHeight: yohaku.copy16Line,
  },
  /** text-current */
  text_current: {
    color: colors.current,
  },
  /** text-display-36 */
  text_display_36: {
    fontSize: yohaku.display36,
    lineHeight: yohaku.display36Line,
  },
  /** text-error */
  text_error: {
    color: yohaku.error,
  },
  /** text-label-12 */
  text_label_12: {
    fontSize: yohaku.label12,
    lineHeight: yohaku.label12Line,
  },
  /** text-left */
  text_left: {
    textAlign: 'left',
  },
  /** text-neutral-1 */
  text_neutral_1: {
    color: yohaku.neutral1,
  },
  /** text-neutral-10 */
  text_neutral_10: {
    color: yohaku.neutral10,
  },
  /** text-neutral-5 */
  text_neutral_5: {
    color: yohaku.neutral5,
  },
  /** text-neutral-6 */
  text_neutral_6: {
    color: yohaku.neutral6,
  },
  /** text-neutral-7 */
  text_neutral_7: {
    color: yohaku.neutral7,
  },
  /** text-neutral-8 */
  text_neutral_8: {
    color: yohaku.neutral8,
  },
  /** text-neutral-9 */
  text_neutral_9: {
    color: yohaku.neutral9,
  },
  /** text-pretty */
  text_pretty: {
    textWrap: 'pretty',
  },
  /** text-red-500 */
  text_red_500: {
    color: colors.red500,
  },
  /** text-right */
  text_right: {
    textAlign: 'right',
  },
  /** text-sm */
  text_sm: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizeLineHeights.sm,
  },
  /** text-success */
  text_success: {
    color: yohaku.success,
  },
  /** text-warning */
  text_warning: {
    color: yohaku.warning,
  },
  /** text-white */
  text_white: {
    color: colors.white,
  },
  /** text-white/60 */
  text_white_60: {
    color: `color-mix(in oklab, ${colors.white} 60%, transparent)`,
  },
  /** text-white/65 */
  text_white_65: {
    color: `color-mix(in oklab, ${colors.white} 65%, transparent)`,
  },
  /** text-white/85 */
  text_white_85: {
    color: `color-mix(in oklab, ${colors.white} 85%, transparent)`,
  },
  /** text-white/90 */
  text_white_90: {
    color: `color-mix(in oklab, ${colors.white} 90%, transparent)`,
  },
  /** text-white/95 */
  text_white_95: {
    color: `color-mix(in oklab, ${colors.white} 95%, transparent)`,
  },
  /** to-black/85 */
  to_black_85: {
    "--sx-gradient-to": `color-mix(in oklab, ${colors.black} 85%, transparent)`,
  },
  /** to-transparent */
  to_transparent: {
    "--sx-gradient-to": colors.transparent,
  },
  /** touch-none */
  touch_none: {
    touchAction: 'none',
  },
  /** tracking-[-0.015em] */
  tracking___0dot015em: {
    letterSpacing: '-0.015em',
  },
  /** tracking-[0.01em] */
  tracking__0dot01em: {
    letterSpacing: '0.01em',
  },
  /** tracking-[0.05em] */
  tracking__0dot05em: {
    letterSpacing: '0.05em',
  },
  /** tracking-[0.06em] */
  tracking__0dot06em: {
    letterSpacing: '0.06em',
  },
  /** tracking-[0.12em] */
  tracking__0dot12em: {
    letterSpacing: '0.12em',
  },
  /** tracking-[0.14em] */
  tracking__0dot14em: {
    letterSpacing: '0.14em',
  },
  /** tracking-[0.15em] */
  tracking__0dot15em: {
    letterSpacing: '0.15em',
  },
  /** tracking-normal */
  tracking_normal: {
    letterSpacing: letterSpacing.normal,
  },
  /** tracking-wider */
  tracking_wider: {
    letterSpacing: letterSpacing.wider,
  },
  /** tracking-widest */
  tracking_widest: {
    letterSpacing: letterSpacing.widest,
  },
  /** transition-[left] */
  transition__left: {
    transitionProperty: 'left',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-[opacity,scale] */
  transition__opacity_scale: {
    transitionProperty: 'opacity,scale',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-[width,background-color] */
  transition__width_background_color: {
    transitionProperty: 'width,background-color',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-all */
  transition_all: {
    transitionProperty: 'all',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-colors */
  transition_colors: {
    transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-opacity */
  transition_opacity: {
    transitionProperty: 'opacity',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** transition-transform */
  transition_transform: {
    transitionProperty: 'transform',
    transitionTimingFunction: defaults.transitionTimingFunction,
    transitionDuration: defaults.transitionDuration,
  },
  /** truncate */
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  /** uppercase */
  uppercase: {
    textTransform: 'uppercase',
  },
  /** via-black/55 */
  via_black_55: {
    "--sx-gradient-via": `color-mix(in oklab, ${colors.black} 55%, transparent)`,
    "--sx-gradient-stops": `var(--sx-gradient-from), ${`color-mix(in oklab, ${colors.black} 55%, transparent)`}, var(--sx-gradient-to, transparent)`,
  },
  /** via-transparent */
  via_transparent: {
    "--sx-gradient-via": colors.transparent,
    "--sx-gradient-stops": `var(--sx-gradient-from), ${colors.transparent}, var(--sx-gradient-to, transparent)`,
  },
  /** w-1.5 */
  w_1dot5: {
    width: spacing['1.5'],
  },
  /** w-2/3 */
  w_2_3: {
    width: '66.666667%',
  },
  /** w-20 */
  w_20: {
    width: spacing[20],
  },
  /** w-24 */
  w_24: {
    width: spacing[24],
  },
  /** w-3/5 */
  w_3_5: {
    width: '60%',
  },
  /** w-32 */
  w_32: {
    width: spacing[32],
  },
  /** w-40 */
  w_40: {
    width: spacing[40],
  },
  /** w-[300px] */
  w__300px: {
    width: '300px',
  },
  /** w-[8.75rem] */
  w__8dot75rem: {
    width: '8.75rem',
  },
  /** w-full */
  w_full: {
    width: '100%',
  },
  /** w-full! */
  w_fullimportant_: {
    width: '100% !important',
  },
  /** w-max */
  w_max: {
    width: 'max-content',
  },
  /** w-px */
  w_px: {
    width: spacing.px,
  },
  /** whitespace-nowrap */
  whitespace_nowrap: {
    whiteSpace: 'nowrap',
  },
  /** whitespace-pre-wrap */
  whitespace_pre_wrap: {
    whiteSpace: 'pre-wrap',
  },
  /** z-0 */
  z_0: {
    zIndex: 0,
  },
  /** z-10 */
  z_10: {
    zIndex: 10,
  },
  /** z-[1] */
  z__1: {
    zIndex: '1',
  },
  /** z-[9] */
  z__9: {
    zIndex: '9',
  },
})
