import ExpoModulesCore
import UIKit

private final class DynamicIslandCoverView: UIView {
  private static let gradientSize = CGSize(width: 100, height: 100)

  private let effectView = UIVisualEffectView(effect: nil)
  private let fadeView = UIView()
  private let gradientView = UIImageView(image: DynamicIslandCoverView.makeGradientImage())
  private var animator: UIViewPropertyAnimator?

  override init(frame: CGRect) {
    super.init(frame: frame)

    isUserInteractionEnabled = false
    effectView.isUserInteractionEnabled = false
    effectView.alpha = 0
    fadeView.isUserInteractionEnabled = false
    fadeView.backgroundColor = .black
    fadeView.alpha = 0
    gradientView.isUserInteractionEnabled = false

    addSubview(effectView)
    addSubview(gradientView)
    addSubview(fadeView)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  deinit {
    animator?.stopAnimation(true)
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    effectView.frame = bounds
    fadeView.frame = bounds
    gradientView.frame = CGRect(
      x: (bounds.width - Self.gradientSize.width) / 2,
      y: 0,
      width: Self.gradientSize.width,
      height: Self.gradientSize.height
    )
  }

  func update(_ value: CGFloat) {
    let clampedProgress = min(1, max(0, value))
    fadeView.alpha = min(1, max(0, -0.25 + clampedProgress * 1.55))

    guard clampedProgress > 0 else {
      animator?.stopAnimation(true)
      animator = nil
      effectView.effect = nil
      effectView.alpha = 0
      return
    }

    var blurProgress = clampedProgress
    let createdAnimator = prepareAnimatorIfNeeded()
    if blurProgress > 0.99, createdAnimator {
      blurProgress = 0.99
    }
    let resolvedBlurProgress = max(0, -0.1 + blurProgress * 1.1)
    animator?.fractionComplete = resolvedBlurProgress

    // On iOS 26, a partially completed dark blur inside a masked, full-window
    // compositor can render its fallback material at full opacity. Crossfade
    // the same TG blur progress so the real avatar remains visible while the
    // blur radius grows instead of being replaced by a gray disk in one frame.
    effectView.alpha = resolvedBlurProgress
  }

  private func prepareAnimatorIfNeeded() -> Bool {
    guard animator == nil else { return false }

    effectView.effect = nil
    let animator = UIViewPropertyAnimator(duration: 1, curve: .linear)
    animator.addAnimations { [weak self] in
      self?.effectView.effect = UIBlurEffect(style: .dark)
    }
    self.animator = animator
    return true
  }

  private static func makeGradientImage() -> UIImage {
    UIGraphicsImageRenderer(size: gradientSize).image { rendererContext in
      let context = rendererContext.cgContext
      let colorSpace = CGColorSpaceCreateDeviceRGB()
      let colors =
        [
          UIColor.black.withAlphaComponent(0).cgColor,
          UIColor.black.withAlphaComponent(0).cgColor,
          UIColor.black.cgColor,
        ] as CFArray
      let locations: [CGFloat] = [0, 0.87, 1]
      guard
        let gradient = CGGradient(
          colorsSpace: colorSpace,
          colors: colors,
          locations: locations
        )
      else { return }

      let center = CGPoint(
        x: gradientSize.width / 2,
        y: gradientSize.height / 2 + 38
      )
      context.drawRadialGradient(
        gradient,
        startCenter: center,
        startRadius: 0,
        endCenter: center,
        endRadius: 90,
        options: .drawsAfterEndLocation
      )
    }
  }
}

private final class SettingsAvatarCompositorView: UIView {
  let avatarImageView = UIImageView()

  private let bottomCoverView = UIView()
  private let avatarView = UIView()
  private let topCoverView = DynamicIslandCoverView()
  private let maskLayer = CAShapeLayer()

  override init(frame: CGRect) {
    super.init(frame: frame)

    backgroundColor = .clear
    isOpaque = false
    isUserInteractionEnabled = false
    isAccessibilityElement = false
    accessibilityElementsHidden = true

    bottomCoverView.backgroundColor = .clear
    bottomCoverView.isHidden = true
    bottomCoverView.isUserInteractionEnabled = false

    avatarView.backgroundColor = .clear
    avatarView.isUserInteractionEnabled = false
    avatarView.clipsToBounds = true

    avatarImageView.backgroundColor = .clear
    avatarImageView.contentMode = .scaleAspectFill
    avatarImageView.isUserInteractionEnabled = false
    avatarView.addSubview(avatarImageView)

    topCoverView.isHidden = true

    addSubview(bottomCoverView)
    addSubview(avatarView)
    addSubview(topCoverView)

    maskLayer.fillColor = UIColor.white.cgColor
    layer.mask = maskLayer
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    maskLayer.frame = bounds
  }

  func setAvatarFrame(
    _ frame: CGRect,
    scale: CGFloat,
    verticalOffset: CGFloat
  ) {
    avatarView.bounds = CGRect(origin: .zero, size: frame.size)
    avatarView.center = CGPoint(x: frame.midX, y: frame.midY + verticalOffset)
    avatarView.transform = CGAffineTransform(scaleX: scale, y: scale)
    avatarView.layer.cornerRadius = min(frame.width, frame.height) / 2
    avatarImageView.frame = avatarView.bounds
  }

  func setRingColor(_ color: UIColor?) {
    avatarView.layer.borderColor = color?.cgColor
    avatarView.layer.borderWidth = color == nil ? 0 : 1 / max(1, window?.screen.scale ?? 3)
  }

  func updateDynamicIsland(
    progress: CGFloat,
    maskPath: CGPath,
    maskFrame: CGRect,
    coversVisible: Bool
  ) {
    if layer.mask !== maskLayer {
      layer.mask = maskLayer
    }

    var transform = CGAffineTransform(
      translationX: maskFrame.minX,
      y: maskFrame.minY
    )
    maskLayer.backgroundColor =
      coversVisible
      ? UIColor.clear.cgColor
      : UIColor.white.cgColor
    maskLayer.path = maskPath.copy(using: &transform)

    bottomCoverView.frame = maskFrame
    bottomCoverView.backgroundColor = UIColor(white: 0, alpha: progress)
    bottomCoverView.isHidden = !coversVisible

    topCoverView.frame = maskFrame
    topCoverView.isHidden = !coversVisible
    topCoverView.update(progress)
  }

  func disableDynamicIslandMask() {
    layer.mask = nil
    maskLayer.path = nil
    bottomCoverView.isHidden = true
    topCoverView.isHidden = true
    topCoverView.update(0)
  }
}

/// Telegram Settings-style avatar collapse.
///
/// React Native only provides the layout anchor and remote image URL. This
/// leaf native view owns the avatar, covers, blur, and shared mask inside one
/// compositor and applies the scroll geometry used by Telegram's
/// `PeerInfoHeaderNode`:
///
/// - wait until the scrolling avatar reaches Telegram's merge position
/// - scale: 1.0 -> 0.55
/// - vertical compensation: 0 -> 17 pt
/// - Dynamic Island mask progress: remaining scroll displacement / configured distance
///
/// The mask vertices and Bézier tangents are copied from Telegram's
/// `UserAvatarMask.tgs`. They are interpolated as Core Animation paths, so
/// no Lottie runtime is needed.
final class SettingsAvatarView: ExpoView {
  private struct MaskKeyframe {
    let time: CGFloat
    let vertices: [CGPoint]
  }

  private struct MaskShape {
    let vertices: [CGPoint]
    let inTangents: [CGPoint]
    let outTangents: [CGPoint]
  }

  private static let maskSize = CGSize(width: 171, height: 171)
  private static let animationDuration: CGFloat = 540
  private static let maskFrameY: CGFloat = 48
  private static let telegramAvatarDiameter: CGFloat = 100
  private static let avatarMinimumScale: CGFloat = 0.55
  private static let avatarMaximumOffset: CGFloat = 17
  private static let maskActivationThreshold: CGFloat = 0.03
  private static let imageCache = NSCache<NSURL, UIImage>()

  /// `UserAvatarMask.tgs` starts with a 100 pt circle centered at this Y.
  private static let initialMaskAvatarCenterY = maskFrameY + (254 - 20) * 171 / 512

  private static let rectangleFrames: [MaskKeyframe] = [
    frame(
      75,
      [
        -142.5, -2.5, -145, 0, -142.5, 2.5, -106.875, 2.5, -71.25, 2.5, -35.625, 2.5, 0, 2.5,
        35.625, 2.5, 71.25, 2.5, 106.875, 2.5, 142.5, 2.5, 145, 0, 142.5, -2.5,
      ]),
    frame(
      108,
      [
        -142.5, -2.501, -145, -0.001, -142.5, 2.499, -106.875, 2.499, -71.25, 2.499, -35.625, 7.499,
        0, 14.499, 35.625, 7.499, 71.25, 2.499, 106.875, 2.499, 142.5, 2.499, 145, -0.001, 142.5,
        -2.501,
      ]),
    frame(
      111,
      [
        -142.5, -2.484, -145, 0.016, -142.5, 2.516, -106.875, 2.516, -71.25, 2.516, -34.625, 9.516,
        0, 19.516, 34.625, 9.516, 71.25, 2.516, 106.875, 2.516, 142.5, 2.516, 145, 0.016, 142.5,
        -2.484,
      ]),
    frame(
      114,
      [
        -142.5, -2.484, -145, 0.016, -142.5, 2.516, -106.875, 2.516, -71.25, 2.516, -20.625, 17.516,
        0, 34.516, 20.625, 17.516, 71.25, 2.516, 106.875, 2.516, 142.5, 2.516, 145, 0.016, 142.5,
        -2.484,
      ]),
    frame(
      116,
      [
        -142.5, -2.484, -145, 0.016, -142.5, 2.516, -108.542, 2.516, -71.805, 2.682, -22.729,
        18.127, 0, 42.294, 22.729, 18.127, 71.806, 2.682, 108.541, 2.516, 142.5, 2.516, 145, 0.016,
        142.5, -2.484,
      ]),
    frame(
      150,
      [
        -142.499, -2.516, -144.999, -0.016, -142.499, 2.484, -136.874, 2.484, -81.249, 5.484,
        -58.499, 28.484, 0.001, 174.484, 58.501, 28.484, 81.251, 5.484, 136.871, 2.484, 142.501,
        2.484, 145.001, -0.016, 142.501, -2.516,
      ]),
    frame(
      152,
      [
        -142.499, -2.516, -144.999, -0.016, -142.499, 2.484, -136.874, 2.484, -81.249, 5.484,
        -58.499, 28.484, 0.001, 174.484, 58.501, 28.484, 81.251, 5.484, 136.871, 2.484, 142.501,
        2.484, 145.001, -0.016, 142.501, -2.516,
      ]),
    frame(
      153,
      [
        -142.499, -2.492, -144.999, 0.008, -142.499, 2.508, -136.874, 2.508, -60.499, 27.508,
        -118.999, 151.508, 0.001, 268.508, 119.001, 151.508, 60.501, 29.508, 136.871, 2.508,
        142.501, 2.508, 145.001, 0.008, 142.501, -2.492,
      ]),
    frame(
      180,
      [
        -142.499, -2.5, -144.999, 0, -142.499, 2.5, -136.874, 2.5, -72.499, 29.5, -112.999, 133.5,
        0.001, 247.5, 113.001, 133.5, 72.501, 29.5, 136.871, 2.5, 142.501, 2.5, 145.001, 0, 142.501,
        -2.5,
      ]),
    frame(
      240,
      [
        -142.499, -2.5, -144.999, 0, -142.499, 2.5, -136.874, 2.5, -86.499, 33.5, -99.999, 103.5,
        0.001, 201, 100.001, 103.5, 86.501, 33.5, 136.871, 2.5, 142.501, 2.5, 145.001, 0, 142.501,
        -2.5,
      ]),
    frame(
      330,
      [
        -142.5, -2.504, -145, -0.004, -142.5, 2.496, -129, 2.496, -91.5, 22.996, -72.5, 86.496, 0,
        130.996, 72.5, 86.496, 91.5, 22.996, 129, 2.496, 142.5, 2.496, 145, -0.004, 142.5, -2.504,
      ]),
    frame(
      420,
      [
        -142.5, -2.516, -145, -0.016, -142.5, 2.484, -129, 2.484, -82, 7.984, -59, 25.484, -0.5,
        60.484, 58, 25.484, 81, 7.984, 129, 2.484, 142.5, 2.484, 145, -0.016, 142.5, -2.516,
      ]),
    frame(
      498,
      [
        -142.5, -2.5, -145, 0, -142.5, 2.5, -106.875, 2.5, -71.25, 2.5, -35.625, 2.5, 0, 2.5,
        35.625, 2.5, 71.25, 2.5, 106.875, 2.5, 142.5, 2.5, 145, 0, 142.5, -2.5,
      ]),
  ]

  private static let ellipseFrames: [MaskKeyframe] = [
    frame(
      0,
      [
        102.07, 109.918, 150, 0, 102.07, -109.918, 0, -150, -102.07, -109.918, -150, 0, -102.07,
        109.918, 0, 150,
      ]),
    frame(
      30,
      [
        97.987, 89.396, 144, -16.125, 97.987, -121.646, -0.5, -161.625, -97.987, -121.646, -144,
        -16.125, -97.987, 89.396, 0, 127.875,
      ]),
    frame(
      60,
      [
        93.904, 67.171, 138, -33.794, 93.904, -134.759, -0.479, -173.012, -93.904, -134.759, -138,
        -33.794, -93.904, 67.171, 0, 103.988,
      ]),
    frame(
      90,
      [
        89.822, 45.869, 132, -50.357, 89.822, -146.583, -0.458, -185.041, -89.822, -146.583, -132,
        -50.357, -89.822, 45.869, 0, 80.959,
      ]),
    frame(
      102,
      [
        88.12, 37.05, 129.5, -56.815, 88.12, -152.679, -0.45, -192.992, -88.12, -152.679, -129.5,
        -56.815, -88.12, 37.05, 0, 72.008,
      ]),
    frame(
      111,
      [
        86.76, 29.908, 127.5, -64.234, 68, -170.898, -0.443, -206.398, -68, -170.898, -127.5,
        -64.234, -86.76, 29.908, 0, 64.602,
      ]),
    frame(
      120,
      [
        85.399, 23.959, 125.5, -68.529, 66.933, -174.588, -0.436, -236.219, -66.933, -174.588,
        -125.5, -68.529, -85.399, 23.959, 0, 57.781,
      ]),
    frame(
      150,
      [
        80.976, 1.773, 119, -86.311, 66, -189.016, -0.413, -236.016, -66, -189.016, -119, -86.311,
        -80.976, 1.773, 0, 33.984,
      ]),
    frame(
      153,
      [
        80.976, -0.091, 119, -86.849, 66, -190.173, -0.413, -236.999, -66, -190.173, -119, -86.849,
        -80.976, -0.091, 0, 32.001,
      ]),
  ]

  private static let rectangleInTangents: [[CGPoint]] = [
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, 0, -14.45, -4, -14.45, 0, -14.45, 4, -14.45, 0,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, 0, -14.45, -4, -14.45, 0, -14.45, 4, -14.45, 0,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, 0, -13.125, -8.5, -5.5, 0, -13.125, 8.5,
      -14.45, 0, -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, -0.222, -12.396, -8.806, -34.056, 0, -12.396,
      8.861, -14.45, 0.25, -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, -4, 0, -14, -120, 0, 0, 15, -14.45, 4.5,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, -4, 0, -14, -120, 0, 0, 15, -14.45, 4.5,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, 0, -30, 0, -77, -74, 0, 0, 54, 0, 28, -14.45, 0, 0, 0,
      0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, 0, -27, 0, -54, -74, 0, 0, 54, 0, 27, -14.45, 0, 0, 0,
      0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, 0, -27, 0, -44, -54, 0, 0, 54, 0, 27, -14.45, 0, 0, 0,
      0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -10, 0, -6.5, -12, -11.19, -23.5, -37, 0, -10, 21, -6.5, 12,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -10, 0, -11, -5.5, -8.42, -9.83, -34, 0, -9, 10.5, -11, 5.5,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
    points([
      0, 0, 0, -1.381, -1.381, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0, -14.45, 0,
      -14.45, 0, 0, 0, 0, 1.381, 1.381, 0,
    ]),
  ]

  private static let rectangleOutTangents: [[CGPoint]] = [
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45,
      0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0, 14.45, 4, 14.45, 0, 14.45, -4, 14.45, 0, 14.45,
      0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0, 14.45, 4, 14.45, 0, 14.45, -4, 14.45, 0, 14.45,
      0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0, 13.125, 8.5, 5.5, 0, 13.125, -8.5, 14.45, 0,
      14.45, 0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0.222, 12.396, 8.861, 34.056, 0, 12.396, -8.806,
      14.45, -0.222, 14.45, 0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 4, 0, 15, 120, 0, 0, -14, 14.45, -4, 14.45, 0,
      1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 4, 0, 15, 120, 0, 0, -14, 14.45, -4, 14.45, 0,
      1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 0, 30, 0, 54, 74, 0, 0, -77, 0, -32, 14.45, 0, 1.381, 0,
      0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 0, 27, 0, 54, 74, 0, 0, -54, 0, -27, 14.45, 0, 1.381, 0,
      0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 0, 27, 0, 54, 54, 0, 0, -44, 0, -27, 14.45, 0, 1.381, 0,
      0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 6.5, 12, 10, 21, 37, 0, 11.19, -23.5, 6.5, -12, 14.45, 0,
      1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 11, 5.5, 9, 10.5, 34, 0, 8.422, -9.826, 11, -5.5, 14.45,
      0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
    points([
      -1.381, 0, 0, 1.381, 0, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45, 0, 14.45,
      0, 1.381, 0, 0, -1.381, 0, 0,
    ]),
  ]

  private static let ellipseInTangents: [[CGPoint]] = [
    points([
      -26.772, 24.872, 0, 43.418, 29.483, 27.391, 39.425, 0, 26.772, -24.872, 0, -43.418, -29.483,
      -27.391, -39.425, 0,
    ]),
    points([
      -25.701, 23.877, 0, 41.681, 28.304, 26.295, 37.848, 0, 25.701, -23.877, 0, -41.681, -28.304,
      -26.295, -37.848, 0,
    ]),
    points([
      -24.63, 22.846, 0, 39.881, 27.125, 25.16, 36.271, 0, 24.63, -22.846, 0, -39.881, -27.125,
      -25.16, -36.271, 0,
    ]),
    points([
      -23.56, 21.774, 0, 38.01, 25.945, 23.979, 34.694, 0, 23.56, -21.774, 0, -38.01, -25.945,
      -23.979, -34.694, 0,
    ]),
    points([
      -23.113, 21.692, 0, 37.867, 25.454, 23.889, 26.037, 0, 23.113, -21.692, 0, -37.867, -25.454,
      -23.889, -34.037, 0,
    ]),
    points([
      -22.756, 21.529, 0, 37.581, 29.932, 17.152, 9.943, 0, 44.5, -25.5, 0, -48.585, -25.061,
      -23.709, -33.511, 0,
    ]),
    points([
      -22.399, 21.608, 0, 37.719, 28.907, 18.133, 9.787, 0, 41.802, -25.594, 0, -48.764, -24.668,
      -23.796, -32.986, 0,
    ]),
    points([
      -21.239, 20.579, 0, 35.923, 21.28, 24.42, 79.28, 0, 18.467, -21.196, 0, -56.442, -23.39,
      -22.663, -31.277, 0,
    ]),
    points([
      -21.239, 20.503, 0, 35.79, 21.28, 24.33, 79.28, 0, 18.467, -21.118, 0, -56.233, -23.39,
      -22.579, -31.277, 0,
    ]),
  ]

  private static let ellipseOutTangents: [[CGPoint]] = [
    points([
      29.483, -27.391, 0, -43.418, -26.772, -24.872, -39.425, 0, -29.483, 27.391, 0, 43.418, 26.772,
      24.872, 39.425, 0,
    ]),
    points([
      28.304, -26.295, 0, -41.681, -25.701, -23.877, -37.848, 0, -28.304, 26.295, 0, 41.681, 25.701,
      23.877, 37.848, 0,
    ]),
    points([
      27.125, -25.16, 0, -39.881, -24.63, -22.846, -36.271, 0, -27.125, 25.16, 0, 39.881, 24.63,
      22.846, 36.271, 0,
    ]),
    points([
      25.945, -23.979, 0, -38.01, -23.56, -21.774, -34.694, 0, -25.945, 23.979, 0, 38.01, 23.56,
      21.774, 34.694, 0,
    ]),
    points([
      25.454, -23.889, 0, -37.867, -23.113, -21.692, -26.037, 0, -25.454, 23.889, 0, 37.867, 23.113,
      21.692, 34.037, 0,
    ]),
    points([
      25.061, -23.709, 0, -48.581, -44.5, -25.5, -9.943, 0, -29.93, 17.15, 0, 37.581, 22.756,
      21.529, 33.511, 0,
    ]),
    points([
      24.668, -23.796, 0, -48.76, -40.802, -25.594, -9.787, 0, -29.1, 17.817, 0, 37.719, 22.399,
      21.608, 32.986, 0,
    ]),
    points([
      23.39, -22.663, 0, -56.444, -18.47, -21.2, -79.28, 0, -21.278, 24.423, 0, 35.923, 21.239,
      20.579, 31.277, 0,
    ]),
    points([
      23.39, -22.579, 0, -56.235, -18.47, -21.121, -79.28, 0, -21.278, 24.333, 0, 35.79, 21.239,
      20.503, 31.277, 0,
    ]),
  ]

  private let compositorView = SettingsAvatarCompositorView()
  private weak var observedScrollView: UIScrollView?
  private var contentOffsetObservation: NSKeyValueObservation?
  private var adjustedInsetObservation: NSKeyValueObservation?
  private var imageTask: URLSessionDataTask?
  private var imageUri: String?
  private var imageLoadGeneration = 0
  private var ringColor: UIColor?
  private var collapseDistance: CGFloat = 120

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    clipsToBounds = false
    isOpaque = false
    isUserInteractionEnabled = false
  }

  deinit {
    imageTask?.cancel()
    detachFromScrollView()
    compositorView.removeFromSuperview()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    scheduleScrollViewAttachment()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      detachFromScrollView()
      compositorView.removeFromSuperview()
    } else {
      scheduleScrollViewAttachment()
      updateForCurrentScrollPosition()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateForCurrentScrollPosition()
  }

  func setCollapseDistance(_ value: Double) {
    collapseDistance = max(1, CGFloat(value))
    updateForCurrentScrollPosition()
  }

  func setImageUri(_ value: String) {
    guard imageUri != value else { return }

    imageUri = value
    imageLoadGeneration += 1
    let generation = imageLoadGeneration
    imageTask?.cancel()
    imageTask = nil
    compositorView.avatarImageView.image = nil

    guard let url = URL(string: value) else { return }
    if let cached = Self.imageCache.object(forKey: url as NSURL) {
      compositorView.avatarImageView.image = cached
      return
    }

    if url.isFileURL {
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard
          let data = try? Data(contentsOf: url),
          let image = UIImage(data: data)
        else { return }
        Self.imageCache.setObject(image, forKey: url as NSURL)
        DispatchQueue.main.async {
          self?.applyLoadedImage(image, generation: generation)
        }
      }
      return
    }

    var request = URLRequest(
      url: url,
      cachePolicy: .returnCacheDataElseLoad,
      timeoutInterval: 30
    )
    request.setValue("image/*", forHTTPHeaderField: "Accept")
    imageTask = URLSession.shared.dataTask(with: request) { [weak self] data, response, _ in
      if let response = response as? HTTPURLResponse,
        !(200..<300).contains(response.statusCode)
      {
        return
      }
      guard let data, let image = UIImage(data: data) else { return }
      Self.imageCache.setObject(image, forKey: url as NSURL)
      DispatchQueue.main.async {
        self?.applyLoadedImage(image, generation: generation)
      }
    }
    imageTask?.resume()
  }

  func setRingColor(_ color: UIColor?) {
    ringColor = color
    compositorView.setRingColor(color)
  }

  private func applyLoadedImage(_ image: UIImage, generation: Int) {
    guard imageLoadGeneration == generation else { return }

    compositorView.avatarImageView.alpha = 0
    compositorView.avatarImageView.image = image
    UIView.animate(
      withDuration: 0.12,
      delay: 0,
      options: [.beginFromCurrentState, .allowUserInteraction]
    ) {
      self.compositorView.avatarImageView.alpha = 1
    }
  }

  private func scheduleScrollViewAttachment() {
    DispatchQueue.main.async { [weak self] in
      self?.attachToAncestorScrollView()
    }
  }

  private func attachToAncestorScrollView() {
    guard window != nil else { return }
    var candidate = superview
    var scrollView: UIScrollView?
    while let view = candidate {
      if let match = view as? UIScrollView {
        scrollView = match
        break
      }
      candidate = view.superview
    }
    guard let scrollView else { return }
    guard observedScrollView !== scrollView else {
      updateForCurrentScrollPosition()
      return
    }

    detachFromScrollView()
    observedScrollView = scrollView
    contentOffsetObservation = scrollView.observe(
      \.contentOffset,
      options: [.initial, .new]
    ) { [weak self] _, _ in
      self?.updateForCurrentScrollPosition()
    }
    adjustedInsetObservation = scrollView.observe(
      \.adjustedContentInset,
      options: [.new]
    ) { [weak self] _, _ in
      self?.updateForCurrentScrollPosition()
    }
  }

  private func detachFromScrollView() {
    contentOffsetObservation?.invalidate()
    adjustedInsetObservation?.invalidate()
    contentOffsetObservation = nil
    adjustedInsetObservation = nil
    observedScrollView = nil
  }

  private func updateForCurrentScrollPosition() {
    guard let window, bounds.width > 0, bounds.height > 0 else { return }
    ensureCompositor(in: window)

    let displacement: CGFloat
    if let scrollView = observedScrollView {
      displacement = max(
        0,
        scrollView.contentOffset.y + scrollView.adjustedContentInset.top
      )
    } else {
      displacement = 0
    }
    let avatarFrame = convert(bounds, to: window)
    let collapseFraction: CGFloat
    if supportsDynamicIsland(in: window) {
      let restingCenterY = avatarFrame.midY + displacement
      let mergeStartDisplacement = max(
        0,
        restingCenterY - Self.initialMaskAvatarCenterY
      )
      collapseFraction = min(
        1,
        max(0, (displacement - mergeStartDisplacement) / collapseDistance)
      )
    } else {
      collapseFraction = min(1, displacement / collapseDistance)
    }
    let scale = 1 - (1 - Self.avatarMinimumScale) * collapseFraction
    let verticalOffset = Self.avatarMaximumOffset * collapseFraction

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    compositorView.setAvatarFrame(
      avatarFrame,
      scale: scale,
      verticalOffset: verticalOffset
    )
    updateDynamicIslandMask(progress: collapseFraction, in: window)
    CATransaction.commit()
  }

  private func ensureCompositor(in window: UIWindow) {
    if compositorView.superview !== window {
      compositorView.removeFromSuperview()
      compositorView.frame = window.bounds
      window.addSubview(compositorView)
      compositorView.setRingColor(ringColor)
    } else if compositorView.frame != window.bounds {
      compositorView.frame = window.bounds
    }
  }

  private func supportsDynamicIsland(in window: UIWindow) -> Bool {
    window.bounds.width < window.bounds.height && window.safeAreaInsets.top >= 51
  }

  private func updateDynamicIslandMask(progress: CGFloat, in window: UIWindow) {
    guard supportsDynamicIsland(in: window) else {
      compositorView.disableDynamicIslandMask()
      return
    }

    let animationTime = progress * Self.animationDuration
    let contentPath = CGMutablePath()
    if animationTime < 153,
      let shape = Self.interpolatedShape(
        at: animationTime,
        frames: Self.ellipseFrames,
        inTangents: Self.ellipseInTangents,
        outTangents: Self.ellipseOutTangents
      )
    {
      let avatarDiameter = min(bounds.width, bounds.height)
      let avatarScale = avatarDiameter / Self.telegramAvatarDiameter
      contentPath.addPath(
        Self.closedPath(
          shape: shape,
          layerY: 254,
          shapeScale: avatarScale
        )
      )
    }
    if let shape = Self.interpolatedShape(
      at: animationTime,
      frames: Self.rectangleFrames,
      inTangents: Self.rectangleInTangents,
      outTangents: Self.rectangleOutTangents
    ) {
      let rectanglePath = Self.closedPath(shape: shape, layerY: 17.5)
      contentPath.addPath(rectanglePath)
    }

    let fixedMaskFrame = CGRect(
      x: window.bounds.midX - Self.maskSize.width / 2,
      y: Self.maskFrameY,
      width: Self.maskSize.width,
      height: Self.maskSize.height
    )
    compositorView.updateDynamicIsland(
      progress: progress,
      maskPath: contentPath,
      maskFrame: fixedMaskFrame,
      coversVisible: progress > Self.maskActivationThreshold
    )
  }

  private static func frame(_ time: CGFloat, _ coordinates: [CGFloat]) -> MaskKeyframe {
    MaskKeyframe(time: time, vertices: points(coordinates))
  }

  private static func points(_ coordinates: [CGFloat]) -> [CGPoint] {
    var vertices: [CGPoint] = []
    vertices.reserveCapacity(coordinates.count / 2)
    for index in stride(from: 0, to: coordinates.count, by: 2) {
      vertices.append(
        CGPoint(x: coordinates[index], y: coordinates[index + 1])
      )
    }
    return vertices
  }

  private static func interpolatedShape(
    at time: CGFloat,
    frames: [MaskKeyframe],
    inTangents: [[CGPoint]],
    outTangents: [[CGPoint]]
  ) -> MaskShape? {
    guard
      frames.count == inTangents.count,
      frames.count == outTangents.count,
      let first = frames.first,
      let last = frames.last
    else { return nil }

    if time <= first.time {
      return MaskShape(
        vertices: first.vertices,
        inTangents: inTangents[0],
        outTangents: outTangents[0]
      )
    }
    if time >= last.time {
      return MaskShape(
        vertices: last.vertices,
        inTangents: inTangents[frames.count - 1],
        outTangents: outTangents[frames.count - 1]
      )
    }

    for index in 0..<(frames.count - 1) {
      let start = frames[index]
      let end = frames[index + 1]
      guard time >= start.time, time <= end.time else { continue }
      let fraction = (time - start.time) / max(1, end.time - start.time)
      return MaskShape(
        vertices: interpolatedPoints(
          from: start.vertices,
          to: end.vertices,
          fraction: fraction
        ),
        inTangents: interpolatedPoints(
          from: inTangents[index],
          to: inTangents[index + 1],
          fraction: fraction
        ),
        outTangents: interpolatedPoints(
          from: outTangents[index],
          to: outTangents[index + 1],
          fraction: fraction
        )
      )
    }
    return nil
  }

  private static func interpolatedPoints(
    from start: [CGPoint],
    to end: [CGPoint],
    fraction: CGFloat
  ) -> [CGPoint] {
    zip(start, end).map { start, end in
      CGPoint(
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction
      )
    }
  }

  private static func closedPath(
    shape: MaskShape,
    layerY: CGFloat,
    shapeScale: CGFloat = 1
  ) -> CGPath {
    let scale = maskSize.width / 512
    let minX = shape.vertices.map(\.x).min() ?? 0
    let maxX = shape.vertices.map(\.x).max() ?? 0
    let minY = shape.vertices.map(\.y).min() ?? 0
    let maxY = shape.vertices.map(\.y).max() ?? 0
    let shapeCenter = CGPoint(x: (minX + maxX) / 2, y: (minY + maxY) / 2)
    let vertices = shape.vertices.map { rawVertex in
      let vertex = CGPoint(
        x: shapeCenter.x + (rawVertex.x - shapeCenter.x) * shapeScale,
        y: shapeCenter.y + (rawVertex.y - shapeCenter.y) * shapeScale
      )
      return CGPoint(
        x: (256 + vertex.x) * scale,
        y: (-20 + layerY + vertex.y) * scale
      )
    }
    let inTangents = shape.inTangents.map { tangent in
      CGPoint(
        x: tangent.x * scale * shapeScale,
        y: tangent.y * scale * shapeScale
      )
    }
    let outTangents = shape.outTangents.map { tangent in
      CGPoint(
        x: tangent.x * scale * shapeScale,
        y: tangent.y * scale * shapeScale
      )
    }
    guard
      vertices.count > 2,
      vertices.count == inTangents.count,
      vertices.count == outTangents.count
    else { return CGMutablePath() }

    let path = CGMutablePath()
    path.move(to: vertices[0])
    for index in 0..<vertices.count {
      let nextIndex = (index + 1) % vertices.count
      let current = vertices[index]
      let next = vertices[nextIndex]
      let firstControl = CGPoint(
        x: current.x + outTangents[index].x,
        y: current.y + outTangents[index].y
      )
      let secondControl = CGPoint(
        x: next.x + inTangents[nextIndex].x,
        y: next.y + inTangents[nextIndex].y
      )
      path.addCurve(to: next, control1: firstControl, control2: secondControl)
    }
    path.closeSubpath()
    return path
  }
}
