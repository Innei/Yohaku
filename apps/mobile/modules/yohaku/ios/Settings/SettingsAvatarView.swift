import ExpoModulesCore
import UIKit

/// Telegram Settings-style avatar collapse.
///
/// The React child remains the only avatar renderer. This native view is a
/// fixed layout slot that observes its ancestor scroll view and applies the
/// same scroll geometry used by Telegram's `PeerInfoHeaderNode`:
///
/// - scale: 1.0 -> 0.55
/// - vertical compensation: 0 -> 17 pt
/// - Dynamic Island mask progress: scroll displacement / 120 pt
///
/// The mask vertices are derived from Telegram's `UserAvatarMask.tgs`. They
/// are interpolated as Core Animation paths, so no Lottie runtime is needed.
final class SettingsAvatarView: ExpoView {
  private struct MaskKeyframe {
    let time: CGFloat
    let vertices: [CGPoint]
  }

  private static let maskSize = CGSize(width: 171, height: 171)
  private static let animationDuration: CGFloat = 540
  private static let avatarMinimumScale: CGFloat = 0.55
  private static let avatarMaximumOffset: CGFloat = 17
  private static let maskActivationThreshold: CGFloat = 0.03

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

  private let maskLayer = CAShapeLayer()
  private weak var observedScrollView: UIScrollView?
  private var contentOffsetObservation: NSKeyValueObservation?
  private var adjustedInsetObservation: NSKeyValueObservation?
  private var collapseDistance: CGFloat = 120

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    clipsToBounds = false
    isOpaque = false
    maskLayer.fillColor = UIColor.black.cgColor
  }

  deinit {
    detachFromScrollView()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    scheduleScrollViewAttachment()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      detachFromScrollView()
      layer.mask = nil
    } else {
      scheduleScrollViewAttachment()
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
    guard let scrollView = observedScrollView else { return }
    let displacement = max(
      0,
      scrollView.contentOffset.y + scrollView.adjustedContentInset.top
    )
    let collapseFraction = min(1, displacement / collapseDistance)
    let scale = 1 - (1 - Self.avatarMinimumScale) * collapseFraction
    let verticalOffset = Self.avatarMaximumOffset * collapseFraction

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    let contentTransform = CGAffineTransform(
      translationX: 0,
      y: verticalOffset
    ).scaledBy(x: scale, y: scale)
    for contentView in subviews {
      contentView.transform = contentTransform
    }
    updateDynamicIslandMask(displacement: displacement)
    CATransaction.commit()
  }

  private func updateDynamicIslandMask(displacement: CGFloat) {
    guard
      let window,
      window.bounds.width < window.bounds.height,
      window.safeAreaInsets.top >= 51
    else {
      layer.mask = nil
      return
    }

    let progress = min(1, max(0, displacement / 120))
    guard progress > Self.maskActivationThreshold else {
      layer.mask = nil
      return
    }

    let animationTime = progress * Self.animationDuration
    let path = CGMutablePath()
    if animationTime < 153,
      let vertices = Self.interpolatedVertices(
        at: animationTime,
        frames: Self.ellipseFrames
      )
    {
      path.addPath(Self.closedSmoothPath(vertices: vertices, layerY: 254))
    }
    if let vertices = Self.interpolatedVertices(
      at: animationTime,
      frames: Self.rectangleFrames
    ) {
      path.addPath(Self.closedSmoothPath(vertices: vertices, layerY: 17.5))
    }

    let fixedMaskFrameInWindow = CGRect(
      x: window.bounds.midX - Self.maskSize.width / 2,
      y: 48,
      width: Self.maskSize.width,
      height: Self.maskSize.height
    )
    let fixedMaskFrame = convert(fixedMaskFrameInWindow, from: window)
    maskLayer.bounds = CGRect(origin: .zero, size: Self.maskSize)
    maskLayer.position = CGPoint(
      x: fixedMaskFrame.midX,
      y: fixedMaskFrame.midY
    )
    maskLayer.path = path
    if layer.mask !== maskLayer {
      layer.mask = maskLayer
    }
  }

  private static func frame(_ time: CGFloat, _ coordinates: [CGFloat]) -> MaskKeyframe {
    var vertices: [CGPoint] = []
    vertices.reserveCapacity(coordinates.count / 2)
    for index in stride(from: 0, to: coordinates.count, by: 2) {
      vertices.append(
        CGPoint(x: coordinates[index], y: coordinates[index + 1])
      )
    }
    return MaskKeyframe(time: time, vertices: vertices)
  }

  private static func interpolatedVertices(
    at time: CGFloat,
    frames: [MaskKeyframe]
  ) -> [CGPoint]? {
    guard let first = frames.first, let last = frames.last else { return nil }
    if time <= first.time { return first.vertices }
    if time >= last.time { return last.vertices }

    for index in 0..<(frames.count - 1) {
      let start = frames[index]
      let end = frames[index + 1]
      guard time >= start.time, time <= end.time else { continue }
      let fraction = (time - start.time) / max(1, end.time - start.time)
      return zip(start.vertices, end.vertices).map { start, end in
        CGPoint(
          x: start.x + (end.x - start.x) * fraction,
          y: start.y + (end.y - start.y) * fraction
        )
      }
    }
    return last.vertices
  }

  private static func closedSmoothPath(
    vertices: [CGPoint],
    layerY: CGFloat
  ) -> CGPath {
    let scale = maskSize.width / 512
    let points = vertices.map { vertex in
      CGPoint(
        x: (256 + vertex.x) * scale,
        y: (-20 + layerY + vertex.y) * scale
      )
    }
    guard points.count > 2 else { return CGMutablePath() }

    let path = CGMutablePath()
    path.move(to: points[0])
    for index in 0..<points.count {
      let previous = points[(index - 1 + points.count) % points.count]
      let current = points[index]
      let next = points[(index + 1) % points.count]
      let following = points[(index + 2) % points.count]
      let firstControl = CGPoint(
        x: current.x + (next.x - previous.x) / 6,
        y: current.y + (next.y - previous.y) / 6
      )
      let secondControl = CGPoint(
        x: next.x - (following.x - current.x) / 6,
        y: next.y - (following.y - current.y) / 6
      )
      path.addCurve(to: next, control1: firstControl, control2: secondControl)
    }
    path.closeSubpath()
    return path
  }
}
