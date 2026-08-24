import ExpoModulesCore
import UIKit

final class TicketStubView: ExpoView {
  private let fillLayer = CALayer()
  private var cornerRadius: CGFloat = 18
  private var divisions = 3
  private var fillColor = UIColor.secondarySystemGroupedBackground
  private var notchRadius: CGFloat = 5

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    isOpaque = false
    clipsToBounds = false
    layer.masksToBounds = false

    fillLayer.contentsScale = UIScreen.main.scale
    fillLayer.masksToBounds = false
    fillLayer.zPosition = -1
    layer.insertSublayer(fillLayer, at: 0)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if fillLayer.superlayer !== layer {
      layer.insertSublayer(fillLayer, at: 0)
    }
    fillLayer.zPosition = -1
    redrawFill()
  }

  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) {
      setNeedsLayout()
    }
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
    fillColor = color ?? .secondarySystemGroupedBackground
    setNeedsLayout()
  }

  func setNotchRadius(_ radius: Double) {
    notchRadius = max(0, CGFloat(radius))
    setNeedsLayout()
  }

  func setShadowColor(_ color: UIColor?) {
    fillLayer.shadowColor = (color ?? UIColor.black).cgColor
  }

  func setShadowOffsetY(_ offset: Double) {
    fillLayer.shadowOffset = CGSize(width: 0, height: CGFloat(offset))
  }

  func setShadowOpacity(_ opacity: Double) {
    fillLayer.shadowOpacity = Float(min(1, max(0, opacity)))
  }

  func setShadowRadius(_ radius: Double) {
    fillLayer.shadowRadius = max(0, CGFloat(radius))
  }

  private func redrawFill() {
    let size = bounds.size
    fillLayer.frame = bounds
    guard size.width > 0, size.height > 0 else {
      fillLayer.contents = nil
      return
    }

    let resolvedFill = fillColor.resolvedColor(with: traitCollection)
    let format = UIGraphicsImageRendererFormat()
    format.opaque = false
    format.scale = UIScreen.main.scale
    let image = UIGraphicsImageRenderer(size: size, format: format).image { ctx in
      let cg = ctx.cgContext
      let rect = CGRect(origin: .zero, size: size)
      let radius = min(cornerRadius, rect.width / 2, rect.height / 2)
      let rounded = CGPath(
        roundedRect: rect,
        cornerWidth: radius,
        cornerHeight: radius,
        transform: nil
      )
      cg.addPath(rounded)
      cg.clip()
      cg.addPath(rounded)
      if divisions > 1, notchRadius > 0 {
        let diameter = notchRadius * 2
        for index in 1..<divisions {
          let x = rect.width * CGFloat(index) / CGFloat(divisions)
          cg.addEllipse(
            in: CGRect(x: x - notchRadius, y: -notchRadius, width: diameter, height: diameter)
          )
          cg.addEllipse(
            in: CGRect(
              x: x - notchRadius,
              y: rect.height - notchRadius,
              width: diameter,
              height: diameter
            )
          )
        }
      }
      cg.setFillColor(resolvedFill.cgColor)
      cg.drawPath(using: .eoFill)
    }
    fillLayer.contentsScale = UIScreen.main.scale
    fillLayer.contents = image.cgImage
  }
}
