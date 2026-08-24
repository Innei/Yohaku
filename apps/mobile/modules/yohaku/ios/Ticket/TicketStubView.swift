import ExpoModulesCore
import UIKit

final class TicketStubView: ExpoView {
  private let fillView = UIView()
  private let maskLayer = CAShapeLayer()
  private var cornerRadius: CGFloat = 18
  private var divisions = 3
  private var notchRadius: CGFloat = 5

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    isOpaque = false
    backgroundColor = .clear
    clipsToBounds = false
    layer.masksToBounds = false

    fillView.isUserInteractionEnabled = false
    fillView.backgroundColor = .secondarySystemGroupedBackground
    fillView.layer.mask = maskLayer
    insertSubview(fillView, at: 0)

    maskLayer.fillRule = .evenOdd
    maskLayer.fillColor = UIColor.white.cgColor
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    fillView.frame = bounds
    sendSubviewToBack(fillView)
    redrawMask()
  }

  func setCornerRadius(_ radius: Double) {
    cornerRadius = max(0, CGFloat(radius))
    setNeedsLayout()
  }

  func setDivisions(_ count: Int) {
    divisions = max(1, count)
    setNeedsLayout()
  }

  func setFillColor(_ color: UIColor?) {
    fillView.backgroundColor = color ?? .secondarySystemGroupedBackground
  }

  func setNotchRadius(_ radius: Double) {
    notchRadius = max(0, CGFloat(radius))
    setNeedsLayout()
  }

  func setShadowColor(_ color: UIColor?) {
    fillView.layer.shadowColor = (color ?? UIColor.black).cgColor
  }

  func setShadowOffsetY(_ offset: Double) {
    fillView.layer.shadowOffset = CGSize(width: 0, height: CGFloat(offset))
  }

  func setShadowOpacity(_ opacity: Double) {
    fillView.layer.shadowOpacity = Float(min(1, max(0, opacity)))
  }

  func setShadowRadius(_ radius: Double) {
    fillView.layer.shadowRadius = max(0, CGFloat(radius))
  }

  private func redrawMask() {
    let size = bounds.size
    maskLayer.frame = bounds
    guard size.width > 0, size.height > 0 else {
      maskLayer.path = nil
      return
    }

    if divisions <= 1 {
      fillView.layer.mask = nil
      fillView.layer.cornerRadius = min(cornerRadius, size.width / 2, size.height / 2)
      fillView.layer.cornerCurve = .continuous
      fillView.layer.masksToBounds = true
      return
    }

    fillView.layer.cornerRadius = 0
    fillView.layer.masksToBounds = false
    fillView.layer.mask = maskLayer

    let rect = CGRect(origin: .zero, size: size)
    let radius = min(cornerRadius, rect.width / 2, rect.height / 2)
    let path = CGMutablePath()
    path.addRoundedRect(in: rect, cornerWidth: radius, cornerHeight: radius)
    if divisions > 1, notchRadius > 0 {
      let diameter = notchRadius * 2
      for index in 1..<divisions {
        let x = rect.width * CGFloat(index) / CGFloat(divisions)
        path.addEllipse(
          in: CGRect(x: x - notchRadius, y: -notchRadius, width: diameter, height: diameter)
        )
        path.addEllipse(
          in: CGRect(
            x: x - notchRadius,
            y: rect.height - notchRadius,
            width: diameter,
            height: diameter
          )
        )
      }
    }
    maskLayer.path = path
  }
}
