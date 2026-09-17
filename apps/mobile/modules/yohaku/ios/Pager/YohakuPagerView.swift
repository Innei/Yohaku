import ExpoModulesCore
import UIKit

final class YohakuPagerView: ExpoView, UIScrollViewDelegate {
  let onPageScroll = EventDispatcher()
  let onPageSelected = EventDispatcher()

  private let scrollView = UIScrollView()
  private var pages: [UIView] = []
  private var page = 0
  private var lastReportedPage = 0
  private var hasLaidOut = false

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
    scrollView.delegate = self
    addSubview(scrollView)
  }

  func setPage(_ value: Double) {
    let clamped = clampPage(Int(value.rounded()))
    let shouldAnimate =
      hasLaidOut && window != nil && !scrollView.isDragging && !scrollView.isDecelerating
    page = clamped
    scrollToCurrentPage(animated: shouldAnimate && lastReportedPage != clamped)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    let insertAt = min(max(index, 0), pages.count)
    pages.insert(childComponentView, at: insertAt)
    scrollView.insertSubview(childComponentView, at: insertAt)
    setNeedsLayout()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if index >= 0, index < pages.count, pages[index] === childComponentView {
      pages.remove(at: index)
    } else {
      pages.removeAll { $0 === childComponentView }
    }
    childComponentView.removeFromSuperview()
    page = clampPage(page)
    setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    scrollView.frame = bounds
    let width = bounds.width
    let height = bounds.height
    guard width > 0, height > 0 else { return }

    scrollView.contentSize = CGSize(width: width * CGFloat(pages.count), height: height)
    for (index, child) in pages.enumerated() {
      child.frame = CGRect(x: CGFloat(index) * width, y: 0, width: width, height: height)
    }
    page = clampPage(page)
    if !scrollView.isDragging, !scrollView.isDecelerating {
      scrollToCurrentPage(animated: false)
    }
    hasLaidOut = true
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

  private func emitProgress() {
    guard bounds.width > 0 else { return }
    let maxProgress = max(0, CGFloat(pages.count) - 1)
    let progress = min(maxProgress, max(0, scrollView.contentOffset.x / bounds.width))
    onPageScroll(["progress": progress])
  }

  private func emitSelected() {
    let next = currentPageFromOffset()
    page = next
    guard lastReportedPage != next else { return }
    lastReportedPage = next
    onPageSelected(["page": next])
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
