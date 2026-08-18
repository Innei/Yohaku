import { NotoSerifSC_500Medium } from '@expo-google-fonts/noto-serif-sc/500Medium'
import { useFonts } from 'expo-font'

import { type NativeFontName } from './font-faces'

export { fonts, WEBVIEW_FONT_FAMILY } from './font-faces'

const CascadiaCodePL_400Regular =
  require('../../assets/fonts/CascadiaCodePL-Regular.ttf') as number
const CascadiaCodePL_600SemiBold =
  require('../../assets/fonts/CascadiaCodePL-SemiBold.ttf') as number

export const fontModules: Record<NativeFontName, number> = {
  NotoSerifSC_500Medium,
  CascadiaCodePL_400Regular,
  CascadiaCodePL_600SemiBold,
}

export function useAppFonts() {
  const [loaded] = useFonts(fontModules)
  return loaded
}
