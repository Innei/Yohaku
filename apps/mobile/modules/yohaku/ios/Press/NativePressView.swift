import ExpoModulesCore
import UIKit


final class NativePressView: ExpoView {
  let onNativePress = EventDispatcher()

  private var confirmedFeedbackWorkItem: DispatchWorkItem?
  private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
  private var hapticEnabled = true
  private var pressScale: CGFloat = 0.985
  private var pressTranslateY: CGFloat = 0
  private var pressed = false
  private weak var requiredScrollView: UIScrollView?

  private lazy var pressGesture = NativePressGestureRecognizer(
    target: self,
    action: #selector(handlePress(_:))
  )

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    pressGesture.onPressedChange = { [weak self] pressed in
      self?.setPressed(pressed)
    }
    pressGesture.shouldReceiveTouch = { [weak self] in
      guard let scroll = self?.requiredScrollView else { return true }
      return !(scroll.isDragging || scroll.isDecelerating)
    }
    addGestureRecognizer(pressGesture)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      cancelConfirmedFeedback()
      setPressed(false, animated: false)
    } else {
      requireAncestorScrollPanToFail()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    requireAncestorScrollPanToFail()
  }

  func setDisabled(_ disabled: Bool) {
    pressGesture.isEnabled = !disabled
    if disabled {
      cancelConfirmedFeedback()
      setPressed(false, animated: false)
    }
  }

  func setHapticEnabled(_ enabled: Bool) {
    hapticEnabled = enabled
  }

  func setPressScale(_ scale: Double) {
    pressScale = CGFloat(scale)
    if pressed {
      applyPressedTransform(animated: false)
    }
  }

  func setPressTranslateY(_ translateY: Double) {
    pressTranslateY = CGFloat(translateY)
    if pressed {
      applyPressedTransform(animated: false)
    }
  }

  @objc
  private func handlePress(_ recognizer: NativePressGestureRecognizer) {
    guard recognizer.state == .recognized, pressGesture.isEnabled else { return }

    if !pressed {
      showConfirmedFeedback()
    }
    if hapticEnabled {
      feedbackGenerator.impactOccurred()
    }
    onNativePress()
  }

  private func setPressed(_ next: Bool, animated: Bool = true) {
    guard pressed != next else { return }
    pressed = next

    if next {
      feedbackGenerator.prepare()
      applyPressedTransform(animated: animated)
    } else {
      applyIdentityTransform(animated: animated)
    }
  }

  private func applyPressedTransform(animated: Bool) {
    guard !UIAccessibility.isReduceMotionEnabled else {
      transform = .identity
      return
    }

    let updates = {
      self.transform = CGAffineTransform(
        translationX: 0,
        y: self.pressTranslateY
      ).scaledBy(x: self.pressScale, y: self.pressScale)
    }

    if animated {
      UIView.animate(
        withDuration: 0.09,
        delay: 0,
        options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut],
        animations: updates
      )
    } else {
      updates()
    }
  }

  private func applyIdentityTransform(animated: Bool) {
    let updates = { self.transform = .identity }

    if animated, !UIAccessibility.isReduceMotionEnabled {
      UIView.animate(
        withDuration: 0.24,
        delay: 0,
        usingSpringWithDamping: 1,
        initialSpringVelocity: 0,
        options: [.allowUserInteraction, .beginFromCurrentState],
        animations: updates
      )
    } else {
      updates()
    }
  }

  private func showConfirmedFeedback() {
    confirmedFeedbackWorkItem?.cancel()
    setPressed(true)

    let workItem = DispatchWorkItem { [weak self] in
      self?.confirmedFeedbackWorkItem = nil
      self?.setPressed(false)
    }
    confirmedFeedbackWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.06, execute: workItem)
  }

  private func cancelConfirmedFeedback() {
    confirmedFeedbackWorkItem?.cancel()
    confirmedFeedbackWorkItem = nil
  }

  private func requireAncestorScrollPanToFail() {
    guard requiredScrollView == nil else { return }

    var ancestor = superview
    while let view = ancestor {
      if let scrollView = view as? UIScrollView {
        pressGesture.require(toFail: scrollView.panGestureRecognizer)
        requiredScrollView = scrollView
        return
      }
      ancestor = view.superview
    }
  }
}
