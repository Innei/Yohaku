import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import packageJson from '../package.json'

const require = createRequire(import.meta.url)

describe('native dependency policy', () => {
  it('does not depend on expo-secure-store', () => {
    expect(packageJson.dependencies).not.toHaveProperty('expo-secure-store')
  })

  it('excludes the unused Expo FileSystem module from autolinking', () => {
    expect(packageJson.expo?.autolinking?.exclude ?? []).toContain(
      'expo-file-system',
    )
  })

  it('does not link AVIF decoders into Expo Image', () => {
    expect(packageJson.expo?.autolinking?.ios?.buildFromSource ?? []).toContain(
      'expo-image',
    )

    const expoImageRoot = path.dirname(require.resolve('expo-image/package.json'))
    const podspec = readFileSync(
      path.join(expoImageRoot, 'ios/ExpoImage.podspec'),
      'utf8',
    )
    const imageModule = readFileSync(
      path.join(expoImageRoot, 'ios/ImageModule.swift'),
      'utf8',
    )

    expect(podspec).not.toContain("s.dependency 'SDWebImageAVIFCoder'")
    expect(podspec).not.toContain("s.dependency 'libavif")
    expect(imageModule).not.toContain('AVIFCoder')
  })
})
