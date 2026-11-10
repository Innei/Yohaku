import { requireNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

type NativeDuoSpike = {
  dismiss: () => Promise<void>
  isArrangementAvailable: () => boolean
  lab: (action: string, first: string, second: string) => Promise<void>
  main: (action: string) => Promise<void>
  popOuter: () => Promise<void>
  present: () => Promise<void>
  pushOuter: (label: string) => Promise<void>
  setOuterBarOnPage: (visible: boolean) => Promise<void>
}

// The Duo spike is an iPad experiment; Android keeps the dev screens inert.
const native: NativeDuoSpike | null =
  Platform.OS === 'android'
    ? null
    : requireNativeModule<NativeDuoSpike>('YohakuDuoSpike')

const noop = async () => {}

export const isDuoArrangementAvailable = () =>
  native?.isArrangementAvailable() ?? false
export const presentDuoSpike = () => native?.present() ?? noop()
export const pushDuoSpikeOuter = (label: string) =>
  native?.pushOuter(label) ?? noop()
export const popDuoSpikeOuter = () => native?.popOuter() ?? noop()
export const setDuoSpikeOuterBar = (visible: boolean) =>
  native?.setOuterBarOnPage(visible) ?? noop()
export const duoLab = (action: string, first = '', second = '') =>
  native?.lab(action, first, second) ?? noop()
export const duoMain = (action: string) => native?.main(action) ?? noop()
export const dismissDuoSpike = () => native?.dismiss() ?? noop()
