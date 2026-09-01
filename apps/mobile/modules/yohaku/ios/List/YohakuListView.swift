import ExpoModulesCore
import UIKit

final class YohakuListHostCell: UICollectionViewCell {
  private(set) weak var hosted: YohakuListCellView?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    contentView.backgroundColor = .clear
    contentView.clipsToBounds = false
    clipsToBounds = false
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func attach(_ host: YohakuListCellView) {
    if hosted === host, host.superview === contentView { return }
    if hosted !== host {
      hosted?.removeFromSuperview()
    }
    hosted = host
    if host.superview !== contentView {
      host.removeFromSuperview()
      contentView.addSubview(host)
    }
    host.frame = contentView.bounds
    host.autoresizingMask = [.flexibleWidth, .flexibleHeight]
  }

  func detachIfHosting(_ host: YohakuListCellView) {
    guard hosted === host else { return }
    host.removeFromSuperview()
    hosted = nil
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hosted?.frame = contentView.bounds
  }

  override func prepareForReuse() {
    super.prepareForReuse()
    layer.transform = CATransform3DIdentity
  }

}

final class YohakuListView: ExpoView, UICollectionViewDataSource,
  UICollectionViewDelegate, UICollectionViewDelegateFlowLayout,
  UIGestureRecognizerDelegate {
  let onEndReached = EventDispatcher()
  let onItemPress = EventDispatcher()
  let onLinkPress = EventDispatcher()
  let onRefresh = EventDispatcher()
  let onScroll = EventDispatcher()
  let onVisibleItems = EventDispatcher()

  private var items: [YohakuListItemSpec] = []
  private var hosts: [String: YohakuListCellView] = [:]
  private var measuredHeights: [String: CGFloat] = [:]
  private var registeredReuseIDs = Set<String>()
  private var contentInsetTop: CGFloat = 0
  private var contentInsetBottom: CGFloat = 0
  private var lastVisibleSignature = ""
  private var lastEndReachedCount = 0
  private var refreshControl: UIRefreshControl?

  private let fabricRail = YohakuListFabricRailView()
  private let fabricSettle = YohakuListFabricSettleDriver()
  private var fabricDragging = false
  private var fabricEnabled = false
  private var fabricMarks: [YohakuListFabricMarkSpec] = []
  private var fabricPinnedItemId = ""
  private var fabricProgress: CGFloat = 0
  private var fabricTouchY: CGFloat = 0
  private lazy var fabricPan: UIPanGestureRecognizer = {
    let gesture = UIPanGestureRecognizer(target: self, action: #selector(handleFabricPan(_:)))
    gesture.delegate = self
    gesture.cancelsTouchesInView = true
    gesture.maximumNumberOfTouches = 1
    return gesture
  }()
  private lazy var fabricTap: UITapGestureRecognizer = {
    let gesture = UITapGestureRecognizer(target: self, action: #selector(handleFabricTap(_:)))
    gesture.delegate = self
    return gesture
  }()

  private lazy var collectionView: UICollectionView = {
    let layout = UICollectionViewFlowLayout()
    layout.estimatedItemSize = .zero
    layout.minimumLineSpacing = 0
    layout.minimumInteritemSpacing = 0
    let view = UICollectionView(frame: .zero, collectionViewLayout: layout)
    view.backgroundColor = .clear
    view.alwaysBounceVertical = true
    view.delaysContentTouches = false
    view.allowsSelection = false
    view.contentInsetAdjustmentBehavior = .automatic
    view.dataSource = self
    view.delegate = self
    return view
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addSubview(collectionView)
    addSubview(fabricRail)
    collectionView.addGestureRecognizer(fabricPan)
    collectionView.addGestureRecognizer(fabricTap)
    fabricTap.require(toFail: fabricPan)
    fabricSettle.onFrame = { [weak self] progress in
      self?.setFabricProgress(progress, dragging: false)
    }
    fabricSettle.onRest = { [weak self] in
      self?.collectionView.isScrollEnabled = true
    }
    fabricRail.onAdjust = { [weak self] target in
      self?.adjustFabricFromAccessibility(target)
    }
    applyInsets()
    registerForTraitChanges([UITraitPreferredContentSizeCategory.self]) {
      (self: YohakuListView, _) in
      self.measuredHeights.removeAll()
      self.collectionView.collectionViewLayout.invalidateLayout()
      self.collectionView.reloadData()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    collectionView.frame = bounds
    fabricRail.frame = bounds
    applyFabricPresentation()
    emitVisibleItems()
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let host = childComponentView as? YohakuListCellView {
      host.list = self
      attachHost(host)
      return
    }
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let host = childComponentView as? YohakuListCellView {
      detachHost(host)
      return
    }
    super.unmountChildComponentView(childComponentView, index: index)
  }

  func setItems(_ next: [YohakuListItemSpec]) {
    items = next
    for item in next {
      let reuseID = reuseIdentifier(for: item.id)
      if registeredReuseIDs.insert(reuseID).inserted {
        collectionView.register(
          YohakuListHostCell.self,
          forCellWithReuseIdentifier: reuseID
        )
      }
    }
    let ids = Set(next.map(\.id))
    measuredHeights = measuredHeights.filter { ids.contains($0.key) }
    lastEndReachedCount = 0
    collectionView.reloadData()
    DispatchQueue.main.async { [weak self] in
      self?.emitVisibleItems()
      self?.applyFabricPresentation()
    }
  }

  func setFabricEnabled(_ enabled: Bool) {
    fabricEnabled = enabled
    if !enabled {
      fabricSettle.stop()
      fabricDragging = false
      fabricProgress = 0
      collectionView.isScrollEnabled = true
      resetFabricTransforms()
    }
    applyFabricPresentation()
  }

  func setFabricMarks(_ marks: [YohakuListFabricMarkSpec]) {
    fabricMarks = marks
    fabricRail.marks = marks
    if marks.isEmpty, fabricProgress != 0 {
      fabricSettle.stop()
      fabricProgress = 0
      resetFabricTransforms()
    }
    applyFabricPresentation()
  }

  func setFabricPinnedItemId(_ id: String) {
    fabricPinnedItemId = id
    applyFabricPresentation()
  }

  func setFabricAccentColor(_ color: UIColor?) {
    if let color { fabricRail.accentColor = color }
    fabricRail.setNeedsDisplay()
  }

  func setFabricTickColor(_ color: UIColor?) {
    if let color { fabricRail.tickColor = color }
    fabricRail.setNeedsDisplay()
  }

  func setFabricLabelColor(_ color: UIColor?) {
    if let color { fabricRail.labelColor = color }
    fabricRail.setNeedsDisplay()
  }

  func setFabricDeskColor(_ color: UIColor?) {
    if let color { fabricRail.deskColor = color }
    fabricRail.setNeedsDisplay()
  }

  func setFabricCompactHint(_ value: String) {
    fabricRail.compactHint = value
    applyFabricPresentation()
  }

  func setFabricExpandedHint(_ value: String) {
    fabricRail.expandedHint = value
    applyFabricPresentation()
  }

  func setContentInsetTop(_ value: Double) {
    contentInsetTop = CGFloat(value)
    collectionView.collectionViewLayout.invalidateLayout()
  }

  func setContentInsetBottom(_ value: Double) {
    contentInsetBottom = CGFloat(value)
    applyInsets()
  }

  func setRefreshing(_ refreshing: Bool) {
    if refreshControl == nil {
      let control = UIRefreshControl()
      control.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
      collectionView.refreshControl = control
      refreshControl = control
    }
    if refreshing {
      refreshControl?.beginRefreshing()
    } else {
      refreshControl?.endRefreshing()
    }
  }

  func attachHost(_ host: YohakuListCellView) {
    let id = host.itemId
    guard !id.isEmpty else { return }
    hosts[id] = host
    if host.bounds.height > 1 {
      reportHostHeight(id, host.bounds.height)
    }
    if let index = items.firstIndex(where: { $0.id == id }) {
      let path = IndexPath(item: index, section: 0)
      if let cell = collectionView.cellForItem(at: path) as? YohakuListHostCell {
        cell.attach(host)
      }
    }
  }

  func reportHostHeight(_ id: String, _ height: CGFloat) {
    let scale = window?.screen.scale ?? UIScreen.main.scale
    let height = ceil(height * scale) / scale
    let previous = measuredHeights[id] ?? 0
    guard abs(previous - height) >= 1 / scale else { return }
    measuredHeights[id] = height
    collectionView.collectionViewLayout.invalidateLayout()
  }

  private func detachHost(_ host: YohakuListCellView) {
    if hosts[host.itemId] === host {
      hosts.removeValue(forKey: host.itemId)
    }
    if let cell = host.superview?.superview as? YohakuListHostCell {
      cell.detachIfHosting(host)
    } else {
      host.removeFromSuperview()
    }
    host.list = nil
  }

  private func applyInsets() {
    collectionView.contentInset.bottom = contentInsetBottom
    collectionView.verticalScrollIndicatorInsets.bottom = contentInsetBottom
    let rail = fabricEnabled && !fabricMarks.isEmpty ? fabricRail.railWidth : 0
    collectionView.verticalScrollIndicatorInsets.right = rail
  }

  private func reuseIdentifier(for id: String) -> String {
    "YohakuListHostCell.\(id)"
  }

  @objc
  private func handleRefresh() {
    onRefresh()
  }

  private func emitScroll() {
    onScroll([
      "contentOffset": [
        "x": collectionView.contentOffset.x,
        "y": collectionView.contentOffset.y,
      ],
      "contentSize": [
        "width": collectionView.contentSize.width,
        "height": collectionView.contentSize.height,
      ],
      "layoutMeasurement": [
        "width": collectionView.bounds.width,
        "height": collectionView.bounds.height,
      ],
      "contentInset": [
        "top": collectionView.contentInset.top,
        "left": collectionView.contentInset.left,
        "bottom": collectionView.contentInset.bottom,
        "right": collectionView.contentInset.right,
      ],
      "zoomScale": collectionView.zoomScale,
    ])
  }

  private func emitVisibleItems() {
    let paths = collectionView.indexPathsForVisibleItems.sorted()
    guard !paths.isEmpty else {
      if lastVisibleSignature != "" {
        lastVisibleSignature = ""
        onVisibleItems(["items": []])
      }
      return
    }
    let overscan = 2
    let first = max(0, (paths.first?.item ?? 0) - overscan)
    let last = min(items.count - 1, (paths.last?.item ?? 0) + overscan)
    guard last >= first else { return }
    let window = (first...last).map { items[$0] }
    let signature = window.map(\.id).joined(separator: ",")
    guard signature != lastVisibleSignature else { return }
    lastVisibleSignature = signature
    onVisibleItems([
      "items": window.map { ["id": $0.id, "type": $0.type] },
    ])
  }

  private func maybeEndReached() {
    let distance =
      collectionView.contentSize.height
      + collectionView.contentInset.bottom
      - collectionView.bounds.height
      - collectionView.contentOffset.y
    guard items.count != lastEndReachedCount, distance <= 240 else { return }
    lastEndReachedCount = items.count
    onEndReached()
  }

  func collectionView(
    _ collectionView: UICollectionView,
    numberOfItemsInSection section: Int
  ) -> Int {
    items.count
  }

  func collectionView(
    _ collectionView: UICollectionView,
    cellForItemAt indexPath: IndexPath
  ) -> UICollectionViewCell {
    let item = items[indexPath.item]
    let cell = collectionView.dequeueReusableCell(
      withReuseIdentifier: reuseIdentifier(for: item.id),
      for: indexPath
    ) as! YohakuListHostCell
    if let host = hosts[item.id] {
      cell.attach(host)
    }
    return cell
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    emitScroll()
    emitVisibleItems()
    maybeEndReached()
    applyFabricPresentation()
  }

  func collectionView(
    _ collectionView: UICollectionView,
    willDisplay cell: UICollectionViewCell,
    forItemAt indexPath: IndexPath
  ) {
    let item = items[indexPath.item]
    if let host = hosts[item.id], let cell = cell as? YohakuListHostCell {
      cell.attach(host)
    }
    applyFabricWarp(to: cell, item: item)
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldReceive touch: UITouch
  ) -> Bool {
    if gestureRecognizer === fabricPan || gestureRecognizer === fabricTap {
      return isFabricHit(touch.location(in: self))
    }
    return true
  }

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard gestureRecognizer === fabricPan else { return true }
    let velocity = fabricPan.velocity(in: self)
    return abs(velocity.x) > abs(velocity.y) * 1.15
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    false
  }

  func collectionView(
    _ collectionView: UICollectionView,
    shouldHighlightItemAt indexPath: IndexPath
  ) -> Bool {
    false
  }

  func collectionView(
    _ collectionView: UICollectionView,
    layout collectionViewLayout: UICollectionViewLayout,
    sizeForItemAt indexPath: IndexPath
  ) -> CGSize {
    let item = items[indexPath.item]
    return CGSize(
      width: max(0, collectionView.bounds.width - 40),
      height: measuredHeights[item.id] ?? CGFloat(item.estimatedHeight)
    )
  }

  func collectionView(
    _ collectionView: UICollectionView,
    layout collectionViewLayout: UICollectionViewLayout,
    insetForSectionAt section: Int
  ) -> UIEdgeInsets {
    UIEdgeInsets(top: contentInsetTop, left: 20, bottom: 24, right: 20)
  }

  @objc
  private func handleFabricPan(_ gesture: UIPanGestureRecognizer) {
    let location = gesture.location(in: self)
    switch gesture.state {
    case .began:
      fabricSettle.stop()
      fabricDragging = true
      collectionView.isScrollEnabled = false
      fabricTouchY = location.y
      setFabricProgress(progressFromFingerX(location.x), dragging: true)
    case .changed:
      fabricTouchY = location.y
      setFabricProgress(progressFromFingerX(location.x), dragging: true)
    case .ended, .cancelled:
      fabricDragging = false
      let travel = YohakuListFabricMetrics.expandedWidth
        - YohakuListFabricMetrics.compactWidth
      let velocityX = gesture.velocity(in: self).x
      let velocityProgress = travel > 0 ? -velocityX / travel : 0
      let next = snapFabricDensity(
        progress: fabricProgress,
        velocityProgress: velocityProgress
      )
      if UIAccessibility.isReduceMotionEnabled {
        setFabricProgress(next, dragging: false)
        collectionView.isScrollEnabled = true
      } else {
        fabricSettle.position = fabricProgress
        fabricSettle.settle(to: next, velocity: velocityProgress)
      }
    default:
      break
    }
  }

  @objc
  private func handleFabricTap(_ gesture: UITapGestureRecognizer) {
    let y = gesture.location(in: self).y
    guard let mark = nearestFabricMark(toY: y) else { return }
    scrollFabricItem(mark.itemId)
  }

  private func setFabricProgress(_ progress: CGFloat, dragging: Bool) {
    fabricProgress = min(1, max(0, progress))
    fabricDragging = dragging
    applyFabricPresentation()
  }

  private func applyFabricPresentation() {
    let active = fabricEnabled && !fabricMarks.isEmpty
    fabricRail.isHidden = !active
    guard active else {
      resetFabricTransforms()
      return
    }
    let olderVisible = olderVisibleRect()
    if fabricTouchY == 0 {
      fabricTouchY = olderVisible.midY
    }
    fabricRail.update(
      activeItemId: activeFabricItemId(in: olderVisible),
      markFrames: fabricMarkFrames(in: olderVisible),
      olderVisible: olderVisible,
      progress: fabricProgress,
      touchY: fabricTouchY
    )
    applyInsets()
    applyFabricWarp()
  }

  private func applyFabricWarp() {
    for cell in collectionView.visibleCells {
      guard let path = collectionView.indexPath(for: cell) else { continue }
      applyFabricWarp(to: cell, item: items[path.item])
    }
  }

  private func applyFabricWarp(to cell: UICollectionViewCell, item: YohakuListItemSpec) {
    guard fabricEnabled, !fabricMarks.isEmpty, participatesInFabric(item) else {
      cell.layer.transform = CATransform3DIdentity
      return
    }
    if UIAccessibility.isReduceMotionEnabled {
      cell.layer.transform = CATransform3DIdentity
      return
    }

    let railGrowth =
      (YohakuListFabricMetrics.expandedWidth - YohakuListFabricMetrics.compactWidth)
      * fabricProgress
    let center = collectionView.convert(cell.center, to: self)
    let dist = center.y - fabricTouchY
    let sigma: CGFloat = 150
    let falloff = exp(-((dist / sigma) * (dist / sigma)))
    let mid = 4 * fabricProgress * (1 - fabricProgress)
    let compress = -railGrowth * 0.55
    let live = fabricDragging ? 1 : mid
    let pull = -falloff * live * 28
    let gather = falloff * mid * (dist >= 0 ? 7 : -7)

    var transform = CATransform3DIdentity
    transform.m34 = -1 / 900
    transform = CATransform3DTranslate(
      transform,
      compress + pull,
      gather,
      falloff * mid * 6
    )
    transform = CATransform3DRotate(
      transform,
      -0.09 * fabricProgress * (0.22 + 0.78 * falloff),
      0,
      1,
      0
    )
    cell.layer.transform = transform
  }

  private func resetFabricTransforms() {
    for cell in collectionView.visibleCells {
      cell.layer.transform = CATransform3DIdentity
    }
  }

  private func participatesInFabric(_ item: YohakuListItemSpec) -> Bool {
    if !fabricPinnedItemId.isEmpty, item.id == fabricPinnedItemId { return false }
    switch item.type {
    case "latest", "footer":
      return false
    case "rule", "year", "note":
      return true
    default:
      return false
    }
  }

  private func isFabricHit(_ point: CGPoint) -> Bool {
    guard fabricEnabled, !fabricMarks.isEmpty else { return false }
    let older = olderVisibleRect()
    guard older.height > 8,
          point.y >= older.minY - 6,
          point.y <= older.maxY + 6
    else { return false }
    let hit = max(fabricRail.railWidth, YohakuListFabricMetrics.minHitWidth)
    return point.x >= bounds.maxX - hit
  }

  private func progressFromFingerX(_ x: CGFloat) -> CGFloat {
    let compactLeft = bounds.maxX - YohakuListFabricMetrics.compactWidth
    let expandedLeft = bounds.maxX - YohakuListFabricMetrics.expandedWidth
    let span = compactLeft - expandedLeft
    guard span > 0 else { return 0 }
    return min(1, max(0, (compactLeft - x) / span))
  }

  private func snapFabricDensity(progress: CGFloat, velocityProgress: CGFloat) -> CGFloat {
    if velocityProgress >= YohakuListFabricMetrics.flingVelocity { return 1 }
    if velocityProgress <= -YohakuListFabricMetrics.flingVelocity { return 0 }
    return progress >= YohakuListFabricMetrics.snapThreshold ? 1 : 0
  }

  private func olderContentRect() -> CGRect {
    var union = CGRect.null
    for (index, item) in items.enumerated() {
      guard participatesInFabric(item),
            let frame = itemFrameInList(at: index)
      else { continue }
      union = union.union(frame)
    }
    return union.isNull ? .zero : union
  }

  private func olderVisibleRect() -> CGRect {
    let content = olderContentRect()
    guard content.height > 1 else { return .zero }
    return content.intersection(bounds)
  }

  private func itemFrameInList(id: String) -> CGRect? {
    guard let index = items.firstIndex(where: { $0.id == id }) else { return nil }
    return itemFrameInList(at: index)
  }

  private func itemFrameInList(at index: Int) -> CGRect? {
    let path = IndexPath(item: index, section: 0)
    guard let frame = collectionView.layoutAttributesForItem(at: path)?.frame
    else { return nil }
    return collectionView.convert(frame, to: self)
  }

  private func fabricMarkFrames(in olderVisible: CGRect) -> [String: CGRect] {
    let content = olderContentRect()
    var frames: [String: CGRect] = [:]
    for mark in fabricMarks {
      let compactY = olderVisible.minY + CGFloat(mark.compactT) * olderVisible.height
      let expandedY: CGFloat
      if let itemFrame = itemFrameInList(id: mark.itemId) {
        expandedY = itemFrame.minY + min(14, itemFrame.height * 0.18)
      } else if content.height > 1 {
        expandedY = content.minY + CGFloat(mark.expandedT) * content.height
      } else {
        expandedY = compactY
      }
      let y = compactY + (expandedY - compactY) * fabricProgress
      frames[mark.id] = CGRect(x: 0, y: y - 10, width: fabricRail.railWidth, height: 20)
    }
    return frames
  }

  private func activeFabricItemId(in olderVisible: CGRect) -> String {
    let focusY = olderVisible.minY + 20
    let preferYear = fabricProgress < 0.45
    var best = ""
    var bestDistance = CGFloat.greatestFiniteMagnitude
    for mark in fabricMarks {
      if preferYear, mark.kind != "year" { continue }
      if !preferYear, mark.kind != "note" { continue }
      guard let frame = itemFrameInList(id: mark.itemId) else { continue }
      if frame.maxY < olderVisible.minY - 48 { continue }
      let distance = abs(frame.minY - focusY)
      if distance < bestDistance {
        bestDistance = distance
        best = mark.itemId
      }
    }
    return best
  }

  private func nearestFabricMark(toY y: CGFloat) -> YohakuListFabricMarkSpec? {
    let frames = fabricMarkFrames(in: olderVisibleRect())
    let preferYear = fabricProgress < 0.45
    return fabricMarks.min { a, b in
      let aPreferred = preferYear ? a.kind == "year" : a.kind == "note"
      let bPreferred = preferYear ? b.kind == "year" : b.kind == "note"
      if aPreferred != bPreferred { return aPreferred }
      let aY = frames[a.id]?.midY ?? .greatestFiniteMagnitude
      let bY = frames[b.id]?.midY ?? .greatestFiniteMagnitude
      return abs(aY - y) < abs(bY - y)
    }
  }

  private func adjustFabricFromAccessibility(_ target: CGFloat?) {
    let next = target ?? (fabricProgress >= 0.5 ? 0 : 1)
    fabricSettle.stop()
    if UIAccessibility.isReduceMotionEnabled {
      setFabricProgress(next, dragging: false)
    } else {
      fabricSettle.position = fabricProgress
      fabricSettle.settle(to: next, velocity: 0)
    }
  }

  private func scrollFabricItem(_ id: String) {
    guard let index = items.firstIndex(where: { $0.id == id }) else { return }
    let animated = !UIAccessibility.isReduceMotionEnabled
    collectionView.scrollToItem(
      at: IndexPath(item: index, section: 0),
      at: .centeredVertically,
      animated: animated
    )
  }
}
