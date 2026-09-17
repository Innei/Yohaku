import ExpoModulesCore
import UIKit

private final class YohakuPagerFillView: UIView {
  override func layoutSubviews() {
    super.layoutSubviews()
    for subview in subviews {
      if subview.frame != bounds {
        subview.frame = bounds
      }
    }
  }
}

private final class YohakuPagerPageHost: UIViewController {
  let hosted: UIView

  init(hosted: UIView) {
    self.hosted = hosted
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func loadView() {
    let fill = YohakuPagerFillView()
    fill.backgroundColor = .clear
    fill.addSubview(hosted)
    view = fill
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    hosted.frame = view.bounds
  }
}

final class YohakuPagerView: ExpoView, UIPageViewControllerDataSource, UIPageViewControllerDelegate {
  let onPageScroll = EventDispatcher()
  let onPageSelected = EventDispatcher()

  private let containerController = UIViewController()
  private let pageController = UIPageViewController(
    transitionStyle: .scroll,
    navigationOrientation: .horizontal,
    options: nil
  )
  private var hosts: [YohakuPagerPageHost] = []
  private var page = 0
  private var lastReportedPage = 0
  private var pagingOffsetObservation: NSKeyValueObservation?
  private weak var pagingScrollView: UIScrollView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    pageController.dataSource = self
    pageController.delegate = self
    pageController.view.backgroundColor = .clear
    containerController.addChild(pageController)
    pageController.didMove(toParent: containerController)
    setValue(pageController.view, forKey: "contentView")
  }

  deinit {
    pagingOffsetObservation?.invalidate()
    pageController.willMove(toParent: nil)
    pageController.removeFromParent()
  }

  func setPage(_ value: Double) {
    let clamped = clampPage(Int(value.rounded()))
    let animated = window != nil && lastReportedPage != clamped && !hosts.isEmpty
    showPage(clamped, animated: animated)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      detachPagingScrollView()
      return
    }
    attachPagingScrollView()
    syncSafeArea()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    syncSafeArea()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    pageController.view.frame = bounds
    syncSafeArea()
    hosts.forEach { $0.view.setNeedsLayout() }
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    let insertAt = min(max(index, 0), hosts.count)
    let host = YohakuPagerPageHost(hosted: childComponentView)
    hosts.insert(host, at: insertAt)
    if hosts.count == 1 {
      showPage(0, animated: false)
    } else if insertAt <= page {
      showPage(clampPage(page + 1), animated: false)
    }
    attachPagingScrollView()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    let match = hosts.firstIndex { $0.hosted === childComponentView }
    let removeAt = match ?? index
    if removeAt >= 0, removeAt < hosts.count {
      let host = hosts.remove(at: removeAt)
      host.hosted.removeFromSuperview()
      host.willMove(toParent: nil)
      host.removeFromParent()
    }
    if hosts.isEmpty {
      detachPagingScrollView()
      return
    }
    showPage(clampPage(page), animated: false)
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerBefore viewController: UIViewController
  ) -> UIViewController? {
    guard let index = hosts.firstIndex(where: { $0 === viewController }), index > 0 else {
      return nil
    }
    return hosts[index - 1]
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerAfter viewController: UIViewController
  ) -> UIViewController? {
    guard let index = hosts.firstIndex(where: { $0 === viewController }), index + 1 < hosts.count
    else {
      return nil
    }
    return hosts[index + 1]
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    didFinishAnimating finished: Bool,
    previousViewControllers: [UIViewController],
    transitionCompleted completed: Bool
  ) {
    guard completed,
      let visible = pageViewController.viewControllers?.first,
      let index = hosts.firstIndex(where: { $0 === visible })
    else { return }
    page = index
    emitSelected()
  }

  private func showPage(_ index: Int, animated: Bool) {
    let clamped = clampPage(index)
    guard hosts.indices.contains(clamped) else { return }
    if pageController.viewControllers?.first === hosts[clamped] {
      page = clamped
      return
    }
    let direction: UIPageViewController.NavigationDirection =
      clamped >= page ? .forward : .reverse
    page = clamped
    pageController.setViewControllers(
      [hosts[clamped]],
      direction: direction,
      animated: animated
    ) { [weak self] finished in
      guard let self, finished else { return }
      self.emitSelected()
    }
    if !animated {
      emitSelected()
    }
  }

  private func attachPagingScrollView() {
    let scroll = pageController.view.subviews.first { $0 is UIScrollView } as? UIScrollView
    scroll?.contentInsetAdjustmentBehavior = .never
    scroll?.contentInset = .zero
    scroll?.scrollIndicatorInsets = .zero
    guard pagingScrollView !== scroll else { return }
    pagingScrollView = scroll
    pagingOffsetObservation?.invalidate()
    pagingOffsetObservation = scroll?.observe(\.contentOffset, options: [.new]) { [weak self] _, _ in
      self?.emitProgress()
    }
  }

  private func syncSafeArea() {
    let insets = safeAreaInsets
    if pageController.additionalSafeAreaInsets != insets {
      pageController.additionalSafeAreaInsets = insets
    }
  }

  private func detachPagingScrollView() {
    pagingOffsetObservation?.invalidate()
    pagingOffsetObservation = nil
    pagingScrollView = nil
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
      guard let self, self.window != nil, let scroll = self.pagingScrollView, scroll.bounds.width > 0
      else { return }
      let relative = scroll.contentOffset.x / scroll.bounds.width - 1
      let maxProgress = max(0, CGFloat(self.hosts.count) - 1)
      let progress = min(maxProgress, max(0, CGFloat(self.page) + relative))
      self.onPageScroll(["progress": progress])
    }
  }

  private func emitSelected() {
    emitOnMain { [weak self] in
      guard let self, self.window != nil, self.lastReportedPage != self.page else { return }
      self.lastReportedPage = self.page
      self.onPageSelected(["page": self.page])
    }
  }

  private func clampPage(_ value: Int) -> Int {
    guard !hosts.isEmpty else { return 0 }
    return min(max(value, 0), hosts.count - 1)
  }

}
