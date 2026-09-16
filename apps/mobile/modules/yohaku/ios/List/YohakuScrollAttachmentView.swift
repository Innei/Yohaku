import ExpoModulesCore
import UIKit

protocol YohakuNativeScrollConsumer: AnyObject {
  func nativeScrollDidChange(_ scroll: UIScrollView)
  func nativeScrollDidDetach(_ scroll: UIScrollView)
}

/// Mounted inside the real scroll content, so ancestors are available together
/// when this view enters the window. No search of asynchronous descendants.
final class YohakuScrollAttachmentView: ExpoView {
  private let binding = YohakuScrollDelegateBinding()
  private weak var consumer: (UIView & YohakuNativeScrollConsumer)?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    accessibilityElementsHidden = true
    binding.onScroll = { [weak self] scroll in
      self?.consumer?.nativeScrollDidChange(scroll)
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    updateBinding()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    updateBinding()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateBinding()
  }

  private func updateBinding() {
    guard window != nil else {
      detach()
      return
    }
    var ancestor = superview
    var nextConsumer: (UIView & YohakuNativeScrollConsumer)?
    while let view = ancestor {
      if let host = view as? (UIView & YohakuNativeScrollConsumer) {
        nextConsumer = host
        break
      }
      ancestor = view.superview
    }
    guard let nextConsumer else {
      detach()
      return
    }
    if consumer !== nextConsumer { detach() }
    consumer = nextConsumer
    if let scroll = binding.bind(toDescendant: self) {
      nextConsumer.nativeScrollDidChange(scroll)
    }
  }

  private func detach() {
    if let scroll = binding.scrollView { consumer?.nativeScrollDidDetach(scroll) }
    binding.invalidate()
    consumer = nil
  }
}
