import { useWindowDimensions } from 'react-native'

/*
 * The tail (like + comments) shares one scroll view with the body, so a body
 * slot that starts at zero height pulls the whole tail up under the title and
 * drops it again as the skeleton and then the real body land — two visible
 * jumps on every open. Reserving `viewport - slotTop` holds the tail below the
 * fold for the whole load: `slotTop` is measured inside the scrolled content
 * while the fold is measured from the window, so the reservation always clears
 * it by the height of the navigation header, whatever the title costs.
 */
export function useReservedBodyHeight(slotTop?: number | null) {
  const { height } = useWindowDimensions()
  // Until the slot reports its position, assume the shallowest header the app
  // ships — a one-line note title with no notice card — so the reservation
  // never starts too short and flashes the tail into view.
  const top = slotTop ?? Math.round(height * 0.3)
  return Math.max(240, Math.round(height - top))
}
