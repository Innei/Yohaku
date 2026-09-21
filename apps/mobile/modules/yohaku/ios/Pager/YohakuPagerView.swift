import ExpoModulesCore
import UIKit

private final class YohakuPagerPageView: UIView {
  override func layoutSubviews() {
    super.layoutSubviews()
    for subview in subviews {
      if subview.frame != bounds {
        subview.frame = bounds
      }
    }
  }
}

final class YohakuPagerView: ExpoView, UIScrollViewDelegate {
  let onPageScroll = EventDispatcher()
  let onPageSelected = EventDispatcher()

  private let scrollView = UIScrollView()
  private var pages: [YohakuPagerPageView] = []
  private var page = 0
  private var lastReportedPage = 0
  private var lastReportedProgress: CGFloat = -1

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    scrollView.isPagingEnabled = true
    scrollView.bounces = false
    scrollView.alwaysBounceHorizontal = false
    scrollView.alwaysBounceVertical = false
    scrollView.isDirectionalLockEnabled = true
    scrollView.showsHorizontalScrollIndicator = false
    scrollView.showsVerticalScrollIndicator = false
    scrollView.contentInsetAdjustmentBehavior = .never
    scrollView.contentInset = .zero
    scrollView.scrollIndicatorInsets = .zero
    scrollView.delegate = self
    addSubview(scrollView)
  }

  func setPage(_ value: Double) {
    let clamped = clampPage(Int(value.rounded()))
    let animated =
      window != nil && lastReportedPage != clamped && bounds.width > 0 && !scrollView.isDragging
      && !scrollView.isDecelerating
    page = clamped
    scrollToCurrentPage(animated: animated)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil { return }
    layoutPages()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    layoutPages()
    DispatchQueue.main.async { [weak self] in
      self?.layoutPages()
    }
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    let insertAt = min(max(index, 0), pages.count)
    let pageView = YohakuPagerPageView()
    pageView.clipsToBounds = true
    pageView.addSubview(childComponentView)
    pages.insert(pageView, at: insertAt)
    scrollView.insertSubview(pageView, at: insertAt)
    setNeedsLayout()
    layoutIfNeeded()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    let match = pages.firstIndex { $0.subviews.contains(childComponentView) }
    let removeAt = match ?? index
    if removeAt >= 0, removeAt < pages.count {
      let pageView = pages.remove(at: removeAt)
      childComponentView.removeFromSuperview()
      pageView.removeFromSuperview()
    }
    page = clampPage(page)
    setNeedsLayout()
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    emitProgress()
  }

  func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    emitSelected()
  }

  func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
    if !decelerate {
      emitSelected()
    }
  }

  func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
    emitSelected()
  }

  private func layoutPages() {
    let width = bounds.width
    let height = bounds.height
    guard width > 0, height > 0 else { return }

    scrollView.frame = bounds
    scrollView.contentInset = .zero
    scrollView.contentSize = CGSize(width: width * CGFloat(pages.count), height: height)
    for (index, pageView) in pages.enumerated() {
      pageView.frame = CGRect(x: CGFloat(index) * width, y: 0, width: width, height: height)
      pageView.setNeedsLayout()
    }
    page = clampPage(page)
    if !scrollView.isDragging, !scrollView.isDecelerating {
      scrollToCurrentPage(animated: false)
    }
  }

  private func scrollToCurrentPage(animated: Bool) {
    guard bounds.width > 0 else { return }
    let offset = CGPoint(x: CGFloat(page) * bounds.width, y: 0)
    guard abs(scrollView.contentOffset.x - offset.x) > 0.5 else { return }
    if animated {
      scrollView.setContentOffset(offset, animated: true)
    } else {
      scrollView.contentOffset = offset
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
      let progress = min(maxProgress, max(0, self.scrollView.contentOffset.x / self.bounds.width))
      if abs(progress - self.lastReportedProgress) < 0.001 { return }
      self.lastReportedProgress = progress
      self.onPageScroll(["progress": progress])
    }
  }

  private func emitSelected() {
    emitOnMain { [weak self] in
      guard let self, self.window != nil else { return }
      let next = self.currentPageFromOffset()
      self.page = next
      guard self.lastReportedPage != next else { return }
      self.lastReportedPage = next
      self.onPageSelected(["page": next])
    }
  }

  private func currentPageFromOffset() -> Int {
    guard bounds.width > 0 else { return 0 }
    return clampPage(Int((scrollView.contentOffset.x / bounds.width).rounded()))
  }

  private func clampPage(_ value: Int) -> Int {
    guard !pages.isEmpty else { return 0 }
    return min(max(value, 0), pages.count - 1)
  }
}
