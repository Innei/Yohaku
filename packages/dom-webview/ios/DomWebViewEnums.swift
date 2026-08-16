// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

internal enum ContentInsetAdjustmentBehavior: String, Enumerable {
  case automatic
  case scrollableAxes
  case never
  case always

  func toContentInsetAdjustmentBehavior() -> UIScrollView.ContentInsetAdjustmentBehavior {
    switch self {
    case .automatic:
      return .automatic
    case .scrollableAxes:
      return .scrollableAxes
    case .never:
      return .never
    case .always:
      return .always
    }
  }
}

internal enum ScrollEdgeEffectKind: String, Enumerable {
  case automatic
  case hard
  case hidden
  case soft
}

extension UIColor {
  convenience init?(yohakuHex hex: String) {
    var value = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if value.hasPrefix("#") {
      value.removeFirst()
    }
    guard value.count == 6, let rgb = UInt32(value, radix: 16) else { return nil }
    self.init(
      red: CGFloat((rgb >> 16) & 0xFF) / 255,
      green: CGFloat((rgb >> 8) & 0xFF) / 255,
      blue: CGFloat(rgb & 0xFF) / 255,
      alpha: 1
    )
  }
}
