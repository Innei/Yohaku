/**
 * Android platform shim for `expo-symbols`.
 *
 * expo-symbols renders Apple SF Symbols through SwiftUI and has no Android
 * implementation. Metro redirects the bare specifier here (android only) so the
 * app code keeps calling SymbolView with SF symbol names while Android draws
 * the equivalent lucide vector.
 */
export { SymbolView } from '../modules/yohaku/android/icons'
export type { SFSymbolProps } from '../modules/yohaku/android/icons'
export default undefined
