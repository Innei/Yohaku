import { createContext, type ReactNode, use } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const PAPER_TAB_BAR_CAPSULE_HEIGHT = 60
export const PAPER_TAB_BAR_BOTTOM_GAP = 10
export const PAPER_TAB_BAR_SCROLL_EDGE_BLEED = 48

const PaperTabBarInsetContext = createContext(0)

export function PaperTabBarInsetProvider({
  children,
}: {
  children: ReactNode
}) {
  const { bottom } = useSafeAreaInsets()
  const inset = PAPER_TAB_BAR_CAPSULE_HEIGHT + PAPER_TAB_BAR_BOTTOM_GAP + bottom
  return (
    <PaperTabBarInsetContext value={inset}>{children}</PaperTabBarInsetContext>
  )
}

export function usePaperTabBarInset() {
  return use(PaperTabBarInsetContext)
}
