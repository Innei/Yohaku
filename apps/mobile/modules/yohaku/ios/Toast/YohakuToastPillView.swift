import UIKit

final class YohakuToastPillView: UIView {
  var onDismiss: ((YohakuToastPillView, Bool) -> Void)?

  private let blur = UIVisualEffectView()
  private let glyph = UIView()
  private let check = UIImageView()
  private let label = UILabel()
  private let close = UIButton(type: .system)
  private var timer: Timer?
  private var dragStart: CGPoint = .zero
  private let maxLabelWidth: CGFloat

  init(message: String, maxWidth: CGFloat) {
    maxLabelWidth = max(80, maxWidth - 72)
    super.init(frame: .zero)
    clipsToBounds = true
    layer.cornerCurve = .continuous

    installBlur()
    addSubview(blur)

    glyph.backgroundColor = .systemGreen
    glyph.clipsToBounds = true
    addSubview(glyph)

    check.image = UIImage(systemName: "checkmark")?
      .withConfiguration(
        UIImage.SymbolConfiguration(pointSize: 11, weight: .bold)
      )
    check.tintColor = .white
    check.contentMode = .center
    glyph.addSubview(check)

    label.text = message
    label.font = .systemFont(ofSize: 13, weight: .medium)
    label.textColor = .label
    label.numberOfLines = 3
    addSubview(label)

    let closeImage = UIImage(systemName: "xmark.circle.fill")?
      .withConfiguration(
        UIImage.SymbolConfiguration(pointSize: 18, weight: .regular)
      )
    close.setImage(closeImage, for: .normal)
    close.tintColor = .tertiaryLabel
    close.addTarget(self, action: #selector(tapClose), for: .touchUpInside)
    addSubview(close)

    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan))
    addGestureRecognizer(pan)
    restartTimer()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  deinit {
    timer?.invalidate()
  }

  func fittedSize() -> CGSize {
    let text = label.sizeThatFits(
      CGSize(width: maxLabelWidth, height: 16 * 3)
    )
    let height = max(36, text.height + 16)
    let width = min(
      6 + 24 + 8 + ceil(text.width) + 4 + 28 + 6,
      maxLabelWidth + 72
    )
    return CGSize(width: max(width, 120), height: height)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    layer.cornerRadius = bounds.height / 2
    blur.frame = bounds
    sendSubviewToBack(blur)
    glyph.frame = CGRect(x: 6, y: (bounds.height - 24) / 2, width: 24, height: 24)
    glyph.layer.cornerRadius = 12
    check.frame = glyph.bounds
    close.frame = CGRect(
      x: bounds.width - 34,
      y: (bounds.height - 28) / 2,
      width: 28,
      height: 28
    )
    let labelX: CGFloat = 38
    let labelW = max(0, close.frame.minX - 4 - labelX)
    let text = label.sizeThatFits(CGSize(width: labelW, height: bounds.height))
    label.frame = CGRect(
      x: labelX,
      y: (bounds.height - text.height) / 2,
      width: labelW,
      height: text.height
    )
  }

  func restartTimer() {
    timer?.invalidate()
    timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: false) { [weak self] _ in
      guard let self else { return }
      self.onDismiss?(self, false)
    }
  }

  func clearTimer() {
    timer?.invalidate()
    timer = nil
  }

  private func installBlur() {
    blur.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    #if compiler(>=6.2)
      if #available(iOS 26.0, *) {
        blur.effect = UIGlassEffect(style: .regular)
        return
      }
    #endif
    blur.effect = UIBlurEffect(style: .systemThinMaterial)
  }

  @objc private func tapClose() {
    onDismiss?(self, false)
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    let translation = gesture.translation(in: superview)
    switch gesture.state {
    case .began:
      clearTimer()
      dragStart = center
    case .changed:
      let upward = min(0, translation.y)
      let resist = translation.y > 0 ? translation.y / (translation.y + 120) * 40 : 0
      center = CGPoint(x: dragStart.x, y: dragStart.y + upward + resist)
    case .ended, .cancelled:
      let velocity = gesture.velocity(in: superview)
      if translation.y < -56 || velocity.y < -800 {
        onDismiss?(self, true)
      } else {
        UIView.animate(
          withDuration: 0.35,
          delay: 0,
          usingSpringWithDamping: 0.82,
          initialSpringVelocity: 0.4
        ) {
          self.center = self.dragStart
        }
        restartTimer()
      }
    default:
      break
    }
  }
}
