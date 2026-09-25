import ExpoModulesCore
import SwiftMath
import UIKit

final class YohakuMathView: ExpoView {
  let onContentSize = EventDispatcher()
  let onMathError = EventDispatcher()

  var latex = ""
  var fontSize: CGFloat = 20
  var color: UIColor = .label

  private let label = MTMathUILabel()
  private var reported: CGSize = .zero
  private var failed = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    label.labelMode = .display
    label.textAlignment = .center
    addSubview(label)
  }

  func update() {
    label.fontSize = fontSize
    label.textColor = color
    label.latex = latex
    if label.error != nil {
      if !failed {
        failed = true
        onMathError([:])
      }
      return
    }
    failed = false
    let size = label.intrinsicContentSize
    if size != reported {
      reported = size
      onContentSize(["width": size.width, "height": size.height])
    }
    label.setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    label.frame = bounds
  }
}
