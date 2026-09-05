import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import packageJson from '../package.json'

const require = createRequire(import.meta.url)

const mobileRoot = path.resolve(import.meta.dirname, '..')

describe('native dependency policy', () => {
  it('does not depend on expo-secure-store', () => {
    expect(packageJson.dependencies).not.toHaveProperty('expo-secure-store')
  })

  it('does not depend on beautiful-mermaid from app code', () => {
    expect(packageJson.dependencies).not.toHaveProperty('beautiful-mermaid')
  })

  it('does not install expo-file-system', () => {
    expect(packageJson.dependencies).not.toHaveProperty('expo-file-system')
    expect(() => require.resolve('expo-file-system')).toThrow()
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

  it('pods ElkSwift and BeautifulMermaid for native mermaid', () => {
    const appConfig = readFileSync(path.join(mobileRoot, 'app.config.ts'), 'utf8')
    expect(appConfig).toContain('./plugins/with-ios-mermaid-pods.cjs')

    const plugin = readFileSync(
      path.join(mobileRoot, 'plugins/with-ios-mermaid-pods.cjs'),
      'utf8',
    )
    expect(plugin).toContain("pod 'ElkSwift'")
    expect(plugin).toContain("pod 'BeautifulMermaid'")

    const elk = readFileSync(
      path.join(mobileRoot, 'modules/yohaku/ios/Vendor/ElkSwift.podspec'),
      'utf8',
    )
    const mermaid = readFileSync(
      path.join(mobileRoot, 'modules/yohaku/ios/Vendor/BeautifulMermaid.podspec'),
      'utf8',
    )
    expect(elk).toContain("s.version = '1.0.2'")
    expect(mermaid).toContain("s.version = '1.0.4'")

    const kit = readFileSync(
      path.join(mobileRoot, 'modules/yohaku/ios/YohakuKit.podspec'),
      'utf8',
    )
    expect(kit).toContain("s.dependency 'BeautifulMermaid'")
  })
})
