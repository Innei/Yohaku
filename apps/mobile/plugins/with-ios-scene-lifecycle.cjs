/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

// Expo's template SceneDelegate (an empty ExpoAppSceneDelegate subclass) does not
// open a cold-start notification target or restore the last committed route, so
// this plugin replaces its body. Both URLs are fed to Expo Linking before
// React Native starts because expo-router reads its initial URL from
// ExpoLinkingRegistry on iOS, and a `url` event sent after startup reaches no
// listener.
const fs = require('node:fs')
const path = require('node:path')

const { IOSConfig, withXcodeProject } = require('expo/config-plugins')

const SCENE_DELEGATE_SOURCE = `internal import Expo
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
class SceneDelegate: ExpoAppSceneDelegate {
  private weak var connectedScene: UIScene?

  override func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    connectedScene = scene
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(restorableRouteDidChange(_:)),
      name: SceneRestoration.notification,
      object: nil
    )

    if let coldStartURL = Self.coldStartURL(
      session: session,
      connectionOptions: connectionOptions
    ) {
      _ = ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        open: coldStartURL,
        options: [:]
      )
    }

    super.scene(scene, willConnectTo: session, options: connectionOptions)
  }

  @objc func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
    scene.userActivity
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
  static func coldStartURL(
    session: UISceneSession,
    connectionOptions: UIScene.ConnectionOptions
  ) -> URL? {
    if !connectionOptions.urlContexts.isEmpty {
      return nil
    }
    if let notificationURL = notificationURL(
      from: connectionOptions.notificationResponse
    ) {
      return notificationURL
    }
    let browsingWebActivity = connectionOptions.userActivities.contains {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }
    if browsingWebActivity {
      return nil
    }
    return SceneRestoration.restorationURL(from: session.stateRestorationActivity)
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
}
`

const assertSceneTemplate = (appDelegateSource, sceneDelegateSource) => {
  if (!appDelegateSource.includes('ExpoReactNativeFactoryProvider')) {
    throw new Error(
      'Expected an Expo AppDelegate that conforms to ExpoReactNativeFactoryProvider (Expo SDK 58+).',
    )
  }
  if (
    sceneDelegateSource !== SCENE_DELEGATE_SOURCE &&
    !sceneDelegateSource.includes('class SceneDelegate: ExpoAppSceneDelegate')
  ) {
    throw new Error(
      'Expected Expo to generate SceneDelegate.swift as an ExpoAppSceneDelegate subclass.',
    )
  }
}

const withIosSceneLifecycle = (config) =>
  withXcodeProject(config, (config) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot,
    )
    const appDelegatePath = IOSConfig.Paths.getAppDelegateFilePath(
      config.modRequest.projectRoot,
    )
    const relativeFilePath = path.join(projectName, 'SceneDelegate.swift')
    const absoluteFilePath = path.join(
      config.modRequest.platformProjectRoot,
      relativeFilePath,
    )

    assertSceneTemplate(
      fs.readFileSync(appDelegatePath, 'utf8'),
      fs.existsSync(absoluteFilePath)
        ? fs.readFileSync(absoluteFilePath, 'utf8')
        : '',
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

module.exports = withIosSceneLifecycle
module.exports.assertSceneTemplate = assertSceneTemplate
module.exports.sceneDelegateSource = SCENE_DELEGATE_SOURCE
