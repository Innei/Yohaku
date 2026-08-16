import { Platform } from 'react-native'

const iosMajorVersion = Number.parseInt(String(Platform.Version), 10)

export const usesSystemNavigationAppearance =
  Platform.OS !== 'ios' || iosMajorVersion >= 26

export const usesPaperNavigationControls =
  Platform.OS === 'ios' && iosMajorVersion < 26
