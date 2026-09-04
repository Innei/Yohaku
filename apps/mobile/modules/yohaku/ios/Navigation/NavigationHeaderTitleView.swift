import ExpoModulesCore

/// A two-line UIKit title for a React-owned `UINavigationItem.titleView`.
///
/// Colors are supplied by the app theme. The view does not sample or invert
/// scrolling content. Readability comes from the screen-owned variable blur.
final class NavigationHeaderTitleView: ExpoView {
  // iOS 26 `_UINavigationBarTitleTransitionSpec` defaults, reverse-engineered
  // from UIKitCore: fast spring on alpha + blur, slow spring on y, both
  // compressed by fling speed; only a hard fling earns visible bounce.
  private let maxScrollVelocity: CGFloat = 2000
  private let bounceFactor: CGFloat = 0.4
  private let minDurationFactor: CGFloat = 0.5
  private let fastDuration: CGFloat = 0.45
  private let slowDuration: CGFloat = 0.7
  private let hiddenBlurRadius: CGFloat = 4
  private let hiddenTranslation: CGFloat = 15
  private let positionDelay: CGFloat = 0.06

  private let animatedContentView = UIView()
  private let titleLabel = UILabel()
  private let subtitleLabel = UILabel()
  private var titleFontSize: CGFloat = 16
  private var titleFontWeight: UIFont.Weight = .semibold
  private var subtitleFontSize: CGFloat = 12
  private var gaussianFilter: NSObject?
  private var usesSystemAdaptiveTitleColor = false
  private var navigationForegroundColor: UIColor?

  private var scrollVelocity: CGFloat = 0
  private var hasVisibleState = false
  private var displayLink: CADisplayLink?
  private var transitionStart: CFTimeInterval = 0
  private var fadeDuration: CGFloat = 0.45
  private var positionDuration: CGFloat = 0.7
  private var transitionBounce: CGFloat = 0
  private var transitionTarget: CGFloat = 0

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

    // The system large-title handoff blurs the incoming bar title. Public API
    // has no animatable layer blur, so mirror it with CAFilter looked up at
    // runtime; when the class is unavailable the title still fades and rises.
    if let filterClass = NSClassFromString("CAFilter") as? NSObject.Type {
      let selector = NSSelectorFromString("filterWithType:")
      if filterClass.responds(to: selector),
        let filter = filterClass.perform(selector, with: "gaussianBlur")?
          .takeUnretainedValue() as? NSObject
      {
        gaussianFilter = filter
        animatedContentView.layer.setValue([filter], forKey: "filters")
      }
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    // frame is undefined while a transform is active; bounds + center keep
    // layout correct mid-transition.
    animatedContentView.bounds = CGRect(origin: .zero, size: bounds.size)
    animatedContentView.center = CGPoint(x: bounds.midX, y: bounds.midY)

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
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      stopDisplayLink()
    }
  }

  func setTitle(_ title: String) {
    titleLabel.text = title
    updateAccessibilityLabel()
  }

  func setScrollVelocity(_ value: Double) {
    scrollVelocity = CGFloat(value)
  }

  func setTitleVisible(_ visible: Bool) {
    let target: CGFloat = visible ? 1 : 0
    if hasVisibleState, target == transitionTarget { return }
    if !hasVisibleState || window == nil {
      hasVisibleState = true
      transitionTarget = target
      stopDisplayLink()
      applyTitle(position: target, fade: target)
      return
    }
    transitionTarget = target
    let t = min(abs(scrollVelocity) / maxScrollVelocity, 1)
    let factor = 1 - (1 - minDurationFactor) * t
    fadeDuration = factor * fastDuration
    positionDuration = factor * slowDuration
    transitionBounce = t * bounceFactor
    transitionStart = CACurrentMediaTime()
    if UIAccessibility.isReduceMotionEnabled {
      stopDisplayLink()
      applyTitle(position: target, fade: target)
      return
    }
    if displayLink == nil {
      let link = CADisplayLink(target: self, selector: #selector(stepTitleTransition))
      link.add(to: .main, forMode: .common)
      displayLink = link
    }
  }

  @objc private func stepTitleTransition() {
    let elapsed = CACurrentMediaTime() - transitionStart
    let positionElapsed = max(0, elapsed - positionDelay)
    var posP = springProgress(
      positionElapsed,
      duration: positionDuration,
      bounce: transitionBounce
    )
    var fadeP = springProgress(
      elapsed,
      duration: fadeDuration,
      bounce: transitionBounce
    )
    if transitionTarget == 0 {
      posP = 1 - posP
      fadeP = 1 - fadeP
    }
    applyTitle(position: posP, fade: fadeP)
    if elapsed > max(positionDuration, fadeDuration) * 3 {
      applyTitle(position: transitionTarget, fade: transitionTarget)
      stopDisplayLink()
    }
  }

  private func springProgress(
    _ t: CGFloat, duration: CGFloat, bounce: CGFloat
  ) -> CGFloat {
    // Settle-time solver: SwiftUI Spring(duration:bounce:)'s duration is the
    // perceptual settling time (ln(100) ≈ 4.6052), not 2π/ω.
    let settleConstant: CGFloat = 4.6052
    let zeta = max(1 - bounce, 0.02)
    let omegaN = settleConstant / (zeta * max(duration, 0.001))
    let clampedZeta = min(zeta, 0.999)
    let omegaD = omegaN * sqrt(1 - clampedZeta * clampedZeta)
    let decay = exp(-clampedZeta * omegaN * t)
    return 1 - decay * (
      cos(omegaD * t) + (clampedZeta * omegaN / omegaD) * sin(omegaD * t)
    )
  }

  private func applyTitle(position: CGFloat, fade: CGFloat) {
    let clampedFade = min(1, max(0, fade))
    animatedContentView.alpha = clampedFade
    animatedContentView.transform = CGAffineTransform(
      translationX: 0,
      y: (1 - position) * hiddenTranslation
    )
    if gaussianFilter != nil {
      animatedContentView.layer.setValue(
        (1 - clampedFade) * hiddenBlurRadius,
        forKeyPath: "filters.gaussianBlur.inputRadius"
      )
    }
    isAccessibilityElement = clampedFade > 0
  }

  private func stopDisplayLink() {
    displayLink?.invalidate()
    displayLink = nil
  }

  func setSubtitle(_ subtitle: String) {
    subtitleLabel.text = subtitle
    subtitleLabel.isHidden = subtitle.isEmpty
    updateAccessibilityLabel()
    setNeedsLayout()
  }

  func setTitleColor(_ color: UIColor?) {
    usesSystemAdaptiveTitleColor = color == nil
    titleLabel.textColor = navigationForegroundColor ?? color ?? .label
  }

  func setNavigationForegroundColor(_ color: UIColor?) {
    navigationForegroundColor = color
    if usesSystemAdaptiveTitleColor {
      titleLabel.textColor = color ?? .label
    }
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

}
