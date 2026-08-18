import ExpoModulesCore
import WebKit

final class ScrollEdgeContainerView: ExpoView {
  var edge: UIRectEdge = .top {
    didSet { attach() }
  }

  private var interaction: (any UIInteraction)?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    isOpaque = false
  }

  func setEdgeName(_ name: String) {
    edge = name == "bottom" ? .bottom : .top
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    attach()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    attach()
  }

  private func attach() {
    guard #available(iOS 26.0, *), window != nil else { return }
    // Setting UIScrollView.topEdgeEffect is not enough — iOS 26 only
    // composites the soft edge under a registered overlay container.
    guard let scrollView = findSiblingScrollView() else { return }

    if let existing = interaction as? UIScrollEdgeElementContainerInteraction {
      existing.scrollView = scrollView
      existing.edge = edge
      return
    }

    let next = UIScrollEdgeElementContainerInteraction()
    next.scrollView = scrollView
    next.edge = edge
    addInteraction(next)
    interaction = next
  }

  private func findSiblingScrollView() -> UIScrollView? {
    guard let parent = superview else { return nil }
    for child in parent.subviews where child !== self {
      if let found = search(child) { return found }
    }
    return nil
  }

  private func search(_ view: UIView) -> UIScrollView? {
    if let scroll = view as? UIScrollView { return scroll }
    if let web = view as? WKWebView { return web.scrollView }
    for child in view.subviews {
      if let found = search(child) { return found }
    }
    return nil
  }
}
