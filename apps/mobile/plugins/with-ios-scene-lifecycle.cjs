/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

// Temporary Expo SDK 57 backport for https://github.com/expo/expo/issues/46664.
// Remove this plugin after the installed Expo release generates its own SceneDelegate.
const fs = require('node:fs')
const path = require('node:path')

const {
  IOSConfig,
  withAppDelegate,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins')

const LEGACY_WINDOW_BOOTSTRAP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`

const SCENE_WINDOW_BOOTSTRAP = `    // The window is created and React Native is started by SceneDelegate under the
    // scene-based life cycle required by the iOS 27 SDK.`

const SCENE_DELEGATE_SOURCE = `internal import Expo
import React

@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory else {
      fatalError("SceneDelegate could not obtain the React Native factory from AppDelegate.")
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    let browsingWebActivity = connectionOptions.userActivities.first {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: Self.launchOptions(
        url: connectionOptions.urlContexts.first?.url,
        userActivity: browsingWebActivity
      )
    )

    Self.route(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { Self.route(userActivity: $0) }
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    Self.route(urlContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    Self.route(userActivity: userActivity)
  }
}

extension SceneDelegate {
  static func launchOptions(
    url: URL?,
    userActivity: NSUserActivity?
  ) -> [UIApplication.LaunchOptionsKey: Any]? {
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url {
      let urlKey = UIApplication.LaunchOptionsKey(rawValue: "UIApplicationLaunchOptionsURLKey")
      launchOptions[urlKey] = url
    }
    if let userActivity {
      let dictionaryKey = UIApplication.LaunchOptionsKey(
        rawValue: "UIApplicationLaunchOptionsUserActivityDictionaryKey"
      )
      launchOptions[dictionaryKey] = [
        "UIApplicationLaunchOptionsUserActivityTypeKey": userActivity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": userActivity,
      ]
    }
    return launchOptions.isEmpty ? nil : launchOptions
  }

  static func route(urlContexts: Set<UIOpenURLContext>) {
    for context in urlContexts {
      let options = openURLOptions(from: context.options)
      _ = ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        open: context.url,
        options: options
      )
      RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: options
      )
    }
  }

  static func route(userActivity: NSUserActivity) {
    _ = ExpoAppDelegateSubscriberManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  private static func openURLOptions(
    from sceneOptions: UIScene.OpenURLOptions
  ) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    if let sourceApplication = sceneOptions.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }
    if let annotation = sceneOptions.annotation {
      options[.annotation] = annotation
    }
    options[.openInPlace] = sceneOptions.openInPlace
    return options
  }
}
`

const patchAppDelegate = (source) => {
  if (
    source.includes('ExpoReactNativeFactoryProvider') ||
    source.includes(SCENE_WINDOW_BOOTSTRAP)
  ) {
    return source
  }

  if (!source.includes(LEGACY_WINDOW_BOOTSTRAP)) {
    throw new Error(
      'Unable to migrate AppDelegate to the UIScene lifecycle: the Expo bootstrap template changed.',
    )
  }

  return source.replace(LEGACY_WINDOW_BOOTSTRAP, SCENE_WINDOW_BOOTSTRAP)
}

const withSceneManifest = (config) =>
  withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    }
    return config
  })

const withSceneAwareAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(
        'The iOS scene lifecycle plugin requires a Swift AppDelegate.',
      )
    }

    config.modResults.contents = patchAppDelegate(config.modResults.contents)
    return config
  })

const withSceneDelegateSource = (config) =>
  withXcodeProject(config, (config) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot,
    )
    const appDelegatePath = IOSConfig.Paths.getAppDelegateFilePath(
      config.modRequest.projectRoot,
    )
    const appDelegateSource = fs.readFileSync(appDelegatePath, 'utf8')

    // Expo versions with native UIScene support already generate the correct source.
    if (appDelegateSource.includes('ExpoReactNativeFactoryProvider')) {
      return config
    }

    const relativeFilePath = path.join(projectName, 'SceneDelegate.swift')
    const absoluteFilePath = path.join(
      config.modRequest.platformProjectRoot,
      relativeFilePath,
    )
    fs.writeFileSync(absoluteFilePath, SCENE_DELEGATE_SOURCE, 'utf8')

    if (!config.modResults.hasFile(relativeFilePath)) {
      config.modResults = IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: relativeFilePath,
        groupName: projectName,
        project: config.modResults,
      })
    }

    return config
  })

const withIosSceneLifecycle = (config) => {
  config = withSceneManifest(config)
  config = withSceneAwareAppDelegate(config)
  config = withSceneDelegateSource(config)
  return config
}

module.exports = withIosSceneLifecycle
module.exports.patchAppDelegate = patchAppDelegate
