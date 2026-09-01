import UIKit

final class YohakuListFabricRailView: UIView {
  var accentColor = UIColor(red: 0.659, green: 0.478, blue: 0.239, alpha: 1)
  var compactHint = ""
  var deskColor = UIColor(red: 0.941, green: 0.937, blue: 0.922, alpha: 1)
  var expandedHint = ""
  var labelColor = UIColor(red: 0.471, green: 0.463, blue: 0.439, alpha: 1)
  var marks: [YohakuListFabricMarkSpec] = []
  var progress: CGFloat = 0
  var tickColor = UIColor(red: 0.816, green: 0.808, blue: 0.776, alpha: 1)
  var touchY: CGFloat = 0
  var onAdjust: ((CGFloat?) -> Void)?

  private var activeItemId = ""
  private var markFrames: [String: CGRect] = [:]
  private var olderVisible = CGRect.zero

  override init(frame: CGRect) {
    super.init(frame: frame)
    isOpaque = false
    backgroundColor = .clear
    isUserInteractionEnabled = false
    isAccessibilityElement = true
    accessibilityTraits = [.adjustable]
  }

  override var accessibilityFrame: CGRect {
    get {
      let width = max(railWidth, YohakuListFabricMetrics.minHitWidth)
      let strip = CGRect(
        x: bounds.maxX - width,
        y: olderVisible.minY,
        width: width,
        height: max(olderVisible.height, 1)
      )
      return UIAccessibility.convertToScreenCoordinates(strip, in: self)
    }
    set {}
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  var railWidth: CGFloat {
    let compact = YohakuListFabricMetrics.compactWidth
    let expanded = YohakuListFabricMetrics.expandedWidth
    return compact + (expanded - compact) * progress
  }

  func update(
    activeItemId: String,
    markFrames: [String: CGRect],
    olderVisible: CGRect,
    progress: CGFloat,
    touchY: CGFloat
  ) {
    self.activeItemId = activeItemId
    self.markFrames = markFrames
    self.olderVisible = olderVisible
    self.progress = progress
    self.touchY = touchY
    isHidden = marks.isEmpty || olderVisible.height < 8
    accessibilityLabel = progress >= 0.5 ? expandedHint : compactHint
    setNeedsDisplay()
  }

  override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext(), !marks.isEmpty else { return }
    let width = railWidth
    let railMinX = bounds.maxX - width
    let fade = min(1, olderVisible.height / 28)
    guard fade > 0.02, width > 1 else { return }

    drawWash(in: context, railMinX: railMinX, fade: fade)

    for mark in marks {
      guard let frame = markFrames[mark.id] else { continue }
      let isYear = mark.kind == "year"
      let isActive = mark.itemId == activeItemId || mark.id == activeItemId
      let noteReveal = easeIn(progress)
      let labelAlpha: CGFloat = isYear
        ? mix(1, 0.42, progress) * fade
        : noteReveal * fade
      let tickAlpha: CGFloat = isYear
        ? fade
        : mix(0.55, 1, noteReveal) * fade

      let y = frame.midY
      guard y > olderVisible.minY - 20, y < olderVisible.maxY + 20 else { continue }

      let tickWidth: CGFloat = isYear ? 9 : 7
      let tickHeight: CGFloat = isActive ? 2 : (isYear ? 1.5 : 1 / contentScaleFactor)
      let tickRect = CGRect(
        x: railMinX + 6,
        y: y - tickHeight / 2,
        width: tickWidth,
        height: max(tickHeight, 1 / contentScaleFactor)
      )
      let tick = isActive ? accentColor : tickColor
      context.setFillColor(tick.withAlphaComponent(tickAlpha).cgColor)
      context.fill(tickRect)

      if isActive {
        let dot = CGRect(x: railMinX + 4, y: y - 2, width: 4, height: 4)
        context.setFillColor(deskColor.cgColor)
        context.fillEllipse(in: dot.insetBy(dx: -1.2, dy: -1.2))
        context.setStrokeColor(accentColor.withAlphaComponent(tickAlpha).cgColor)
        context.setLineWidth(1.2)
        context.strokeEllipse(in: dot)
      }

      guard labelAlpha > 0.04, !mark.label.isEmpty else { continue }
      let textColor = (isActive ? accentColor : labelColor)
        .withAlphaComponent(labelAlpha)
      let font = isYear
        ? serifFont(size: mix(11, 10, progress), weight: .medium)
        : UIFont.systemFont(ofSize: 10, weight: .regular)
      let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: textColor,
        .kern: isYear ? 1.2 : 0.4,
      ]
      let text = mark.label as NSString
      let textSize = text.size(withAttributes: attrs)
      let textOrigin = CGPoint(
        x: tickRect.maxX + 5,
        y: y - textSize.height / 2
      )
      let textRect = CGRect(origin: textOrigin, size: textSize)
      text.draw(with: textRect, options: .usesLineFragmentOrigin, attributes: attrs)
    }
  }

  override func accessibilityIncrement() {
    onAdjust?(1)
  }

  override func accessibilityDecrement() {
    onAdjust?(0)
  }

  override func accessibilityActivate() -> Bool {
    onAdjust?(nil)
    return true
  }

  private func drawWash(in context: CGContext, railMinX: CGFloat, fade: CGFloat) {
    let wash = CGRect(
      x: railMinX - 10,
      y: olderVisible.minY,
      width: bounds.maxX - railMinX + 10,
      height: olderVisible.height
    )
    let colors = [
      deskColor.withAlphaComponent(0).cgColor,
      deskColor.withAlphaComponent(0.72 * fade * mix(0.35, 0.92, progress)).cgColor,
      deskColor.withAlphaComponent(0.94 * fade * mix(0.2, 1, progress)).cgColor,
    ] as CFArray
    guard
      let gradient = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: colors,
        locations: [0, 0.42, 1]
      )
    else { return }
    context.saveGState()
    context.clip(to: wash)
    context.drawLinearGradient(
      gradient,
      start: CGPoint(x: wash.minX, y: wash.midY),
      end: CGPoint(x: wash.maxX, y: wash.midY),
      options: []
    )
    context.restoreGState()
  }
}

final class YohakuListFabricSettleDriver {
  var onFrame: ((CGFloat) -> Void)?
  var onRest: (() -> Void)?
  private(set) var position: CGFloat = 0
  private var displayLink: CADisplayLink?
  private var lastTimestamp: CFTimeInterval = 0
  private var target: CGFloat = 0
  private var velocity: CGFloat = 0

  func jump(to value: CGFloat) {
    stop()
    position = value
    velocity = 0
    target = value
  }

  func settle(to value: CGFloat, velocity initial: CGFloat) {
    target = value
    velocity = initial
    lastTimestamp = 0
    if displayLink == nil {
      let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
      link.add(to: .main, forMode: .common)
      displayLink = link
    }
  }

  func stop() {
    displayLink?.invalidate()
    displayLink = nil
    lastTimestamp = 0
  }

  @objc
  private func tick(_ link: CADisplayLink) {
    let dt: CGFloat
    if lastTimestamp == 0 {
      dt = 1 / 60
    } else {
      dt = min(1 / 30, CGFloat(link.timestamp - lastTimestamp))
    }
    lastTimestamp = link.timestamp

    let omega = YohakuListFabricMetrics.settleOmega
    let error = position - target
    let accel = -2 * omega * velocity - omega * omega * error
    velocity += accel * dt
    position += velocity * dt

    if abs(position - target) < 0.002, abs(velocity) < 0.03 {
      position = target
      velocity = 0
      stop()
      onFrame?(position)
      onRest?()
      return
    }
    onFrame?(position)
  }
}

private func mix(_ a: CGFloat, _ b: CGFloat, _ t: CGFloat) -> CGFloat {
  a + (b - a) * t
}

private func easeIn(_ t: CGFloat) -> CGFloat {
  t * t
}

private func serifFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
  let base = UIFont.systemFont(ofSize: size, weight: weight)
  guard let descriptor = base.fontDescriptor.withDesign(.serif) else { return base }
  return UIFont(descriptor: descriptor, size: size)
}
