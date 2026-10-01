import UIKit

struct HeadingSpec {
  var size: CGFloat = 24
  var lineHeight: CGFloat = 30
  var spacingBefore: CGFloat = 0
  var spacingAfter: CGFloat = 24
  var weight: String = "bold"
  var fontFamily: String?
  var color: UIColor?

  init(_ dict: [String: Any]) {
    fontFamily = dict["fontFamily"] as? String
    if let v = dict["color"] as? String { color = UIColor(richHex: v) }
    if let v = dict["size"] as? Double { size = v }
    if let v = dict["lineHeight"] as? Double { lineHeight = v }
    if let v = dict["spacingBefore"] as? Double { spacingBefore = v }
    if let v = dict["spacingAfter"] as? Double { spacingAfter = v }
    if let v = dict["weight"] as? String { weight = v }
  }
}

struct RichTypography {
  var fontFamily: String?
  var fallbackFontFamily: String?
  var codeFontFamily: String?
  var fontSize: CGFloat = 18
  var lineHeight: CGFloat = 28
  var paragraphGap: CGFloat = 16
  var headings: [Int: HeadingSpec] = [:]
  var quoteFontFamily: String?
  var quoteFontSize: CGFloat = 15
  var quoteLineHeight: CGFloat = 24
  var quoteIndent: CGFloat = 28
  var quoteGap: CGFloat = 16
  var quoteItalic = true
  var quoteColor: UIColor?
  var quoteBarColor = UIColor.separator
  var listIndent: CGFloat = 24
  var listMarkerInset: CGFloat = 8
  var listTextInset: CGFloat = 28
  var listItemGap: CGFloat = 12
  var hrGap: CGFloat = 56
  var color = UIColor.label
  var secondaryColor = UIColor.secondaryLabel
  var mutedColor = UIColor.tertiaryLabel
  var paperColor = UIColor.systemBackground
  var linkColor = UIColor.link
  var accentColor = UIColor.tintColor
  var highlightColor = UIColor.systemYellow.withAlphaComponent(0.35)
  var codeBackground = UIColor.secondarySystemFill

  init(_ dict: [String: Any]) {
    fontFamily = dict["fontFamily"] as? String
    fallbackFontFamily = dict["fallbackFontFamily"] as? String
    codeFontFamily = dict["codeFontFamily"] as? String
    if let v = dict["fontSize"] as? Double { fontSize = v }
    if let v = dict["lineHeight"] as? Double { lineHeight = v }
    if let v = dict["paragraphGap"] as? Double { paragraphGap = v }
    if let specs = dict["headings"] as? [String: [String: Any]] {
      for (key, spec) in specs {
        if let level = Int(key) { headings[level] = HeadingSpec(spec) }
      }
    }
    if let quote = dict["quote"] as? [String: Any] {
      quoteFontFamily = quote["fontFamily"] as? String
      if let v = quote["fontSize"] as? Double { quoteFontSize = v }
      if let v = quote["lineHeight"] as? Double { quoteLineHeight = v }
      if let v = quote["indent"] as? Double { quoteIndent = v }
      if let v = quote["gap"] as? Double { quoteGap = v }
      if let v = quote["italic"] as? Bool { quoteItalic = v }
      if let v = quote["color"] as? String { quoteColor = UIColor(richHex: v) }
      if let v = quote["barColor"] as? String, let c = UIColor(richHex: v) { quoteBarColor = c }
    }
    if let list = dict["list"] as? [String: Any] {
      if let v = list["indent"] as? Double { listIndent = v }
      if let v = list["markerInset"] as? Double { listMarkerInset = v }
      if let v = list["textInset"] as? Double { listTextInset = v }
      if let v = list["itemGap"] as? Double { listItemGap = v }
    }
    if let v = dict["hrGap"] as? Double { hrGap = v }
    if let v = dict["color"] as? String, let c = UIColor(richHex: v) { color = c }
    if let v = dict["secondaryColor"] as? String, let c = UIColor(richHex: v) { secondaryColor = c }
    if let v = dict["mutedColor"] as? String, let c = UIColor(richHex: v) { mutedColor = c }
    if let v = dict["paperColor"] as? String, let c = UIColor(richHex: v) { paperColor = c }
    if let v = dict["linkColor"] as? String, let c = UIColor(richHex: v) { linkColor = c }
    if let v = dict["accentColor"] as? String, let c = UIColor(richHex: v) { accentColor = c }
    if let v = dict["highlightColor"] as? String, let c = UIColor(richHex: v) { highlightColor = c }
    if let v = dict["codeBackground"] as? String, let c = UIColor(richHex: v) { codeBackground = c }
  }

  // expo-font registers custom fonts under an alias that only resolves
  // through the swizzled `fontNames(forFamilyName:)`, never `UIFont(name:)`.
  static func resolve(_ family: String, size: CGFloat) -> UIFont? {
    if let font = UIFont(name: family, size: size) { return font }
    guard let name = UIFont.fontNames(forFamilyName: family).first else { return nil }
    return UIFont(name: name, size: size)
  }

  // No family means the system sans, which already cascades into PingFang.
  // A custom Latin primary (Georgia for en) must cascade into the CJK serif,
  // otherwise CoreText picks per-glyph system fallbacks and mixes fonts.
  func font(family: String?, size: CGFloat, weight: UIFont.Weight = .regular) -> (UIFont, fakeBold: Bool) {
    guard let family, let primary = Self.resolve(family, size: size) else {
      return (UIFont.systemFont(ofSize: size, weight: weight), false)
    }
    var resolved = primary
    var fakeBold = false
    if weight != .regular {
      let traits = primary.fontDescriptor.symbolicTraits.union(.traitBold)
      if let bold = primary.fontDescriptor.withSymbolicTraits(traits),
         UIFont(descriptor: bold, size: size).fontName != primary.fontName {
        resolved = UIFont(descriptor: bold, size: size)
      } else {
        fakeBold = true
      }
    }
    if let fallbackFamily = fallbackFontFamily,
       let fallback = Self.resolve(fallbackFamily, size: size),
       fallback.fontName != resolved.fontName {
      let descriptor = resolved.fontDescriptor.addingAttributes([.cascadeList: [fallback.fontDescriptor]])
      resolved = UIFont(descriptor: descriptor, size: size)
    }
    return (resolved, fakeBold)
  }

  func bodyFont(size: CGFloat? = nil) -> UIFont {
    font(family: fontFamily, size: size ?? fontSize).0
  }

  func codeFont(size: CGFloat) -> UIFont {
    if let family = codeFontFamily, let font = Self.resolve(family, size: size) { return font }
    return UIFont.monospacedSystemFont(ofSize: size, weight: .regular)
  }
}

extension UIColor {
  convenience init?(richHex hex: String) {
    var trimmed = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
    var alpha: CGFloat = 1
    if trimmed.count == 8 {
      var a: UInt64 = 0
      Scanner(string: String(trimmed.suffix(2))).scanHexInt64(&a)
      alpha = CGFloat(a) / 255
      trimmed = String(trimmed.prefix(6))
    }
    var value: UInt64 = 0
    guard trimmed.count == 6, Scanner(string: trimmed).scanHexInt64(&value) else { return nil }
    self.init(
      red: CGFloat((value >> 16) & 0xFF) / 255,
      green: CGFloat((value >> 8) & 0xFF) / 255,
      blue: CGFloat(value & 0xFF) / 255,
      alpha: alpha
    )
  }
}
