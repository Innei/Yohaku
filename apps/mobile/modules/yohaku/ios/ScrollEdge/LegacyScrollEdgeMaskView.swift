import ExpoModulesCore
import UIKit

/// A pre-iOS 26 approximation of `UIScrollEdgeEffect.Style.soft`.
///
/// The view masks only its scrolling child. There is no material or colored
/// backdrop: content itself progressively disappears at the active edge while
/// sibling chrome remains untouched.
final class LegacyScrollEdgeMaskView: ExpoView {
  private let gradientMask = CAGradientLayer()
  private var bottomEdgeHeight: CGFloat = 0
  private var bottomProgress: CGFloat = 1
  private var topEdgeHeight: CGFloat = 0
  private var topProgress: CGFloat = 0

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    accessibilityElementsHidden = false
    backgroundColor = .clear
    isOpaque = false
    gradientMask.startPoint = CGPoint(x: 0.5, y: 0)
    gradientMask.endPoint = CGPoint(x: 0.5, y: 1)
    layer.mask = gradientMask
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    // React Native may rebuild a view's clipping mask while applying styles.
    // Reassert ownership here so the scroll-edge mask remains attached.
    if layer.mask !== gradientMask {
      layer.mask = gradientMask
    }
    updateGradientWithoutAnimation()
  }

  func setBottomEdgeHeight(_ height: Double) {
    bottomEdgeHeight = max(0, CGFloat(height))
    updateGradientWithoutAnimation()
  }

  func setBottomProgress(_ progress: Double) {
    bottomProgress = min(1, max(0, CGFloat(progress)))
    updateGradientWithoutAnimation()
  }

  func setTopEdgeHeight(_ height: Double) {
    topEdgeHeight = max(0, CGFloat(height))
    updateGradientWithoutAnimation()
  }

  func setTopProgress(_ progress: Double) {
    topProgress = min(1, max(0, CGFloat(progress)))
    updateGradientWithoutAnimation()
  }

  private func updateGradientWithoutAnimation() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    gradientMask.frame = bounds
    updateGradient()
    CATransaction.commit()
  }

  private func updateGradient() {
    guard bounds.height > 0 else { return }

    let availableHeight = bounds.height
    let topHeight = min(topEdgeHeight, availableHeight * 0.45)
    let bottomHeight = min(
      bottomEdgeHeight,
      max(0, availableHeight * 0.9 - topHeight)
    )
    let topEnd = topHeight / availableHeight
    let bottomStart = 1 - bottomHeight / availableHeight

    let topShape: [(CGFloat, CGFloat)] = [
      (0, 0),
      (0.5, 0),
      (0.64, 0.04),
      (0.76, 0.2),
      (0.88, 0.62),
      (0.95, 0.86),
      (1, 1),
    ]
    let bottomShape: [(CGFloat, CGFloat)] = [
      (0, 1),
      (0.24, 0.85),
      (0.46, 0.55),
      (0.68, 0.2),
      (0.86, 0.04),
      (1, 0),
    ]

    var locations: [NSNumber] = []
    var colors: [CGColor] = []

    if topHeight > 0 {
      for (position, alpha) in topShape {
        locations.append(NSNumber(value: Double(position * topEnd)))
        colors.append(maskColor(alpha: mixedAlpha(alpha, progress: topProgress)))
      }
    } else {
      locations.append(0)
      colors.append(maskColor(alpha: 1))
    }

    if bottomStart > topEnd {
      locations.append(NSNumber(value: Double(bottomStart)))
      colors.append(maskColor(alpha: 1))
    }

    if bottomHeight > 0 {
      for (position, alpha) in bottomShape {
        let location = bottomStart + position * (1 - bottomStart)
        locations.append(NSNumber(value: Double(location)))
        colors.append(maskColor(alpha: mixedAlpha(alpha, progress: bottomProgress)))
      }
    } else {
      locations.append(1)
      colors.append(maskColor(alpha: 1))
    }

    gradientMask.locations = locations
    gradientMask.colors = colors
  }

  private func mixedAlpha(_ edgeAlpha: CGFloat, progress: CGFloat) -> CGFloat {
    1 - progress * (1 - edgeAlpha)
  }

  private func maskColor(alpha: CGFloat) -> CGColor {
    UIColor.black.withAlphaComponent(alpha).cgColor
  }
}
