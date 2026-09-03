import { YohakuNative } from '@modules/yohaku'

export function openExternalUrl(url: string) {
  return YohakuNative.presentSafari(url)
}
