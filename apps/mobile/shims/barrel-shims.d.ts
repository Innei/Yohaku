// Both icon packages ship a single bundled .d.ts for their barrel and no
// per-icon declarations, so the deep imports the shims use are untyped.
declare module 'lucide-react/dist/esm/icons/*.mjs' {
  import type { ComponentType, SVGProps } from 'react'

  const icon: ComponentType<
    SVGProps<SVGSVGElement> & { size?: number | string }
  >
  export default icon
}

declare module '@icons-pack/react-simple-icons/icons/*.mjs' {
  import type { ComponentType, SVGProps } from 'react'

  const icon: ComponentType<
    SVGProps<SVGSVGElement> & { size?: number | string }
  >
  export default icon
}
