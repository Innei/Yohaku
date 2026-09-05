import { YohakuNative } from '@modules/yohaku'

export function showToast(message: string) {
  YohakuNative.showToast(message)
}
