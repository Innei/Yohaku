import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  patchAppDelegate,
  sceneDelegateSource,
} from './with-ios-scene-lifecycle.cjs'

describe('iOS scene lifecycle generation', () => {
  it('moves React Native startup from AppDelegate into SceneDelegate', () => {
    const legacy = `before
#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
after`

    expect(patchAppDelegate(legacy)).not.toContain('window = UIWindow(frame:')
    expect(patchAppDelegate(legacy)).toContain(
      'created and React Native is started by SceneDelegate',
    )
  })

  it('restores the scene route only when no incoming link takes priority', () => {
    expect(sceneDelegateSource).toContain('session.stateRestorationActivity')
    expect(sceneDelegateSource).toContain(
      'incomingURL == nil && browsingWebActivity == nil',
    )
    expect(sceneDelegateSource).toContain(
      'let initialURL = incomingURL ?? restorationURL',
    )
  })

  it('primes Expo Linking before React reads the restored initial URL', () => {
    const routeRestoration = sceneDelegateSource.indexOf(
      'Self.route(url: restorationURL)',
    )
    const startReactNative = sceneDelegateSource.indexOf(
      'factory.startReactNative(',
    )

    expect(routeRestoration).toBeGreaterThan(-1)
    expect(routeRestoration).toBeLessThan(startReactNative)
  })

  it('archives committed routes in the scene session', () => {
    expect(sceneDelegateSource).toContain(
      'func stateRestorationActivity(for scene: UIScene) -> NSUserActivity?',
    )
    expect(sceneDelegateSource).toContain('scene.userActivity')
    expect(sceneDelegateSource).toContain('YohakuRestorableRouteDidChange')
  })

  it('tries a restored route once until JavaScript commits a successful frame', () => {
    expect(sceneDelegateSource).toContain('restorationAttempted')
    expect(sceneDelegateSource).toContain('UserDefaults.standard.set(true')
    expect(sceneDelegateSource).toContain('UserDefaults.standard.removeObject')
  })

  it('bridges a committed Expo route to the active scene', async () => {
    const moduleSource = await readFile(
      path.resolve(
        import.meta.dirname,
        '../modules/yohaku/ios/YohakuModule.swift',
      ),
      'utf8',
    )
    expect(moduleSource).toContain('AsyncFunction("setRestorableRoute")')
    expect(moduleSource).toContain('YohakuRestorableRouteDidChange')
    expect(moduleSource).toContain('["routeURL": routeURL]')
  })
})
