import UIKit
import XCTest

@MainActor
final class NoteHeroTests: XCTestCase {
  func testListCoverIsSharpAtRestWithAutomaticTopInset() {
    let restingY: CGFloat = 8 + 116
    let layout = YohakuNoteHeroLayout.frame(
      cellY: restingY, heroHeight: 248, width: 402,
      stretches: true, restingCellY: restingY
    )
    XCTAssertEqual(layout.blur, 0)
    // Keep the existing cover/body baseline below the navigation inset.
    XCTAssertEqual(layout.frame.maxY, 372)
  }

  func testListCoverBlurTracksOnlyAdditionalPullAndClearsOnScroll() {
    let restingY: CGFloat = 124
    let pulled = YohakuNoteHeroLayout.frame(
      cellY: restingY + 28, heroHeight: 248, width: 402,
      stretches: true, restingCellY: restingY
    )
    XCTAssertEqual(pulled.blur, 0.5)
    XCTAssertEqual(pulled.frame.maxY, 400)
    let scrolled = YohakuNoteHeroLayout.frame(
      cellY: restingY - 80, heroHeight: 248, width: 402,
      stretches: true, restingCellY: restingY
    )
    XCTAssertEqual(scrolled.blur, 0)
    XCTAssertEqual(scrolled.frame.maxY, 292)
  }

  func testRolePropArrivingAfterNoteIDKeepsFirstMountScrollDriven() {
    let fixture = HeroFixture()
    // Expo can deliver the note ID before the list role. The same native slot
    // first registers under the host's default detail role.
    fixture.update(.detail, y: 0, slot: fixture.listSlot)
    let hero = fixture.listSlot.subviews.first!
    fixture.update(.list, y: 124)
    XCTAssertTrue(hero.superview === fixture.listSlot)
    XCTAssertEqual(hero.frame.minY, 124)
    fixture.update(.list, y: -80)
    XCTAssertEqual(hero.frame.minY, -80)

    // A subsequent real detail host must still be able to own a push.
    fixture.coordinator.prepareTransition(noteID: "test")
    let transition = fixture.transition(from: fixture.list, to: fixture.detail)
    fixture.update(.detail, y: 20)
    XCTAssertTrue(hero.superview === fixture.container)
    transition.finish(cancelled: false)
    XCTAssertTrue(hero.superview === fixture.detailSlot)
    fixture.update(.detail, y: -40)
    XCTAssertEqual(hero.frame.minY, -40)
  }

  func testAbandonedPreparationDoesNotFreezeScrolling() {
    let fixture = HeroFixture()
    fixture.update(.list, y: 124)
    let hero = fixture.listSlot.subviews.first!
    fixture.coordinator.prepareTransition(noteID: "test")
    fixture.coordinator.prepareTransition(noteID: "test")
    fixture.update(.list, y: -80)
    XCTAssertTrue(hero.superview === fixture.listSlot)
    XCTAssertEqual(hero.frame.minY, -80)
    fixture.update(.list, y: 124)
    XCTAssertEqual(hero.frame.minY, 124)
  }

  func testPushConvertsDestinationSlotAndIgnoresIncomingTranslation() {
    let fixture = HeroFixture()
    fixture.update(.list, y: 124)
    let hero = fixture.listSlot.subviews.first!
    fixture.coordinator.prepareTransition(noteID: "test")
    fixture.detail.view.transform = CGAffineTransform(translationX: 402, y: 0)
    let transition = fixture.transition(from: fixture.list, to: fixture.detail)
    fixture.update(.detail, y: 20)
    XCTAssertTrue(hero.superview === fixture.container)
    XCTAssertEqual(hero.frame.minX, 0)
    XCTAssertEqual(hero.frame.minY, 70)
    transition.finish(cancelled: false)
    XCTAssertTrue(hero.superview === fixture.detailSlot)
    XCTAssertEqual(hero.frame.minY, 20)
  }

  func testCancelledPopReturnsHeroToDetailAndResumesScrolling() {
    checkPop(cancelled: true)
  }

  func testCompletedPopReturnsHeroToListAndResumesScrolling() {
    checkPop(cancelled: false)
  }

  private func checkPop(cancelled: Bool) {
    let fixture = HeroFixture()
    fixture.update(.detail, y: 20)
    let hero = fixture.detailSlot.subviews.first!
    fixture.update(.list, y: 124)
    fixture.coordinator.prepareTransition(noteID: "test")
    let transition = fixture.transition(from: fixture.detail, to: fixture.list)
    fixture.update(.list, y: 124)
    XCTAssertTrue(hero.superview === fixture.container)
    transition.finish(cancelled: cancelled)
    let role: YohakuNoteHeroSlotRole = cancelled ? .detail : .list
    let slot = cancelled ? fixture.detailSlot : fixture.listSlot
    XCTAssertTrue(hero.superview === slot)
    fixture.update(role, y: -40)
    XCTAssertEqual(hero.frame.minY, -40)
  }
}

@MainActor
private final class HeroController: UIViewController {
  var testTransition: TestTransition?
  override var transitionCoordinator: UIViewControllerTransitionCoordinator? {
    testTransition
  }
}

@MainActor
private final class HeroFixture {
  let coordinator = YohakuSharedNoteHeroCoordinator()
  let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 402, height: 874))
  let root = UIViewController()
  let list = HeroController()
  let detail = HeroController()
  let listSlot = UIView()
  let detailSlot = UIView()
  var container: UIView { root.view }

  init() {
    window.rootViewController = root
    window.isHidden = false
    root.view.frame = window.bounds
    for controller in [list, detail] {
      root.addChild(controller)
      controller.view.frame = root.view.bounds
      root.view.addSubview(controller.view)
      controller.didMove(toParent: root)
    }
    listSlot.frame = list.view.bounds
    detailSlot.frame = detail.view.bounds.offsetBy(dx: 0, dy: 50)
    list.view.addSubview(listSlot)
    detail.view.addSubview(detailSlot)
  }

  func update(_ role: YohakuNoteHeroSlotRole, y: CGFloat, slot: UIView? = nil) {
    var spec = YohakuNoteHeroSpec()
    spec.id = "test"
    spec.title = "Shared note title"
    coordinator.update(
      slot: slot ?? (role == .list ? listSlot : detailSlot),
      role: role, spec: spec, titleColor: nil, metaColor: nil,
      frame: CGRect(x: 0, y: y, width: 402, height: 98), blur: 0
    )
  }

  func transition(from: HeroController, to: HeroController) -> TestTransition {
    let result = TestTransition(from: from, to: to, container: container)
    from.testTransition = result
    to.testTransition = result
    return result
  }
}

@MainActor
private final class TestTransition: NSObject, UIViewControllerTransitionCoordinator {
  let from: UIViewController
  let to: UIViewController
  let containerView: UIView
  var completion: ((UIViewControllerTransitionCoordinatorContext) -> Void)?
  let isAnimated = true
  let presentationStyle = UIModalPresentationStyle.none
  let initiallyInteractive = true
  let isInterruptible = true
  let isInteractive = true
  var isCancelled = false
  let transitionDuration: TimeInterval = 0.35
  let percentComplete: CGFloat = 0.5
  let completionVelocity: CGFloat = 1
  let completionCurve = UIView.AnimationCurve.easeInOut
  let targetTransform = CGAffineTransform.identity

  init(from: UIViewController, to: UIViewController, container: UIView) {
    self.from = from
    self.to = to
    containerView = container
  }

  func viewController(forKey key: UITransitionContextViewControllerKey) -> UIViewController? {
    key == .from ? from : to
  }
  func view(forKey key: UITransitionContextViewKey) -> UIView? {
    key == .from ? from.view : to.view
  }
  func animate(
    alongsideTransition animation: ((UIViewControllerTransitionCoordinatorContext) -> Void)?,
    completion: ((UIViewControllerTransitionCoordinatorContext) -> Void)?
  ) -> Bool {
    self.completion = completion
    animation?(self)
    return true
  }
  func animateAlongsideTransition(
    in view: UIView?, animation: ((UIViewControllerTransitionCoordinatorContext) -> Void)?,
    completion: ((UIViewControllerTransitionCoordinatorContext) -> Void)?
  ) -> Bool {
    animate(alongsideTransition: animation, completion: completion)
  }
  func notifyWhenInteractionEnds(_ handler: @escaping (UIViewControllerTransitionCoordinatorContext) -> Void) {}
  func notifyWhenInteractionChanges(_ handler: @escaping (UIViewControllerTransitionCoordinatorContext) -> Void) {}
  func finish(cancelled: Bool) {
    isCancelled = cancelled
    completion?(self)
    (from as? HeroController)?.testTransition = nil
    (to as? HeroController)?.testTransition = nil
  }
}
