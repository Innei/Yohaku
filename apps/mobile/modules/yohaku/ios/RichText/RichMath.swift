import SwiftMath
import UIKit

extension NSAttributedString.Key {
  static let richMath = NSAttributedString.Key("YohakuRichMath")
  static let richMathScale = NSAttributedString.Key("YohakuRichMathScale")
}

final class RichMathBox {
  let latex: String
  let display: MTMathListDisplay
  let size: CGSize
  let baseline: CGFloat

  init(latex: String, display: MTMathListDisplay, size: CGSize, baseline: CGFloat) {
    self.latex = latex
    self.display = display
    self.size = size
    self.baseline = baseline
  }
}

// Attributed strings get archived by UIKit on copy and drag, so the attribute carries an
// NSString key into this registry instead of the (non-codable) typeset display itself.
enum RichMath {
  private static let blankImage = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { _ in }
  private static var registry: [String: RichMathBox] = [:]
  private static var failures = Set<String>()

  static func box(forKey key: String) -> RichMathBox? {
    registry[key]
  }

  static func box(latex: String, fontSize: CGFloat, color: UIColor, mode: MTMathUILabelMode) -> (key: String, box: RichMathBox)? {
    let components = color.cgColor.components?.map { String(format: "%.3f", $0) }.joined(separator: ",") ?? ""
    let key = "\(mode == .display ? "d" : "t")|\(fontSize)|\(components)|\(latex)"
    if let cached = registry[key] { return (key, cached) }
    if failures.contains(key) { return nil }
    let label = MTMathUILabel()
    label.labelMode = mode
    label.fontSize = fontSize
    label.textColor = color
    label.latex = latex
    let size = label.intrinsicContentSize
    guard label.error == nil, size.width > 0, size.height > 0 else {
      failures.insert(key)
      return nil
    }
    label.frame = CGRect(origin: .zero, size: size)
    label.layoutSubviews()
    guard let display = label.displayList else {
      failures.insert(key)
      return nil
    }
    let inkHeight = max(display.ascent + display.descent, fontSize / 2)
    let baseline = (size.height - inkHeight) / 2 + display.descent
    let box = RichMathBox(latex: latex, display: display, size: size, baseline: baseline)
    registry[key] = box
    return (key, box)
  }

  static func attachment(
    latex: String,
    fontSize: CGFloat,
    color: UIColor,
    mode: MTMathUILabelMode,
    attributes: [NSAttributedString.Key: Any]
  ) -> NSAttributedString? {
    guard let (key, box) = box(latex: latex, fontSize: fontSize, color: color, mode: mode) else { return nil }
    let attachment = NSTextAttachment()
    attachment.image = blankImage
    attachment.bounds = bounds(of: box, scale: 1, onBaseline: mode == .display)
    let string = NSMutableAttributedString(attachment: attachment)
    var merged = attributes
    merged[.richMath] = key as NSString
    string.addAttributes(merged, range: NSRange(location: 0, length: string.length))
    return string
  }

  // TextKit 1 does not grow a line for an attachment's negative origin, so tall display math
  // sits entirely on the baseline; inline math keeps its descent to line up with the text.
  static func bounds(of box: RichMathBox, scale: CGFloat, onBaseline: Bool) -> CGRect {
    CGRect(
      x: 0,
      y: onBaseline ? 0 : -box.baseline * scale,
      width: box.size.width * scale,
      height: box.size.height * scale
    )
  }

  static func plainText(of text: NSAttributedString) -> String {
    let result = NSMutableString(string: text.string)
    text.enumerateAttribute(.richMath, in: NSRange(location: 0, length: text.length), options: .reverse) { value, range, _ in
      guard let key = value as? String, let box = registry[key] else { return }
      result.replaceCharacters(in: range, with: String(repeating: box.latex, count: range.length))
    }
    return result as String
  }

  // SwiftMath lays out in a y-up space from the box's bottom-left corner.
  // UIKit text drawing leaves a flipped text matrix behind, and the text matrix is not part of
  // the saved graphics state, so it is reset and restored by hand.
  static func draw(_ box: RichMathBox, scale: CGFloat, bottomLeft point: CGPoint, in context: CGContext) {
    let textMatrix = context.textMatrix
    context.saveGState()
    context.textMatrix = .identity
    context.translateBy(x: point.x, y: point.y)
    context.scaleBy(x: scale, y: -scale)
    box.display.draw(context)
    context.restoreGState()
    context.textMatrix = textMatrix
  }
}
