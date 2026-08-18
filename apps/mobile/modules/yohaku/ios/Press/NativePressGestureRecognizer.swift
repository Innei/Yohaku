import UIKit

final class NativePressGestureRecognizer: UIGestureRecognizer {
  var onPressedChange: ((Bool) -> Void)?
  var onTouchBegan: (() -> Void)?
  var shouldReceiveTouch: (() -> Bool)?

  private static let activationDelay: TimeInterval = 0.12
  private static let activationStillness: CGFloat = 4
  private static let allowableMovement: CGFloat = 10

  private var activationWorkItem: DispatchWorkItem?
  private var initialLocation = CGPoint.zero
  private var pressed = false
  private var trackedTouch: UITouch?

  override init(target: Any?, action: Selector?) {
    super.init(target: target, action: action)
    cancelsTouchesInView = false
    delaysTouchesBegan = false
    delaysTouchesEnded = false
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    guard state == .possible, trackedTouch == nil, touches.count == 1,
          let touch = touches.first else {
      fail()
      return
    }

    // A touch that lands while the host scroll view is still moving belongs
    // to the scroller (drag-to-stop); it must never read as a press.
    if shouldReceiveTouch?() == false {
      fail()
      return
    }

    trackedTouch = touch
    initialLocation = touch.location(in: nil)
    onTouchBegan?()
    scheduleActivation()
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
    guard state == .possible,
          let touch = trackedTouch,
          touches.contains(where: { $0 === touch }) else { return }

    let location = touch.location(in: nil)
    let dx = location.x - initialLocation.x
    let dy = location.y - initialLocation.y
    let limit = Self.allowableMovement

    if dx * dx + dy * dy > limit * limit {
      fail()
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    guard state == .possible,
          let touch = trackedTouch,
          touches.contains(where: { $0 === touch }) else { return }

    cancelActivation()
    setPressed(false)
    state = .recognized
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    fail()
  }

  override func reset() {
    cancelActivation()
    setPressed(false)
    trackedTouch = nil
    initialLocation = .zero
    super.reset()
  }

  // Nested NativePress views: the outer recognizer must wait for a descendant
  // press to fail. Otherwise both fire independently, and JS stopPropagation
  // cannot cancel the ancestor UIKit gesture. UIKit may consult either side of
  // the relationship, so both overrides describe the same inner-wins rule.
  override func shouldRequireFailure(
    of otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    guard
      otherGestureRecognizer is NativePressGestureRecognizer,
      let ownView = view,
      let otherView = otherGestureRecognizer.view,
      otherView !== ownView,
      otherView.isDescendant(of: ownView)
    else {
      return super.shouldRequireFailure(of: otherGestureRecognizer)
    }
    return true
  }

  override func shouldBeRequiredToFail(
    by otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    guard
      otherGestureRecognizer is NativePressGestureRecognizer,
      let ownView = view,
      let otherView = otherGestureRecognizer.view,
      otherView !== ownView,
      ownView.isDescendant(of: otherView)
    else {
      return super.shouldBeRequiredToFail(by: otherGestureRecognizer)
    }
    return true
  }

  // This recognizer must never hold back an ancestor UIScrollView pan. The
  // scroll recognizer is still allowed to prevent this recognizer, which gives
  // scrolling ownership as soon as UIKit recognizes the drag.
  override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool {
    false
  }

  private func scheduleActivation() {
    let workItem = DispatchWorkItem { [weak self] in
      self?.attemptActivation()
    }
    activationWorkItem = workItem
    DispatchQueue.main.asyncAfter(
      deadline: .now() + Self.activationDelay,
      execute: workItem
    )
  }

  // A finger that keeps drifting is scrolling, not pressing: defer the
  // pressed state until it holds still, and let the movement threshold in
  // touchesMoved terminate real scrolls.
  private func attemptActivation() {
    guard state == .possible, let touch = trackedTouch else { return }
    let location = touch.location(in: nil)
    let dx = location.x - initialLocation.x
    let dy = location.y - initialLocation.y
    let stillness = Self.activationStillness
    if dx * dx + dy * dy > stillness * stillness {
      scheduleActivation()
      return
    }
    setPressed(true)
  }

  private func cancelActivation() {
    activationWorkItem?.cancel()
    activationWorkItem = nil
  }

  private func fail() {
    cancelActivation()
    setPressed(false)
    if state == .possible {
      state = .failed
    }
  }

  private func setPressed(_ next: Bool) {
    guard pressed != next else { return }
    pressed = next
    onPressedChange?(next)
  }
}
