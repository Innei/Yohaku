import ExpoModulesCore
import UIKit

struct GroupedListRowSpec: Record {
  @Field var id: String = ""
  @Field var label: String = ""
  @Field var value: String?
  @Field var chevron: Bool = false
  @Field var danger: Bool = false
  @Field var pressable: Bool = false
  @Field var navigates: Bool = false
}

private func parseHexColor(_ hex: String) -> UIColor? {
  let trimmed = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
  var value: UInt64 = 0
  guard trimmed.count == 6, Scanner(string: trimmed).scanHexInt64(&value) else {
    return nil
  }
  return UIColor(
    red: CGFloat((value >> 16) & 0xFF) / 255,
    green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255,
    alpha: 1
  )
}

private final class GroupedListController: UIViewController {
  var onWillAppear: ((Bool, UIViewControllerTransitionCoordinator?) -> Void)?

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    onWillAppear?(animated, transitionCoordinator)
  }
}

final class GroupedListView: ExpoView, UICollectionViewDataSource,
  UICollectionViewDelegate {
  let onRowPress = EventDispatcher()
  let onNativeHeight = EventDispatcher()

  private var rows: [GroupedListRowSpec] = []
  private var dangerColor = UIColor.systemRed
  private var reportedHeight: CGFloat = 0
  private var contentSizeObservation: NSKeyValueObservation?
  private var highlightedIndexPath: IndexPath?
  private var flashWorkItem: DispatchWorkItem?
  private weak var requiredScrollView: UIScrollView?
  private let controller = GroupedListController()

  // Everything visual is left to the system's insetGrouped appearance —
  // overriding cell backgrounds, separators, or corner radii breaks the
  // native look this view exists to provide.
  private lazy var collectionView: UICollectionView = {
    let layout = UICollectionViewCompositionalLayout { _, environment in
      var config = UICollectionLayoutListConfiguration(appearance: .insetGrouped)
      config.backgroundColor = .clear
      let section = NSCollectionLayoutSection.list(
        using: config,
        layoutEnvironment: environment
      )
      // The RN side owns vertical rhythm; only the system's horizontal
      // inset is kept.
      section.contentInsets.top = 0
      section.contentInsets.bottom = 0
      return section
    }
    let view = UICollectionView(frame: .zero, collectionViewLayout: layout)
    view.isScrollEnabled = false
    view.backgroundColor = .clear
    view.contentInsetAdjustmentBehavior = .never
    // Match the screen's 20pt gutter instead of the 16pt system margin so
    // the cards align with the RN-laid-out content above them.
    view.preservesSuperviewLayoutMargins = false
    view.insetsLayoutMarginsFromSafeArea = false
    view.directionalLayoutMargins = NSDirectionalEdgeInsets(
      top: 0, leading: 20, bottom: 0, trailing: 20
    )
    // Highlight is driven by pressGesture below: the RN host scroll view
    // delivers touches instantly (delaysContentTouches is NO on RN's side),
    // so the cell's own touch-down highlight fires on every scroll that
    // starts on a row.
    view.allowsSelection = true
    view.dataSource = self
    view.delegate = self
    return view
  }()

  // UIKit throws if a CellRegistration is first created inside the cell
  // provider, so this must exist before the first dequeue.
  private var cellRegistration: UICollectionView.CellRegistration<
    UICollectionViewListCell, GroupedListRowSpec
  >!

  private lazy var pressGesture = NativePressGestureRecognizer(
    target: self,
    action: #selector(handlePress(_:))
  )

  private func makeCellRegistration() -> UICollectionView.CellRegistration<
    UICollectionViewListCell, GroupedListRowSpec
  > {
    UICollectionView.CellRegistration { [weak self] cell, _, row in
      guard let self else { return }
      var content = UIListContentConfiguration.valueCell()
      content.text = row.label
      if row.danger {
        content.textProperties.color = self.dangerColor
      }
      if let value = row.value {
        content.secondaryText = value
      }
      cell.contentConfiguration = content
      cell.accessories = row.chevron ? [.disclosureIndicator()] : []
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    cellRegistration = makeCellRegistration()
    controller.view = UIView(frame: .zero)
    addSubview(collectionView)
    controller.onWillAppear = { [weak self] animated, coordinator in
      self?.clearNavigationSelection(animated: animated, coordinator: coordinator)
    }
    // No pressed-state preview: rows only flash on a recognized tap, so a
    // scroll that pauses on a row can never light it up.
    pressGesture.shouldReceiveTouch = { [weak self] in
      guard let scroll = self?.requiredScrollView else { return true }
      return !(scroll.isDragging || scroll.isDecelerating)
    }
    addGestureRecognizer(pressGesture)
    contentSizeObservation = collectionView.observe(\.contentSize, options: [.new]) {
      [weak self] _, _ in
      self?.reportHeightIfNeeded()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    attachControllerIfNeeded()
    collectionView.frame = bounds
    requireAncestorScrollPanToFail()
  }

  override func willMove(toSuperview newSuperview: UIView?) {
    if newSuperview == nil {
      detachController()
    }
    super.willMove(toSuperview: newSuperview)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      flashWorkItem?.cancel()
      flashWorkItem = nil
      setHighlighted(nil)
    } else {
      attachControllerIfNeeded()
      requireAncestorScrollPanToFail()
    }
  }

  func setRows(_ next: [GroupedListRowSpec]) {
    rows = next
    collectionView.reloadData()
  }

  func setDangerColor(_ hex: String) {
    dangerColor = parseHexColor(hex) ?? dangerColor
    collectionView.reloadData()
  }

  @objc
  private func handlePress(_ recognizer: NativePressGestureRecognizer) {
    guard recognizer.state == .recognized else { return }
    guard let indexPath = pressableIndexPath(for: recognizer) else { return }
    if rows[indexPath.item].navigates {
      collectionView.selectItem(
        at: indexPath,
        animated: false,
        scrollPosition: []
      )
    } else {
      flashHighlight(indexPath)
    }
    onRowPress(["id": rows[indexPath.item].id])
  }

  private func clearNavigationSelection(
    animated: Bool,
    coordinator: UIViewControllerTransitionCoordinator?
  ) {
    guard let indexPath = collectionView.indexPathsForSelectedItems?.first else {
      return
    }
    guard let coordinator else {
      collectionView.deselectItem(at: indexPath, animated: animated)
      return
    }

    let started = coordinator.animate(
      alongsideTransition: { [weak self] _ in
        self?.collectionView.deselectItem(at: indexPath, animated: animated)
      },
      completion: { [weak self] context in
        guard context.isCancelled else { return }
        self?.collectionView.selectItem(
          at: indexPath,
          animated: false,
          scrollPosition: []
        )
      }
    )
    if !started {
      collectionView.deselectItem(at: indexPath, animated: animated)
    }
  }

  private func attachControllerIfNeeded() {
    guard controller.parent == nil, let parent = owningViewController() else {
      return
    }
    parent.addChild(controller)
    addSubview(controller.view)
    controller.didMove(toParent: parent)
  }

  private func detachController() {
    guard controller.parent != nil else { return }
    controller.willMove(toParent: nil)
    controller.view.removeFromSuperview()
    controller.removeFromParent()
  }

  private func owningViewController() -> UIViewController? {
    var responder: UIResponder? = next
    while let current = responder {
      if let controller = current as? UIViewController {
        return controller
      }
      responder = current.next
    }
    return nil
  }

  private func pressableIndexPath(
    for recognizer: UIGestureRecognizer
  ) -> IndexPath? {
    let location = recognizer.location(in: collectionView)
    guard let indexPath = collectionView.indexPathForItem(at: location),
          rows.indices.contains(indexPath.item),
          rows[indexPath.item].pressable else {
      return nil
    }
    return indexPath
  }

  private func setHighlighted(_ next: IndexPath?) {
    guard highlightedIndexPath != next else { return }
    if let current = highlightedIndexPath {
      collectionView.cellForItem(at: current)?.isHighlighted = false
    }
    highlightedIndexPath = next
    if let next {
      collectionView.cellForItem(at: next)?.isHighlighted = true
    }
  }

  private func flashHighlight(_ indexPath: IndexPath) {
    flashWorkItem?.cancel()
    setHighlighted(indexPath)
    let workItem = DispatchWorkItem { [weak self] in
      self?.flashWorkItem = nil
      self?.setHighlighted(nil)
    }
    flashWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: workItem)
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

  private func reportHeightIfNeeded() {
    let height = collectionView.contentSize.height
    guard height > 0, abs(height - reportedHeight) > 0.5 else { return }
    reportedHeight = height
    onNativeHeight(["height": height])
  }

  // The collection view's own touch pipeline still highlights cells even
  // with selection disabled; all highlight is driven by pressGesture.
  func collectionView(
    _ collectionView: UICollectionView,
    shouldHighlightItemAt indexPath: IndexPath
  ) -> Bool {
    false
  }

  func collectionView(
    _ collectionView: UICollectionView,
    numberOfItemsInSection section: Int
  ) -> Int {
    rows.count
  }

  func collectionView(
    _ collectionView: UICollectionView,
    cellForItemAt indexPath: IndexPath
  ) -> UICollectionViewCell {
    collectionView.dequeueConfiguredReusableCell(
      using: cellRegistration,
      for: indexPath,
      item: rows[indexPath.item]
    )
  }
}
