import CoreText
import UIKit

enum FontScale {
  static let min: CGFloat = 14 / 17
  static let max: CGFloat = 23 / 17

  static var factor: CGFloat {
    let raw = UIFont.preferredFont(forTextStyle: .body).pointSize / 17
    return Swift.min(max, Swift.max(min, raw))
  }

  static func size(_ pt: CGFloat) -> CGFloat {
    pt * factor
  }
}

enum SystemFontDomain {
  static func ensureInstalled(postScriptName: String) async -> Bool {
    if isInstalled(postScriptName: postScriptName) {
      return true
    }

    let descriptor = CTFontDescriptorCreateWithAttributes([
      kCTFontNameAttribute: postScriptName
    ] as CFDictionary)

    return await withCheckedContinuation { continuation in
      let completion = FontDownloadCompletion(continuation)
      let started = CTFontDescriptorMatchFontDescriptorsWithProgressHandler(
        [descriptor] as CFArray,
        nil
      ) { state, _ in
        switch state {
        case .didFinish:
          completion.finish(isInstalled(postScriptName: postScriptName))
          return false
        case .didFailWithError:
          completion.finish(false)
          return false
        default:
          return true
        }
      }

      if !started {
        completion.finish(false)
      }
    }
  }

  private static func isInstalled(postScriptName: String) -> Bool {
    UIFont(name: postScriptName, size: 12) != nil
  }
}

private final class FontDownloadCompletion: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<Bool, Never>?

  init(_ continuation: CheckedContinuation<Bool, Never>) {
    self.continuation = continuation
  }

  func finish(_ installed: Bool) {
    lock.lock()
    let pending = continuation
    continuation = nil
    lock.unlock()
    pending?.resume(returning: installed)
  }
}
