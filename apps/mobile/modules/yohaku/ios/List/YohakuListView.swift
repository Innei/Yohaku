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

}

final class YohakuListView: ExpoView, UICollectionViewDataSource,
  UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
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
    }
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

  func collectionView(
    _ collectionView: UICollectionView,
    willDisplay cell: UICollectionViewCell,
    forItemAt indexPath: IndexPath
  ) {
    let item = items[indexPath.item]
    if let host = hosts[item.id], let cell = cell as? YohakuListHostCell {
      cell.attach(host)
    }
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    emitScroll()
    emitVisibleItems()
    maybeEndReached()
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
}
