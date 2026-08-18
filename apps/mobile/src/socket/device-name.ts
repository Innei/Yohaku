import * as Device from 'expo-device'

import { formatDeviceDisplayName } from './device-name-format'

export function deviceDisplayName(): string {
  return formatDeviceDisplayName({
    modelId: readModelId(),
    modelName: readModelName(),
  })
}

function readModelName(): string | null {
  try {
    const name = Device.modelName?.trim()
    return name || null
  } catch {
    return null
  }
}

function readModelId(): string | null {
  try {
    const id = Device.modelId
    return typeof id === 'string' && id.trim() ? id.trim() : null
  } catch {
    return null
  }
}
