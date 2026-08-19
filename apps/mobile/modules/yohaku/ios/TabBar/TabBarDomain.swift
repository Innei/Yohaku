import CryptoKit
import UIKit

enum TabBarDomain {
  private static let expectedItemCount = 4
  private static let compactScale: CGFloat = 0.82
  private static let configurationRetryDelay: TimeInterval = 0.25
  private static let configurationRetryWindow: TimeInterval = 30
  private static let avatarPointSize: CGFloat = 30
  private static var configurationDeadline: DispatchTime?
  private static var configurationRequested = false
  private static var configurationRetry: DispatchWorkItem?
  private static var lifecycleObservers: [NSObjectProtocol] = []
  private static var selectionObservation: NSKeyValueObservation?
  private static var avatarItemObservation: NSKeyValueObservation?
  private static var avatarImageObservation: NSKeyValueObservation?
  private static var avatarSelectedImageObservation: NSKeyValueObservation?
  private static var applyingCircularAvatar = false
  private static let circularizedImages = NSHashTable<UIImage>.weakObjects()
  private static weak var configuredTabController: UITabBarController?
  private static weak var meLongPressHost: UIView?
  static var onMeTabLongPress: (() -> Void)?

  enum CircularImageError: Error, LocalizedError {
    case invalidUrl
    case decodeFailed

    var errorDescription: String? {
      switch self {
      case .invalidUrl: return "circularImageUri requires a valid URL"
      case .decodeFailed: return "circularImageUri could not decode the image"
      }
    }
  }

  struct CircularImageSource {
    let height: CGFloat
    let scale: CGFloat
    let uri: String
    let width: CGFloat
  }

  static func circularImageUri(urlString: String) async throws -> CircularImageSource {
    guard let remote = URL(string: urlString) else { throw CircularImageError.invalidUrl }
    let scale = await displayScale()
    let dest = cacheURL(for: urlString, scale: scale)
    if FileManager.default.fileExists(atPath: dest.path) {
      return CircularImageSource(
        height: avatarPointSize,
        scale: scale,
        uri: dest.absoluteString,
        width: avatarPointSize
      )
    }

    let (data, _) = try await URLSession.shared.data(from: remote)
    guard let image = UIImage(data: data) else { throw CircularImageError.decodeFailed }
    let circled = circularized(image, scale: scale)

    guard let png = circled.pngData() else { throw CircularImageError.decodeFailed }
    try png.write(to: dest, options: .atomic)
    return CircularImageSource(
      height: avatarPointSize,
      scale: scale,
      uri: dest.absoluteString,
      width: avatarPointSize
    )
  }

  private static func displayScale() async -> CGFloat {
    await MainActor.run {
      let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
      let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
      return scene?.screen.scale ?? 3
    }
  }

  private static func cacheURL(for remote: String, scale: CGFloat) -> URL {
    let digest = SHA256.hash(data: Data(remote.utf8))
      .compactMap { String(format: "%02x", $0) }
      .joined()
    let scaleToken = String(format: "%g", scale)
    return FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent(
        "yohaku-tab-avatar-\(digest)-\(Int(avatarPointSize))@\(scaleToken)x.png"
      )
  }

  private static func aspectFillRect(_ imageSize: CGSize, in canvas: CGSize) -> CGRect {
    guard imageSize.width > 0, imageSize.height > 0 else {
      return CGRect(origin: .zero, size: canvas)
    }
    let scale = max(canvas.width / imageSize.width, canvas.height / imageSize.height)
    let size = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
    return CGRect(
      x: (canvas.width - size.width) / 2,
      y: (canvas.height - size.height) / 2,
      width: size.width,
      height: size.height
    )
  }

  static var liquidGlassAvailable: Bool {
    if #available(iOS 26.0, *) {
      return true
    }
    return false
  }

  static func configureCompactNativeTabBar() {
    configurationRequested = true
    installConfigurationObservers()
    configurationDeadline = .now() + configurationRetryWindow
    attemptConfigureCompactNativeTabBar()
  }

  private static func attemptConfigureCompactNativeTabBar() {
    configurationRetry?.cancel()
    configurationRetry = nil

    guard let tabController = findTabBarController() else {
      scheduleConfigurationRetry()
      return
    }
    configurationDeadline = nil

    // Keep the system-owned UITabBar intact. UIKit remains responsible for
    // Liquid Glass, selection morphing, safe areas, accessibility, repeated
    // tab selection, and native tab-bar transitions.
    tabController.additionalSafeAreaInsets.bottom = 0
    tabController.tabBar.isHidden = false
    tabController.tabBar.alpha = 1
    tabController.tabBar.isUserInteractionEnabled = true

    observeAvatarItem(on: tabController)
    installMeTabLongPress(on: tabController)
    // Gesture installation can rebuild UITabBar's layer tree and drop the
    // compact sublayerTransform. Apply scale last so it survives.
    applyCompactRenderingScale(to: tabController)

    if configuredTabController !== tabController {
      selectionObservation = tabController.observe(
        \.selectedViewController,
        options: [.new]
      ) { controller, _ in
        DispatchQueue.main.async {
          observeAvatarItem(on: controller)
          installMeTabLongPress(on: controller)
          applyCompactRenderingScale(to: controller)
        }
      }
      configuredTabController = tabController
    }

    // React Native Screens assigns the selected tab's appearance during the
    // same update cycle. Reapply once after that transaction completes.
    DispatchQueue.main.async {
      observeAvatarItem(on: tabController)
      installMeTabLongPress(on: tabController)
      applyCompactRenderingScale(to: tabController)
    }
  }

  private static func installConfigurationObservers() {
    guard lifecycleObservers.isEmpty else { return }
    let center = NotificationCenter.default
    lifecycleObservers = [
      UIApplication.didBecomeActiveNotification,
      UIWindow.didBecomeKeyNotification,
    ].map { name in
      center.addObserver(forName: name, object: nil, queue: .main) { _ in
        guard configurationRequested else { return }
        configureCompactNativeTabBar()
      }
    }
  }

  private static func scheduleConfigurationRetry() {
    guard
      configurationRequested,
      UIApplication.shared.applicationState != .background,
      let configurationDeadline,
      DispatchTime.now().uptimeNanoseconds < configurationDeadline.uptimeNanoseconds
    else {
      return
    }

    let work = DispatchWorkItem {
      configurationRetry = nil
      attemptConfigureCompactNativeTabBar()
    }
    configurationRetry = work
    DispatchQueue.main.asyncAfter(
      deadline: .now() + configurationRetryDelay,
      execute: work
    )
  }

  private static func observeAvatarItem(on tabController: UITabBarController) {
    guard
      let controllers = tabController.viewControllers,
      controllers.count == expectedItemCount
    else {
      return
    }
    let me = controllers[expectedItemCount - 1]
    if avatarItemObservation == nil || configuredTabController !== tabController {
      avatarItemObservation = me.observe(\.tabBarItem, options: [.initial, .new]) { controller, _ in
        observeAvatarImages(on: controller.tabBarItem)
        applyCircularAvatar(to: controller.tabBarItem)
      }
    } else {
      observeAvatarImages(on: me.tabBarItem)
      applyCircularAvatar(to: me.tabBarItem)
    }
  }

  private static func observeAvatarImages(on item: UITabBarItem) {
    avatarImageObservation = item.observe(\.image, options: [.new]) { item, _ in
      applyCircularAvatar(to: item)
    }
    avatarSelectedImageObservation = item.observe(\.selectedImage, options: [.new]) { item, _ in
      applyCircularAvatar(to: item)
    }
  }

  // UITabBarItem has no corner radius. Screens also does not cancel an in-flight
  // icon load, so a late square photo can replace a circular bitmap. Clip here
  // whenever an original-mode image lands on the Me tab.
  private static func applyCircularAvatar(to item: UITabBarItem) {
    guard !applyingCircularAvatar else { return }
    applyingCircularAvatar = true
    defer { applyingCircularAvatar = false }

    if let next = circularizedIfNeeded(item.image), next !== item.image {
      item.image = next
    }
    if let next = circularizedIfNeeded(item.selectedImage), next !== item.selectedImage {
      item.selectedImage = next
    }
  }

  private static func circularizedIfNeeded(_ image: UIImage?) -> UIImage? {
    guard let image else { return nil }
    if circularizedImages.contains(image) { return image }
    if image.isSymbolImage || image.renderingMode == .alwaysTemplate { return image }
    let circled = circularized(image).withRenderingMode(image.renderingMode)
    circularizedImages.add(circled)
    return circled
  }

  private static func circularized(_ image: UIImage, scale: CGFloat? = nil) -> UIImage {
    let resolvedScale = scale ?? (image.scale > 0 ? image.scale : 3)
    let canvas = CGSize(width: avatarPointSize, height: avatarPointSize)
    let format = UIGraphicsImageRendererFormat()
    format.scale = resolvedScale
    format.opaque = false
    let renderer = UIGraphicsImageRenderer(size: canvas, format: format)
    return renderer.image { _ in
      UIBezierPath(ovalIn: CGRect(origin: .zero, size: canvas)).addClip()
      image.draw(in: aspectFillRect(image.size, in: canvas))
    }
  }

  private static func installMeTabLongPress(on tabController: UITabBarController) {
    let tabBar = tabController.tabBar
    if meLongPressHost === tabBar { return }
    removeMeTabLongPress()
    let gesture = UILongPressGestureRecognizer(
      target: TabBarLongPressProxy.shared,
      action: #selector(TabBarLongPressProxy.handle(_:))
    )
    gesture.minimumPressDuration = 0.45
    gesture.allowableMovement = 12
    gesture.cancelsTouchesInView = false
    gesture.name = TabBarLongPressProxy.recognizerName
    gesture.delegate = TabBarLongPressProxy.shared
    tabBar.addGestureRecognizer(gesture)
    meLongPressHost = tabBar
  }

  private static func removeMeTabLongPress() {
    guard let host = meLongPressHost else { return }
    host.gestureRecognizers?
      .filter { $0.name == TabBarLongPressProxy.recognizerName }
      .forEach { host.removeGestureRecognizer($0) }
    meLongPressHost = nil
  }

  static func handleMeTabLongPress(_ gesture: UILongPressGestureRecognizer) {
    guard gesture.state == .began, let tabBar = gesture.view as? UITabBar else { return }
    let finger = gesture.location(in: tabBar)
    let unscaled = unscaledLocation(finger, in: tabBar.bounds, scale: compactScale)
    let container = tabItemContainer(in: tabBar)
    let local = container.convert(unscaled, from: tabBar)
    guard isMeTabItem(
      at: local,
      bounds: container.bounds,
      itemCount: tabBar.items?.count ?? 0
    ) else { return }
    onMeTabLongPress?()
  }

  // Liquid Glass draws items in a centered platter, and compactScale is a
  // sublayerTransform that does not participate in UIView hit-testing. Map the
  // finger back through that scale, then slice the platter — not the full bar.
  static func unscaledLocation(_ point: CGPoint, in bounds: CGRect, scale: CGFloat) -> CGPoint {
    guard scale > 0, scale != 1 else { return point }
    let inv = 1 / scale
    return CGPoint(
      x: bounds.midX + (point.x - bounds.midX) * inv,
      y: bounds.midY + (point.y - bounds.midY) * inv
    )
  }

  static func isMeTabItem(at location: CGPoint, bounds: CGRect, itemCount: Int) -> Bool {
    guard itemCount == expectedItemCount, bounds.width > 0, bounds.contains(location) else {
      return false
    }
    let raw = Int((location.x - bounds.minX) / bounds.width * CGFloat(itemCount))
    let index = min(itemCount - 1, max(0, raw))
    return index == expectedItemCount - 1
  }

  private static func tabItemContainer(in tabBar: UITabBar) -> UIView {
    tabBar.subviews.first { view in
      NSStringFromClass(type(of: view)).localizedCaseInsensitiveContains("platter")
    } ?? tabBar
  }

  private static func applyCompactRenderingScale(to tabController: UITabBarController) {
    let tabBar = tabController.tabBar

    // Uniformly scale UIKit's complete rendering tree so the original tab bar
    // proportions and system-owned Liquid Glass animation remain intact. The
    // UITabBar frame itself stays unchanged, retaining the native safe-area and
    // accessibility hit regions.
    tabBar.layer.sublayerTransform = CATransform3DMakeScale(
      compactScale,
      compactScale,
      1
    )

    if let items = tabBar.items, items.count == expectedItemCount {
      applyCircularAvatar(to: items[expectedItemCount - 1])
    }

    tabBar.setNeedsLayout()
  }

  private static func findTabBarController() -> UITabBarController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    guard
      let window = scene?.windows.first(where: { $0.isKeyWindow }) ?? scene?.windows.first,
      let root = window.rootViewController
    else {
      return nil
    }
    return search(from: root)
  }

  private static func search(from viewController: UIViewController) -> UITabBarController? {
    if
      let tab = viewController as? UITabBarController,
      tab.viewIfLoaded?.window != nil,
      tab.tabBar.items?.count == expectedItemCount
    {
      return tab
    }
    for child in viewController.children {
      if let found = search(from: child) {
        return found
      }
    }
    if let presented = viewController.presentedViewController {
      return search(from: presented)
    }
    return nil
  }
}

private final class TabBarLongPressProxy: NSObject, UIGestureRecognizerDelegate {
  static let shared = TabBarLongPressProxy()
  static let recognizerName = "yohaku.me-tab-long-press"

  @objc func handle(_ gesture: UILongPressGestureRecognizer) {
    TabBarDomain.handleMeTabLongPress(gesture)
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }
}
