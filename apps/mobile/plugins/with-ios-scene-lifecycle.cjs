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
import UIKit
import UserNotifications

private enum SceneRestoration {
  static let notification = Notification.Name("YohakuRestorableRouteDidChange")
  private static let routeURLKey = "routeURL"
  private static let restorationAttemptedKey = "yohaku.scene.restorationAttempted"

  private static var activityType: String {
    "\\(Bundle.main.bundleIdentifier ?? "dev.yohaku.app").route-restoration"
  }

  static func activity(routeURLString: String) -> NSUserActivity? {
    guard let routeURL = URL(string: routeURLString) else {
      return nil
    }
    let activity = NSUserActivity(activityType: activityType)
    activity.title = "Restore reading route"
    activity.userInfo = [routeURLKey: routeURL.absoluteString]
    activity.targetContentIdentifier = routeURL.absoluteString
    return activity
  }

  static func restorationURL(from activity: NSUserActivity?) -> URL? {
    guard
      let activity,
      activity.activityType == activityType,
      !UserDefaults.standard.bool(forKey: restorationAttemptedKey),
      let routeURLString = activity.userInfo?[routeURLKey] as? String,
      let routeURL = URL(string: routeURLString)
    else {
      return nil
    }
    UserDefaults.standard.set(true, forKey: restorationAttemptedKey)
    return routeURL
  }

  static func markSuccessful() {
    UserDefaults.standard.removeObject(forKey: restorationAttemptedKey)
  }
}

@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private weak var connectedScene: UIScene?

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
    connectedScene = scene
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(restorableRouteDidChange(_:)),
      name: SceneRestoration.notification,
      object: nil
    )

    let incomingURL = connectionOptions.urlContexts.first?.url
    let browsingWebActivity = connectionOptions.userActivities.first {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }
    let notificationURL = Self.notificationURL(
      from: connectionOptions.notificationResponse
    )
    var restorationURL: URL?
    if incomingURL == nil && notificationURL == nil && browsingWebActivity == nil {
      restorationURL = SceneRestoration.restorationURL(
        from: session.stateRestorationActivity
      )
    }
    let initialURL = incomingURL ?? notificationURL ?? restorationURL
    if let restorationURL {
      Self.route(url: restorationURL)
    }
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: Self.launchOptions(
        url: initialURL,
        userActivity: browsingWebActivity
      )
    )

    Self.route(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { Self.route(userActivity: $0) }
    if let notificationURL {
      Self.route(url: notificationURL)
    }
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
    scene.userActivity
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

  @objc private func restorableRouteDidChange(_ notification: Notification) {
    guard
      let routeURLString = notification.userInfo?["routeURL"] as? String,
      let activity = SceneRestoration.activity(routeURLString: routeURLString)
    else {
      return
    }
    connectedScene?.userActivity = activity
    SceneRestoration.markSuccessful()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
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
      route(
        url: context.url,
        options: openURLOptions(from: context.options)
      )
    }
  }

  static func route(
    url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) {
    _ = ExpoAppDelegateSubscriberManager.application(
      UIApplication.shared,
      open: url,
      options: options
    )
    RCTLinkingManager.application(
      UIApplication.shared,
      open: url,
      options: options
    )
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

  static func notificationURL(from response: UNNotificationResponse?) -> URL? {
    let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes")
      as? [[String: Any]] ?? []
    let schemes = urlTypes.flatMap({
      $0["CFBundleURLSchemes"] as? [String] ?? []
    })
    guard
      let targetPath = response?.notification.request.content.userInfo["target_path"] as? String,
      targetPath.hasPrefix("/"),
      !targetPath.hasPrefix("//"),
      let scheme = schemes.first(where: { $0 == Bundle.main.bundleIdentifier })
        ?? schemes.first
    else {
      return nil
    }
    var components = URLComponents()
    components.scheme = scheme
    components.path = targetPath
    return components.url
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
module.exports.sceneDelegateSource = SCENE_DELEGATE_SOURCE
