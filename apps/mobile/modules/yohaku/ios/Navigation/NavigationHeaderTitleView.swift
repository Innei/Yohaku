import ExpoModulesCore

/// A two-line UIKit title for a React-owned `UINavigationItem.titleView`.
///
/// Colors are supplied by the app theme. The view does not sample or invert
/// scrolling content. On iOS 26, UIKit owns readability through the title
/// view's `UIScrollEdgeElementContainerInteraction`.
final class NavigationHeaderTitleView: ExpoView {
  private let hiddenTranslation: CGFloat = 6
  private let animatedContentView = UIView()
  private let titleLabel = UILabel()
  private let subtitleLabel = UILabel()
  private var titleFontSize: CGFloat = 16
  private var titleFontWeight: UIFont.Weight = .semibold
  private var subtitleFontSize: CGFloat = 12
  private var scrollEdgeInteraction: (any UIInteraction)?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    isOpaque = false

    animatedContentView.alpha = 0
    animatedContentView.backgroundColor = .clear
    animatedContentView.isOpaque = false
    animatedContentView.isUserInteractionEnabled = false
    animatedContentView.transform = CGAffineTransform(
      translationX: 0,
      y: hiddenTranslation
    )

    configure(
      titleLabel,
      color: .label,
      lineBreakMode: .byTruncatingTail
    )
    configure(
      subtitleLabel,
      color: .secondaryLabel,
      lineBreakMode: .byTruncatingTail
    )

    isAccessibilityElement = false
    accessibilityIdentifier = "navigation-header-title"
    accessibilityTraits = .header

    addSubview(animatedContentView)
    animatedContentView.addSubview(titleLabel)
    animatedContentView.addSubview(subtitleLabel)
    updateFonts()

    if #available(iOS 26.0, *) {
      // Add the interaction before UIKit installs the title view in the
      // navigation bar. Adding it after the first edge-effect snapshot leaves
      // the system blur inactive even after assigning the correct scroll view.
      let interaction = UIScrollEdgeElementContainerInteraction()
      interaction.edge = .top
      addInteraction(interaction)
      scrollEdgeInteraction = interaction
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    animatedContentView.frame = bounds

    let subtitleVisible = !(subtitleLabel.text ?? "").isEmpty
    if subtitleVisible {
      titleLabel.frame = CGRect(
        x: 0,
        y: 2,
        width: animatedContentView.bounds.width,
        height: 20
      )
      subtitleLabel.frame = CGRect(
        x: 0,
        y: 23,
        width: animatedContentView.bounds.width,
        height: 15
      )
    } else {
      titleLabel.frame = animatedContentView.bounds
      subtitleLabel.frame = .zero
    }

    attachSystemScrollEdgeInteraction()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    attachSystemScrollEdgeInteraction()
  }

  func setTitle(_ title: String) {
    titleLabel.text = title
    updateAccessibilityLabel()
  }

  func setProgress(_ value: Double) {
    let progress = min(1, max(0, CGFloat(value)))
    animatedContentView.alpha = progress
    animatedContentView.transform = CGAffineTransform(
      translationX: 0,
      y: (1 - progress) * hiddenTranslation
    )
    isAccessibilityElement = progress > 0
  }

  func setSubtitle(_ subtitle: String) {
    subtitleLabel.text = subtitle
    subtitleLabel.isHidden = subtitle.isEmpty
    updateAccessibilityLabel()
    setNeedsLayout()
  }

  func setTitleColor(_ color: UIColor?) {
    titleLabel.textColor = color ?? .label
  }

  func setSubtitleColor(_ color: UIColor?) {
    subtitleLabel.textColor = color ?? .secondaryLabel
  }

  func setTitleFontSize(_ size: Double) {
    titleFontSize = CGFloat(size)
    updateFonts()
  }

  func setTitleFontWeight(_ name: String) {
    switch name {
    case "bold":
      titleFontWeight = .bold
    case "heavy":
      titleFontWeight = .heavy
    case "medium":
      titleFontWeight = .medium
    default:
      titleFontWeight = .semibold
    }
    updateFonts()
  }

  func setSubtitleFontSize(_ size: Double) {
    subtitleFontSize = CGFloat(size)
    updateFonts()
  }

  private func configure(
    _ label: UILabel,
    color: UIColor,
    lineBreakMode: NSLineBreakMode
  ) {
    label.backgroundColor = .clear
    label.isAccessibilityElement = false
    label.isOpaque = false
    label.lineBreakMode = lineBreakMode
    label.numberOfLines = 1
    label.preferredVibrancy = .automatic
    label.textAlignment = .left
    label.textColor = color
  }

  private func updateFonts() {
    titleLabel.font = .systemFont(ofSize: titleFontSize, weight: titleFontWeight)
    subtitleLabel.font = .systemFont(ofSize: subtitleFontSize, weight: .regular)
  }

  private func updateAccessibilityLabel() {
    accessibilityLabel = [titleLabel.text, subtitleLabel.text]
      .compactMap { $0 }
      .filter { !$0.isEmpty }
      .joined(separator: ", ")
  }

  private func attachSystemScrollEdgeInteraction() {
    guard #available(iOS 26.0, *), window != nil else { return }
    guard
      let navigationBar = firstSuperview(of: UINavigationBar.self),
      let navigationController = findNavigationController(
        matching: navigationBar,
        from: window?.rootViewController
      ),
      let contentView = navigationController.topViewController?.view,
      let scrollView = findVerticalScrollView(in: contentView)
    else { return }

    guard
      let interaction =
        scrollEdgeInteraction as? UIScrollEdgeElementContainerInteraction
    else { return }

    guard interaction.scrollView !== scrollView else { return }
    // UIKit snapshots the container's descendants when the interaction joins
    // an on-screen hierarchy. Re-register once after the actual scroll view is
    // known so the two labels participate in the system edge-effect shape.
    interaction.scrollView = nil
    removeInteraction(interaction)
    addInteraction(interaction)
    interaction.edge = .top
    interaction.scrollView = scrollView
  }

  private func firstSuperview<View: UIView>(of type: View.Type) -> View? {
    var candidate = superview
    while let view = candidate {
      if let match = view as? View { return match }
      candidate = view.superview
    }
    return nil
  }

  private func findNavigationController(
    matching navigationBar: UINavigationBar,
    from controller: UIViewController?
  ) -> UINavigationController? {
    guard let controller else { return nil }
    if
      let navigationController = controller as? UINavigationController,
      navigationController.navigationBar === navigationBar
    {
      return navigationController
    }
    if
      let presented = controller.presentedViewController,
      let match = findNavigationController(
        matching: navigationBar,
        from: presented
      )
    {
      return match
    }
    for child in controller.children {
      if
        let match = findNavigationController(
          matching: navigationBar,
          from: child
        )
      {
        return match
      }
    }
    return nil
  }

  private func findVerticalScrollView(in view: UIView) -> UIScrollView? {
    if
      let scrollView = view as? UIScrollView,
      !scrollView.isHidden,
      scrollView.alpha > 0,
      scrollView.contentSize.height > scrollView.bounds.height
        || scrollView.alwaysBounceVertical
    {
      return scrollView
    }
    for child in view.subviews {
      if let scrollView = findVerticalScrollView(in: child) {
        return scrollView
      }
    }
    return nil
  }

}
