import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import type { CSSProperties, FC } from 'react'

// Accent-tinted radial gradient that blooms from the bottom-left of the host
// element on hover. Slow fade-in (~700ms), low alpha (~18%) — meant to read as
// ink touching paper rather than a UI hover state. No lift, no shadow.
//
// Host requirements: `group relative isolate` (or equivalent stacking context
// + group selector) — without `isolate` the `-z-10` overlay can sink below the
// background of an ancestor, and without `group` the bloom never fires.
const inkWashStyle: CSSProperties = {
  background:
    'radial-gradient(220px 220px at 8% 110%, color-mix(in oklch, var(--color-accent) 18%, transparent), transparent 70%)',
}

export const InkWash: FC = () => (
  <span
    aria-hidden
    {...sx(atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms._z_10, atoms.opacity_0, atoms.transition_opacity, atoms.duration_700, atoms.ease_out, atoms.group_hover_opacity_100)}
    style={inkWashStyle}
  />
)
