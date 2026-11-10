import { Platform } from 'react-native'

const iosMajorVersion = Number.parseInt(String(Platform.Version), 10)

// Android has no UIKit navigation bar to host the controls, so every screen
// takes the paper-controls path (the same one iOS < 26 uses). iOS 26+ keeps the
// system Liquid Glass toolbar.
export const usesPaperNavigationControls =
  Platform.OS === 'android' ? true : iosMajorVersion < 26
