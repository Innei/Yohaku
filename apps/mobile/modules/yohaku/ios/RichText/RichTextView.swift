import ExpoModulesCore
import UIKit

extension NSAttributedString.Key {
  static let richBlockId = NSAttributedString.Key("YohakuRichBlockId")
  static let richHighlightId = NSAttributedString.Key("YohakuRichHighlightId")
  static let richSpoiler = NSAttributedString.Key("YohakuRichSpoiler")
  static let richQuote = NSAttributedString.Key("YohakuRichQuote")
  static let richRule = NSAttributedString.Key("YohakuRichRule")
}

struct HeadingSpec {
  var size: CGFloat = 24
  var lineHeight: CGFloat = 30
  var spacingBefore: CGFloat = 0
  var spacingAfter: CGFloat = 24
  var weight: String = "bold"

  init(_ dict: [String: Any]) {
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
  var listIndent: CGFloat = 24
  var listMarkerInset: CGFloat = 8
  var listTextInset: CGFloat = 28
  var listItemGap: CGFloat = 12
  var hrGap: CGFloat = 56
  var color = UIColor.label
  var secondaryColor = UIColor.secondaryLabel
  var linkColor = UIColor.link
  var accentColor = UIColor.tintColor
  var highlightColor = UIColor.systemYellow.withAlphaComponent(0.35)
  var activeHighlightColor = UIColor.systemYellow.withAlphaComponent(0.7)
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
    if let v = dict["linkColor"] as? String, let c = UIColor(richHex: v) { linkColor = c }
    if let v = dict["accentColor"] as? String, let c = UIColor(richHex: v) { accentColor = c }
    if let v = dict["highlightColor"] as? String, let c = UIColor(richHex: v) { highlightColor = c }
    if let v = dict["activeHighlightColor"] as? String, let c = UIColor(richHex: v) {
      activeHighlightColor = c
    }
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

// Offsets crossing the bridge count each inline formula at its LaTeX length, while the
// text storage holds it as a single attachment character.
struct BlockRange {
  let id: String
  let range: NSRange
  var collapsed: [(offset: Int, sourceLength: Int)] = []

  var sourceLength: Int {
    collapsed.reduce(range.length) { $0 + $1.sourceLength - 1 }
  }

  func rendered(fromSource offset: Int, roundUp: Bool) -> Int {
    var shift = 0
    for item in collapsed {
      let sourceStart = item.offset + shift
      if offset <= sourceStart { break }
      if offset < sourceStart + item.sourceLength { return item.offset + (roundUp ? 1 : 0) }
      shift += item.sourceLength - 1
    }
    return offset - shift
  }

  func source(fromRendered offset: Int) -> Int {
    collapsed.reduce(offset) { $1.offset < offset ? $0 + $1.sourceLength - 1 : $0 }
  }
}

final class RichLayoutManager: NSLayoutManager {
  var quoteColor = UIColor.secondaryLabel
  var ruleColor = UIColor.separator

  override func drawBackground(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
    super.drawBackground(forGlyphRange: glyphsToShow, at: origin)
    guard let storage = textStorage, let context = UIGraphicsGetCurrentContext() else { return }
    let characters = characterRange(forGlyphRange: glyphsToShow, actualGlyphRange: nil)

    storage.enumerateAttribute(.richQuote, in: characters) { value, range, _ in
      guard value != nil else { return }
      let glyphs = self.glyphRange(forCharacterRange: range, actualCharacterRange: nil)
      context.setFillColor(self.quoteColor.cgColor)
      self.enumerateLineFragments(forGlyphRange: glyphs) { rect, _, _, _, _ in
        context.fill(CGRect(x: origin.x, y: rect.minY + origin.y, width: 2, height: rect.height))
      }
    }

    storage.enumerateAttribute(.richRule, in: characters) { value, range, _ in
      guard value != nil else { return }
      let glyphs = self.glyphRange(forCharacterRange: range, actualCharacterRange: nil)
      context.setFillColor(((value as? UIColor) ?? self.ruleColor).cgColor)
      self.enumerateLineFragments(forGlyphRange: glyphs) { rect, _, container, _, _ in
        context.fill(CGRect(x: origin.x, y: rect.midY + origin.y, width: container.size.width, height: 1))
      }
    }
  }

  override func drawGlyphs(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
    super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)
    guard let storage = textStorage, let context = UIGraphicsGetCurrentContext() else { return }
    let characters = characterRange(forGlyphRange: glyphsToShow, actualGlyphRange: nil)
    storage.enumerateAttribute(.richMath, in: characters) { value, range, _ in
      guard let key = value as? String, let box = RichMath.box(forKey: key) else { return }
      let scale = CGFloat((storage.attribute(.richMathScale, at: range.location, effectiveRange: nil) as? NSNumber)?.doubleValue ?? 1)
      for index in range.location..<NSMaxRange(range) {
        let glyph = self.glyphIndexForCharacter(at: index)
        let line = self.lineFragmentRect(forGlyphAt: glyph, effectiveRange: nil)
        let location = self.location(forGlyphAt: glyph)
        let offset = (storage.attribute(.attachment, at: index, effectiveRange: nil) as? NSTextAttachment)?.bounds.minY ?? 0
        RichMath.draw(
          box,
          scale: scale,
          bottomLeft: CGPoint(x: origin.x + line.minX + location.x, y: origin.y + line.minY + location.y - offset),
          in: context
        )
      }
    }
  }
}

private final class RichTextContentView: UITextView {
  var revealedSpoilers = Set<Int>()

  override func copy(_ sender: Any?) {
    guard selectedRange.length > 0 else { return super.copy(sender) }
    UIPasteboard.general.string = RichMath.plainText(of: attributedText.attributedSubstring(from: selectedRange))
  }
}

final class RichTextView: ExpoView, UITextViewDelegate, UIGestureRecognizerDelegate {
  let onMenuAction = EventDispatcher()
  let onLinkPress = EventDispatcher()
  let onHighlightPress = EventDispatcher()
  let onContentHeight = EventDispatcher()
  let onBlockRects = EventDispatcher()
  let onSelectionActive = EventDispatcher()
  private var selectionActive = false

  private let textView: RichTextContentView
  private let layoutManager: RichLayoutManager
  private var blocks: [[String: Any]] = []
  private var highlights: [[String: Any]] = []
  private var menuItems: [[String: Any]] = []
  private var typography = RichTypography([:])
  private var blockRanges: [BlockRange] = []
  private var reportedHeight: CGFloat = -1
  private var layoutWidth: CGFloat = -1

  required init(appContext: AppContext? = nil) {
    // An explicit TextKit 1 stack keeps layoutManager available for the
    // decoration pass in drawBackground. The `usingTextLayoutManager:` factory is an
    // ObjC class method that skips Swift stored-property initialisation.
    let storage = NSTextStorage()
    let layout = RichLayoutManager()
    let container = NSTextContainer(size: .zero)
    layoutManager = layout
    // TextKit adds font leading on top of maximumLineHeight; Hiragino's 0.5em leading turned 28pt lines into 37pt.
    layout.usesFontLeading = false
    container.widthTracksTextView = true
    storage.addLayoutManager(layout)
    layout.addTextContainer(container)
    textView = RichTextContentView(frame: .zero, textContainer: container)
    super.init(appContext: appContext)
    textView.isEditable = false
    textView.isScrollEnabled = false
    textView.isSelectable = true
    textView.backgroundColor = .clear
    textView.textContainerInset = .zero
    textView.textContainer.lineFragmentPadding = 0
    textView.dataDetectorTypes = []
    textView.delegate = self
    textView.contentInsetAdjustmentBehavior = .never
    addSubview(textView)

    let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    tap.delegate = self
    textView.addGestureRecognizer(tap)
  }

  func setBlocks(_ value: [[String: Any]]) {
    blocks = value
    rebuild()
  }

  func setHighlights(_ value: [[String: Any]]) {
    highlights = value
    rebuild()
  }

  func setMenuItems(_ value: [[String: Any]]) {
    menuItems = value
  }

  func setTypography(_ value: [String: Any]) {
    typography = RichTypography(value)
    textView.tintColor = typography.accentColor
    textView.linkTextAttributes = [
      .foregroundColor: typography.linkColor,
      .underlineStyle: NSUnderlineStyle.single.rawValue,
      .underlineColor: typography.linkColor.withAlphaComponent(0.4),
    ]
    layoutManager.quoteColor = typography.secondaryColor.withAlphaComponent(0.5)
    layoutManager.ruleColor = typography.secondaryColor.withAlphaComponent(0.3)
    rebuild()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    textView.frame = bounds
    if bounds.width != layoutWidth {
      layoutWidth = bounds.width
      reportHeight()
    }
  }

  private func reportHeight() {
    guard bounds.width > 0 else { return }
    let size = textView.sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude))
    let height = ceil(size.height)
    if height != reportedHeight {
      reportedHeight = height
      onContentHeight(["height": height])
    }
    reportBlockRects()
  }

  private func reportBlockRects() {
    let layout = textView.layoutManager
    let container = textView.textContainer
    layout.ensureLayout(for: container)
    let rects: [[String: Any]] = blockRanges.map { block in
      let glyphs = layout.glyphRange(forCharacterRange: block.range, actualCharacterRange: nil)
      let bounds = layout.boundingRect(forGlyphRange: glyphs, in: container)
      return ["id": block.id, "y": bounds.minY, "height": bounds.height]
    }
    onBlockRects(["rects": rects])
  }

  private func rebuild() {
    let (result, ranges) = RichAttributedBuilder.build(
      blocks: blocks,
      typography: typography,
      revealedSpoilers: textView.revealedSpoilers
    )

    for highlight in highlights {
      guard let blockId = highlight["blockId"] as? String,
            let start = highlight["start"] as? Int,
            let end = highlight["end"] as? Int,
            let block = ranges.first(where: { $0.id == blockId }) else { continue }
      let clampedStart = block.rendered(fromSource: max(0, min(start, block.sourceLength)), roundUp: false)
      let clampedEnd = max(clampedStart, block.rendered(fromSource: max(0, min(end, block.sourceLength)), roundUp: true))
      let range = NSRange(location: block.range.location + clampedStart, length: clampedEnd - clampedStart)
      guard range.length > 0 else { continue }
      let kind = highlight["kind"] as? String ?? "comment"
      let color: UIColor
      switch kind {
      case "active": color = typography.activeHighlightColor
      case "block": color = typography.accentColor.withAlphaComponent(0.08)
      default: color = typography.highlightColor
      }
      result.addAttribute(.backgroundColor, value: color, range: range)
      if let id = highlight["id"] as? String {
        result.addAttribute(.richHighlightId, value: id, range: range)
      }
    }

    blockRanges = ranges
    textView.attributedText = result
    reportedHeight = -1
    reportHeight()
  }

  private func locate(_ location: Int) -> [String: Any] {
    for block in blockRanges {
      let end = block.range.location + block.range.length
      if location >= block.range.location && location <= end {
        return ["blockId": block.id, "offset": block.source(fromRendered: location - block.range.location)]
      }
    }
    return ["blockId": "", "offset": 0]
  }

  private func selectionPayload() -> [String: Any] {
    let selected = textView.selectedRange
    let text = RichMath.plainText(of: textView.attributedText.attributedSubstring(from: selected))
    return [
      "text": text,
      "start": locate(selected.location),
      "end": locate(selected.location + selected.length),
    ]
  }

  @objc private func handleTap(_ recognizer: UITapGestureRecognizer) {
    guard textView.selectedRange.length == 0 else { return }
    let point = recognizer.location(in: textView)
    let index = textView.layoutManager.characterIndex(for: point, in: textView.textContainer, fractionOfDistanceBetweenInsertionPoints: nil)
    guard index < textView.attributedText.length else { return }
    let attributes = textView.attributedText.attributes(at: index, effectiveRange: nil)
    if let spoiler = attributes[.richSpoiler] as? Int {
      textView.revealedSpoilers.insert(spoiler)
      rebuild()
      return
    }
    if let id = attributes[.richHighlightId] as? String {
      onHighlightPress(["id": id])
    }
  }

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    true
  }

  func textViewDidChangeSelection(_ textView: UITextView) {
    let active = textView.selectedRange.length > 0
    guard active != selectionActive else { return }
    selectionActive = active
    onSelectionActive(["active": active])
  }

  func textView(_ textView: UITextView, menuConfigurationFor textItem: UITextItem, defaultMenu: UIMenu) -> UITextItem.MenuConfiguration? {
    if case .textAttachment = textItem.content { return nil }
    return UITextItem.MenuConfiguration(menu: defaultMenu)
  }

  func textView(_ textView: UITextView, primaryActionFor textItem: UITextItem, defaultAction: UIAction) -> UIAction? {
    if case .textAttachment = textItem.content { return nil }
    guard case .link(let url) = textItem.content else { return defaultAction }
    return UIAction { [weak self] _ in
      self?.onLinkPress(["href": url.absoluteString])
    }
  }

  func textView(_ textView: UITextView, editMenuForTextIn range: NSRange, suggestedActions: [UIMenuElement]) -> UIMenu? {
    let custom = menuItems.compactMap { item -> UIAction? in
      guard let id = item["id"] as? String, let label = item["label"] as? String else { return nil }
      let image = (item["icon"] as? String).flatMap { UIImage(systemName: $0) }
      return UIAction(title: label, image: image) { [weak self] _ in
        guard let self else { return }
        var payload = self.selectionPayload()
        payload["id"] = id
        self.onMenuAction(payload)
      }
    }
    return UIMenu(children: custom + suggestedActions)
  }
}

enum RichAttributedBuilder {
  static func build(
    blocks: [[String: Any]],
    typography: RichTypography,
    revealedSpoilers: Set<Int> = []
  ) -> (NSMutableAttributedString, [BlockRange]) {
    let result = NSMutableAttributedString()
    var ranges: [BlockRange] = []
    var spoilerIndex = 0

    for (blockIndex, block) in blocks.enumerated() {
      let id = block["id"] as? String ?? ""
      let role = block["role"] as? String ?? "paragraph"
      let runs = block["runs"] as? [[String: Any]] ?? []
      let paragraph = NSMutableParagraphStyle()
      paragraph.minimumLineHeight = typography.lineHeight
      paragraph.maximumLineHeight = typography.lineHeight
      paragraph.paragraphSpacing = typography.paragraphGap
      paragraph.lineBreakMode = .byWordWrapping

      var baseFont = typography.bodyFont()
      var baseColor = typography.color
      var extra: [NSAttributedString.Key: Any] = [:]
      var prefix = ""

      let nextRole = blockIndex + 1 < blocks.count ? blocks[blockIndex + 1]["role"] as? String : nil

      switch role {
      case "heading":
        let level = (block["level"] as? NSNumber)?.intValue ?? 2
        let spec = typography.headings[level] ?? HeadingSpec([:])
        let weight: UIFont.Weight = spec.weight == "semibold" ? .semibold : .bold
        let (font, fakeBold) = typography.font(family: typography.fontFamily, size: spec.size, weight: weight)
        baseFont = font
        if fakeBold {
          extra[.strokeWidth] = -2.5
          extra[.strokeColor] = baseColor
        }
        paragraph.minimumLineHeight = spec.lineHeight
        paragraph.maximumLineHeight = spec.lineHeight
        paragraph.paragraphSpacingBefore = blockIndex == 0 ? 0 : spec.spacingBefore
        paragraph.paragraphSpacing = spec.spacingAfter
      case "quote":
        baseFont = typography.font(family: typography.quoteFontFamily ?? typography.fontFamily, size: typography.quoteFontSize).0
        paragraph.minimumLineHeight = typography.quoteLineHeight
        paragraph.maximumLineHeight = typography.quoteLineHeight
        paragraph.firstLineHeadIndent = typography.quoteIndent
        paragraph.headIndent = typography.quoteIndent
        paragraph.paragraphSpacing = typography.quoteGap
        if typography.quoteItalic { extra[.obliqueness] = 0.12 }
        extra[.richQuote] = true
      case "listItem":
        let depth = (block["depth"] as? NSNumber)?.intValue ?? 0
        let indent = CGFloat(depth) * typography.listIndent
        let listType = block["listType"] as? String ?? "bullet"
        if listType == "number" {
          prefix = "\((block["index"] as? NSNumber)?.intValue ?? 1).\t"
        } else if listType == "check" {
          prefix = "\t"
        } else {
          prefix = "•\t"
        }
        paragraph.firstLineHeadIndent = indent + typography.listMarkerInset
        paragraph.headIndent = indent + typography.listTextInset
        paragraph.tabStops = [NSTextTab(textAlignment: .left, location: indent + typography.listTextInset)]
        paragraph.paragraphSpacing = nextRole == "listItem" ? typography.listItemGap : typography.paragraphGap
      case "hr":
        extra[.richRule] = true
        paragraph.minimumLineHeight = 2
        paragraph.maximumLineHeight = 2
        paragraph.paragraphSpacingBefore = max(0, typography.hrGap - typography.paragraphGap)
        paragraph.paragraphSpacing = typography.hrGap
      default:
        break
      }

      var baseAttributes: [NSAttributedString.Key: Any] = [
        .font: baseFont,
        .foregroundColor: baseColor,
        .paragraphStyle: paragraph,
        .richBlockId: id,
      ]
      baseAttributes.merge(extra) { _, new in new }

      if !prefix.isEmpty {
        var markerAttributes = baseAttributes
        markerAttributes[.foregroundColor] = typography.secondaryColor
        if block["listType"] as? String == "check" {
          let checked = block["checked"] as? Bool ?? false
          let symbol = UIImage(
            systemName: checked ? "checkmark.square.fill" : "square",
            withConfiguration: UIImage.SymbolConfiguration(font: baseFont, scale: .medium)
          )?.withTintColor(checked ? typography.accentColor : typography.secondaryColor, renderingMode: .alwaysOriginal)
          let attachment = NSTextAttachment()
          attachment.image = symbol
          let glyph = NSMutableAttributedString(attachment: attachment)
          glyph.addAttributes(markerAttributes, range: NSRange(location: 0, length: glyph.length))
          result.append(glyph)
        }
        result.append(NSAttributedString(string: prefix, attributes: markerAttributes))
      }
      let textStart = result.length
      var collapsed: [(offset: Int, sourceLength: Int)] = []

      if role == "hr" {
        result.append(NSAttributedString(string: "\u{00A0}", attributes: baseAttributes))
      }

      for run in runs {
        let text = run["text"] as? String ?? ""
        guard !text.isEmpty else { continue }
        var attributes = baseAttributes
        var font = baseFont
        let isMath = run["math"] as? Bool ?? false
        if isMath, let math = RichMath.attachment(
          latex: text,
          fontSize: baseFont.pointSize,
          color: baseColor,
          mode: .text,
          attributes: baseAttributes
        ) {
          collapsed.append((result.length - textStart, (text as NSString).length))
          result.append(math)
          continue
        }
        let isCode = isMath || run["code"] as? Bool ?? false
        if isCode {
          font = typography.codeFont(size: round(baseFont.pointSize * 0.9))
          attributes[.backgroundColor] = typography.codeBackground
        }
        if run["bold"] as? Bool ?? false {
          if let bold = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.union(.traitBold)),
             UIFont(descriptor: bold, size: font.pointSize).fontName != font.fontName {
            font = UIFont(descriptor: bold, size: font.pointSize)
          } else {
            attributes[.strokeWidth] = -2.5
            attributes[.strokeColor] = attributes[.foregroundColor]
          }
        }
        if run["italic"] as? Bool ?? false {
          if let italic = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.union(.traitItalic)),
             UIFont(descriptor: italic, size: font.pointSize).fontName != font.fontName {
            font = UIFont(descriptor: italic, size: font.pointSize)
          } else {
            attributes[.obliqueness] = 0.18
          }
        }
        if run["strike"] as? Bool ?? false {
          attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
        }
        if run["underline"] as? Bool ?? false {
          attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue
        }
        if run["sup"] as? Bool ?? false {
          font = font.withSize(round(font.pointSize * 0.7))
          attributes[.baselineOffset] = round(baseFont.pointSize * 0.35)
        }
        if run["sub"] as? Bool ?? false {
          font = font.withSize(round(font.pointSize * 0.7))
          attributes[.baselineOffset] = -round(baseFont.pointSize * 0.15)
        }
        if run["highlight"] as? Bool ?? false {
          attributes[.backgroundColor] = typography.highlightColor
        }
        if let hex = run["color"] as? String, let color = UIColor(richHex: hex) {
          attributes[.foregroundColor] = color
        }
        if let href = run["href"] as? String, let url = URL(string: href) {
          attributes[.link] = url
        }
        if run["spoiler"] as? Bool ?? false {
          attributes[.richSpoiler] = spoilerIndex
          if !revealedSpoilers.contains(spoilerIndex) {
            attributes[.foregroundColor] = typography.color
            attributes[.backgroundColor] = typography.color
          }
          spoilerIndex += 1
        }
        attributes[.font] = font
        result.append(NSAttributedString(string: text, attributes: attributes))
      }

      let textRange = NSRange(location: textStart, length: result.length - textStart)
      ranges.append(BlockRange(id: id, range: textRange, collapsed: collapsed))

      if blockIndex < blocks.count - 1 {
        result.append(NSAttributedString(string: "\n", attributes: baseAttributes))
      }
    }

    return (result, ranges)
  }
}
