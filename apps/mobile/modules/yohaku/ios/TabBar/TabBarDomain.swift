import CryptoKit
import UIKit

enum TabBarDomain {
  private static let expectedItemCount = 4
  private static let compactScale: CGFloat = 0.82
  private static let avatarPointSize: CGFloat = 30
  private static var selectionObservation: NSKeyValueObservation?
  private static weak var configuredTabController: UITabBarController?

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

    let canvas = CGSize(width: avatarPointSize, height: avatarPointSize)
    let format = UIGraphicsImageRendererFormat()
    format.scale = scale
    format.opaque = false
    let renderer = UIGraphicsImageRenderer(size: canvas, format: format)
    let circled = renderer.image { _ in
      UIBezierPath(ovalIn: CGRect(origin: .zero, size: canvas)).addClip()
      let fitted = aspectFillRect(image.size, in: canvas)
      image.draw(in: fitted)
    }

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

  static func configureCompactNativeTabBar(attempts: Int = 12) {
    guard let tabController = findTabBarController() else {
      if attempts > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
          configureCompactNativeTabBar(attempts: attempts - 1)
        }
      }
      return
    }

    // Keep the system-owned UITabBar intact. UIKit remains responsible for
    // Liquid Glass, selection morphing, safe areas, accessibility, repeated
    // tab selection, and native tab-bar transitions.
    tabController.additionalSafeAreaInsets.bottom = 0
    tabController.tabBar.isHidden = false
    tabController.tabBar.alpha = 1
    tabController.tabBar.isUserInteractionEnabled = true

    applyCompactRenderingScale(to: tabController)

    if configuredTabController !== tabController {
      selectionObservation = tabController.observe(
        \.selectedViewController,
        options: [.new]
      ) { controller, _ in
        DispatchQueue.main.async {
          applyCompactRenderingScale(to: controller)
        }
      }
      configuredTabController = tabController
    }

    // React Native Screens assigns the selected tab's appearance during the
    // same update cycle. Reapply once after that transaction completes.
    DispatchQueue.main.async {
      applyCompactRenderingScale(to: tabController)
    }
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
