import ExpoModulesCore
import UIKit

private final class YohakuStudyContentHost: UIView {
  var onChildLayout: (() -> Void)?

  override func layoutSubviews() {
    super.layoutSubviews()
    onChildLayout?()
  }
}

private final class YohakuStudyPage {
  let scroll = UIScrollView()
  let avatar: SettingsAvatarView
  let placeholder = UIView()
  let contentHost = YohakuStudyContentHost()
  private var collapseDistance: CGFloat = 120

  init(appContext: AppContext?) {
    avatar = SettingsAvatarView(appContext: appContext)
    scroll.alwaysBounceVertical = true
    scroll.showsHorizontalScrollIndicator = false
    scroll.contentInsetAdjustmentBehavior = .never
    scroll.contentInset = .zero
    scroll.backgroundColor = .clear
    scroll.clipsToBounds = true
    YohakuScrollEdges.navigation(scroll)

    placeholder.clipsToBounds = true
    placeholder.isUserInteractionEnabled = false
    avatar.isUserInteractionEnabled = false

    scroll.addSubview(placeholder)
    scroll.addSubview(avatar)
    scroll.addSubview(contentHost)
  }

  func setCollapseDistance(_ value: CGFloat) {
    collapseDistance = value
    avatar.setCollapseDistance(Double(value))
  }

  func setImageUri(_ value: String) {
    let hasImage = !value.isEmpty
    avatar.isHidden = !hasImage
    placeholder.isHidden = hasImage
    if hasImage {
      avatar.setImageUri(value)
    } else {
      avatar.setImageUri("")
    }
  }

  func applyInsets(safeArea: UIEdgeInsets) {
    let bottom = max(safeArea.bottom, collapseDistance)
    let inset = UIEdgeInsets(top: safeArea.top, left: 0, bottom: bottom, right: 0)
    scroll.contentInset = inset
    scroll.verticalScrollIndicatorInsets = inset
  }

  func layout(in bounds: CGRect) {
    let width = bounds.width
    let height = bounds.height
    guard width > 0, height > 0 else { return }
    scroll.frame = bounds

    let avatarSize: CGFloat = 100
    let avatarTop: CGFloat = 24
    let gap: CGFloat = 8
    let avatarFrame = CGRect(
      x: (width - avatarSize) / 2,
      y: avatarTop,
      width: avatarSize,
      height: avatarSize
    )
    avatar.frame = avatarFrame
    placeholder.frame = avatarFrame
    placeholder.layer.cornerRadius = avatarSize / 2

    let child = contentHost.subviews.first
    let childHeight = child?.frame.height ?? 0
    contentHost.frame = CGRect(
      x: 0,
      y: avatarFrame.maxY + gap,
      width: width,
      height: childHeight
    )
    if let child {
      child.frame = CGRect(x: 0, y: 0, width: width, height: childHeight)
    }

    let minHeight = max(0, height - scroll.contentInset.top - scroll.contentInset.bottom)
    scroll.contentSize = CGSize(
      width: width,
      height: max(contentHost.frame.maxY, minHeight)
    )
  }
}

final class YohakuStudyShellView: ExpoView, UIScrollViewDelegate {
  let onPageScroll = EventDispatcher()
  let onPageSelected = EventDispatcher()

  private let pager = UIScrollView()
  private var pages: [YohakuStudyPage] = []
  private var page = 0
  private var lastReportedPage = 0
  private var lastReportedProgress: CGFloat = -1
  private var collapseDistance: CGFloat = 120

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    backgroundColor = .clear
    pager.isPagingEnabled = true
    pager.bounces = false
    pager.alwaysBounceHorizontal = false
    pager.alwaysBounceVertical = false
    pager.isDirectionalLockEnabled = true
    pager.showsHorizontalScrollIndicator = false
    pager.showsVerticalScrollIndicator = false
    pager.contentInsetAdjustmentBehavior = .never
    pager.contentInset = .zero
    pager.delegate = self
    pager.backgroundColor = .clear
    addSubview(pager)

    pages = [
      YohakuStudyPage(appContext: appContext),
      YohakuStudyPage(appContext: appContext),
    ]
    for (index, item) in pages.enumerated() {
      item.contentHost.onChildLayout = { [weak self] in
        self?.layoutPages()
      }
      item.setCollapseDistance(collapseDistance)
      pager.addSubview(item.scroll)
      item.scroll.scrollsToTop = index == 0
    }
    pages[0].avatar.setActive(true)
    pages[1].avatar.setActive(false)
  }

  func setPage(_ value: Double) {
    let clamped = clampPage(Int(value.rounded()))
    let animated =
      window != nil && lastReportedPage != clamped && bounds.width > 0 && !pager.isDragging
      && !pager.isDecelerating
    page = clamped
    updateActiveAvatars()
    scrollToCurrentPage(animated: animated)
  }

  func setOwnerImageUri(_ value: String) {
    pages[0].setImageUri(value)
  }

  func setAccountImageUri(_ value: String) {
    pages[1].setImageUri(value)
  }

  func setRingColor(_ color: UIColor?) {
    for item in pages {
      item.avatar.setRingColor(color)
      item.placeholder.backgroundColor = color?.withAlphaComponent(0.18)
    }
  }

  func setCollapseDistance(_ value: Double) {
    collapseDistance = CGFloat(value)
    for item in pages {
      item.setCollapseDistance(collapseDistance)
    }
    applyInsets()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil else { return }
    applyInsets()
    layoutPages()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    applyInsets()
    layoutPages()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    applyInsets()
    layoutPages()
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    let pageIndex = min(max(index, 0), pages.count - 1)
    pages[pageIndex].contentHost.addSubview(childComponentView)
    setNeedsLayout()
    layoutIfNeeded()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
    setNeedsLayout()
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    guard scrollView === pager else { return }
    emitProgress()
  }

  func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    guard scrollView === pager else { return }
    emitSelected()
  }

  func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
    guard scrollView === pager else { return }
    if !decelerate {
      emitSelected()
    }
  }

  func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
    guard scrollView === pager else { return }
    emitSelected()
  }

  private func applyInsets() {
    let insets = safeAreaInsets
    for item in pages {
      item.applyInsets(safeArea: insets)
    }
  }

  private func layoutPages() {
    let width = bounds.width
    let height = bounds.height
    guard width > 0, height > 0 else { return }
    pager.frame = bounds
    pager.contentSize = CGSize(width: width * CGFloat(pages.count), height: height)
    for (index, item) in pages.enumerated() {
      item.layout(in: CGRect(x: CGFloat(index) * width, y: 0, width: width, height: height))
    }
    page = clampPage(page)
    if !pager.isDragging, !pager.isDecelerating {
      scrollToCurrentPage(animated: false)
    }
  }

  private func scrollToCurrentPage(animated: Bool) {
    guard bounds.width > 0 else { return }
    let offset = CGPoint(x: CGFloat(page) * bounds.width, y: 0)
    guard abs(pager.contentOffset.x - offset.x) > 0.5 else { return }
    if animated {
      pager.setContentOffset(offset, animated: true)
    } else {
      pager.contentOffset = offset
    }
  }

  private func updateActiveAvatars() {
    for (index, item) in pages.enumerated() {
      item.avatar.setActive(index == page)
      item.scroll.scrollsToTop = index == page
    }
  }

  private func emitOnMain(_ work: @escaping () -> Void) {
    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  private func emitProgress() {
    emitOnMain { [weak self] in
      guard let self, self.window != nil, self.bounds.width > 0 else { return }
      let maxProgress = max(0, CGFloat(self.pages.count) - 1)
      let progress = min(maxProgress, max(0, self.pager.contentOffset.x / self.bounds.width))
      if abs(progress - self.lastReportedProgress) < 0.001 { return }
      self.lastReportedProgress = progress
      self.onPageScroll(["progress": progress])
    }
  }

  private func emitSelected() {
    emitOnMain { [weak self] in
      guard let self, self.window != nil else { return }
      let next = self.clampPage(Int((self.pager.contentOffset.x / self.bounds.width).rounded()))
      self.page = next
      self.updateActiveAvatars()
      guard self.lastReportedPage != next else { return }
      self.lastReportedPage = next
      self.onPageSelected(["page": next])
    }
  }

  private func clampPage(_ value: Int) -> Int {
    min(max(value, 0), max(pages.count - 1, 0))
  }
}
