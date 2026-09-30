import UIKit

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

enum RichAttributedBuilder {
  // Noto Serif SC ships a single weight; a lighter stroke keeps faked bold from smearing.
  static let fakeBoldStroke: CGFloat = -1.2
  static let codeKeepTogether = 16

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
      var marker: NSAttributedString?
      let attribution = role == "quote" ? (block["attribution"] as? String).flatMap { $0.isEmpty ? nil : $0 } : nil

      let nextRole = blockIndex + 1 < blocks.count ? blocks[blockIndex + 1]["role"] as? String : nil
      let spacingAfterQuote = nextRole == "quote" ? typography.quoteGap : typography.paragraphGap

      switch role {
      case "heading":
        let level = (block["level"] as? NSNumber)?.intValue ?? 2
        let spec = typography.headings[level] ?? HeadingSpec([:])
        let weight: UIFont.Weight = switch spec.weight {
        case "regular": .regular
        case "semibold": .semibold
        default: .bold
        }
        let (font, fakeBold) = typography.font(family: spec.fontFamily ?? typography.fontFamily, size: spec.size, weight: weight)
        baseFont = font
        if let color = spec.color { baseColor = color }
        if fakeBold {
          extra[.strokeWidth] = fakeBoldStroke
          extra[.strokeColor] = baseColor
        }
        paragraph.minimumLineHeight = spec.lineHeight
        paragraph.maximumLineHeight = spec.lineHeight
        paragraph.paragraphSpacingBefore = blockIndex == 0 ? 0 : spec.spacingBefore
        paragraph.paragraphSpacing = spec.spacingAfter
      case "quote":
        baseFont = typography.font(family: typography.quoteFontFamily ?? typography.fontFamily, size: typography.quoteFontSize).0
        if let color = typography.quoteColor { baseColor = color }
        paragraph.minimumLineHeight = typography.quoteLineHeight
        paragraph.maximumLineHeight = typography.quoteLineHeight
        paragraph.firstLineHeadIndent = typography.quoteIndent
        paragraph.headIndent = typography.quoteIndent
        paragraph.paragraphSpacing = attribution == nil ? spacingAfterQuote : 6
        if typography.quoteItalic { extra[.obliqueness] = 0.12 }
        extra[.richQuote] = true
      case "listItem":
        let depth = (block["depth"] as? NSNumber)?.intValue ?? 0
        let indent = CGFloat(depth) * typography.listIndent
        let textTab = NSTextTab(textAlignment: .left, location: indent + typography.listTextInset)
        paragraph.headIndent = indent + typography.listTextInset
        paragraph.tabStops = [textTab]
        paragraph.paragraphSpacing = nextRole == "listItem" ? typography.listItemGap : typography.paragraphGap
        let markerAttributes: [NSAttributedString.Key: Any] = [.font: baseFont, .paragraphStyle: paragraph, .richBlockId: id]
        switch block["listType"] as? String {
        case "number":
          // Numbers sit right-aligned in the marker column so 9 and 10 keep one gap to the text.
          paragraph.firstLineHeadIndent = indent
          paragraph.tabStops = [
            NSTextTab(textAlignment: .right, location: indent + typography.listTextInset - 12),
            textTab,
          ]
          let number = NSMutableAttributedString(string: "\t", attributes: markerAttributes)
          var digitAttributes = markerAttributes
          digitAttributes[.font] = typography.codeFont(size: round(baseFont.pointSize * 0.87))
          digitAttributes[.foregroundColor] = typography.mutedColor
          number.append(NSAttributedString(string: "\((block["index"] as? NSNumber)?.intValue ?? 1)", attributes: digitAttributes))
          number.append(NSAttributedString(string: "\t", attributes: markerAttributes))
          marker = number
        case "check":
          let checked = block["checked"] as? Bool ?? false
          if checked { baseColor = typography.secondaryColor }
          paragraph.firstLineHeadIndent = indent + typography.listMarkerInset
          marker = markerGlyph(checkbox(checked: checked, typography: typography), font: baseFont, attributes: markerAttributes)
        default:
          paragraph.firstLineHeadIndent = indent + typography.listMarkerInset + 4
          marker = markerGlyph(dot(hollow: depth > 0, color: typography.mutedColor), font: baseFont, attributes: markerAttributes)
        }
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

      if let marker { result.append(marker) }
      let textStart = result.length
      var collapsed: [(offset: Int, sourceLength: Int)] = []

      if role == "hr" {
        result.append(NSAttributedString(string: "\u{00A0}", attributes: baseAttributes))
      }

      for run in runs {
        // A soft break stays inside the paragraph; "\n" would start a new one and pick up
        // paragraph spacing and the list's first-line indent. Same length, so offsets hold.
        var text = run["lineBreak"] as? Bool == true ? "\u{2028}" : run["text"] as? String ?? ""
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
          result.append(fitMath(math, lineHeight: paragraph.maximumLineHeight))
          continue
        }
        let isCode = isMath || run["code"] as? Bool ?? false
        if isCode {
          font = typography.codeFont(size: round(baseFont.pointSize * 0.87))
          attributes[.richCode] = true
          // Swapping spaces for no-break spaces keeps a short snippet on one line without changing offsets.
          if (text as NSString).length <= codeKeepTogether {
            text = text.replacingOccurrences(of: " ", with: "\u{00A0}")
          }
        }
        if run["bold"] as? Bool ?? false {
          if let bold = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.union(.traitBold)),
             UIFont(descriptor: bold, size: font.pointSize).fontName != font.fontName {
            font = UIFont(descriptor: bold, size: font.pointSize)
          } else {
            attributes[.strokeWidth] = fakeBoldStroke
            attributes[.strokeColor] = attributes[.foregroundColor]
          }
        }
        let isItalic = run["italic"] as? Bool ?? false
        if isItalic {
          if let italic = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.union(.traitItalic)),
             UIFont(descriptor: italic, size: font.pointSize).fontName != font.fontName {
            font = UIFont(descriptor: italic, size: font.pointSize)
          } else {
            attributes[.obliqueness] = 0.1
          }
        }
        if run["mention"] as? Bool ?? false, typography.fontFamily == nil {
          font = UIFont.systemFont(ofSize: font.pointSize, weight: .medium)
        }
        if run["tag"] as? Bool ?? false {
          attributes[.foregroundColor] = typography.accentColor
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
        if run["footnote"] != nil {
          font = typography.codeFont(size: max(9, round(baseFont.pointSize * 0.66)))
          attributes[.foregroundColor] = typography.accentColor
        }
        if run["highlight"] as? Bool ?? false {
          attributes[.richHighlight] = true
        }
        if let hex = run["color"] as? String, let color = UIColor(richHex: hex) {
          attributes[.foregroundColor] = color
        }
        if let href = run["href"] as? String, let url = URL(string: href) {
          attributes[.link] = url
        }
        if let reading = run["ruby"] as? String, !reading.isEmpty {
          attributes[.richRuby] = RichRuby.value(id: run["rubyId"] as? String, reading: reading)
        }
        if run["spoiler"] as? Bool ?? false {
          attributes[.richSpoiler] = spoilerIndex
          if !revealedSpoilers.contains(spoilerIndex) {
            attributes[.foregroundColor] = UIColor.clear
            attributes[.strokeColor] = UIColor.clear
            attributes[.richSpoilerMask] = true
          }
          spoilerIndex += 1
        }
        attributes[.font] = font
        let start = result.length
        result.append(NSAttributedString(string: text, attributes: attributes))
        let length = (text as NSString).length
        if isItalic, attributes[.obliqueness] == nil {
          // System italics have no CJK glyphs; those fall back upright unless slanted by hand.
          for range in cjkRanges(in: text) {
            result.addAttribute(.obliqueness, value: 0.1, range: NSRange(location: start + range.location, length: range.length))
          }
        }
        if run["mention"] as? Bool ?? false, text.hasPrefix("@") {
          result.addAttribute(.foregroundColor, value: typography.mutedColor, range: NSRange(location: start, length: 1))
        }
        if isCode {
          result.addAttribute(.kern, value: RichLayoutManager.codeGap, range: NSRange(location: start + length - 1, length: 1))
          if start > textStart {
            // A code span split into runs (part bold) stays one chip: only its outer edges get the gap.
            let previous = NSRange(location: start - 1, length: 1)
            if result.attribute(.richCode, at: previous.location, effectiveRange: nil) == nil {
              result.addAttribute(.kern, value: RichLayoutManager.codeGap, range: previous)
            } else {
              result.removeAttribute(.kern, range: previous)
            }
          }
        }
      }

      let textRange = NSRange(location: textStart, length: result.length - textStart)
      ranges.append(BlockRange(id: id, range: textRange, collapsed: collapsed))

      var trailingAttributes = baseAttributes
      if let attribution {
        let style = NSMutableParagraphStyle()
        style.minimumLineHeight = 18
        style.maximumLineHeight = 18
        style.firstLineHeadIndent = typography.quoteIndent
        style.headIndent = typography.quoteIndent
        style.paragraphSpacing = spacingAfterQuote
        trailingAttributes = [
          .font: UIFont.systemFont(ofSize: 12),
          .foregroundColor: typography.secondaryColor,
          .paragraphStyle: style,
          .richBlockId: id,
          .richQuote: true,
        ]
        result.append(NSAttributedString(string: "\n", attributes: baseAttributes))
        result.append(NSAttributedString(string: "— \(attribution)", attributes: trailingAttributes))
      }

      if blockIndex < blocks.count - 1 {
        result.append(NSAttributedString(string: "\n", attributes: trailingAttributes))
      }
    }

    return (result, ranges)
  }

  static func fitMath(_ math: NSAttributedString, lineHeight: CGFloat) -> NSAttributedString {
    guard let attachment = math.attribute(.attachment, at: 0, effectiveRange: nil) as? NSTextAttachment,
          let key = math.attribute(.richMath, at: 0, effectiveRange: nil) as? String,
          let box = RichMath.box(forKey: key),
          box.size.height > lineHeight - 4
    else { return math }
    // The line height is fixed, so a tall formula is shrunk rather than drawn over its neighbours.
    let scale = (lineHeight - 4) / box.size.height
    attachment.bounds = RichMath.bounds(of: box, scale: scale, onBaseline: false)
    let fitted = NSMutableAttributedString(attributedString: math)
    fitted.addAttribute(.richMathScale, value: NSNumber(value: Double(scale)), range: NSRange(location: 0, length: fitted.length))
    return fitted
  }

  static func cjkRanges(in text: String) -> [NSRange] {
    var out: [NSRange] = []
    var offset = 0
    for scalar in text.unicodeScalars {
      let length = scalar.utf16.count
      let cjk = switch scalar.value {
      case 0x3040...0x30FF, 0x3400...0x4DBF, 0x4E00...0x9FFF, 0xAC00...0xD7AF, 0xF900...0xFAFF, 0xFF00...0xFFEF, 0x20000...0x2FFFF: true
      default: false
      }
      if cjk {
        if let last = out.last, NSMaxRange(last) == offset {
          out[out.count - 1].length += length
        } else {
          out.append(NSRange(location: offset, length: length))
        }
      }
      offset += length
    }
    return out
  }

  static func markerGlyph(_ image: UIImage, font: UIFont, attributes: [NSAttributedString.Key: Any]) -> NSAttributedString {
    let attachment = NSTextAttachment()
    attachment.image = image
    attachment.bounds = CGRect(
      x: 0,
      y: (font.capHeight - image.size.height) / 2,
      width: image.size.width,
      height: image.size.height
    )
    let glyph = NSMutableAttributedString(attachment: attachment)
    glyph.append(NSAttributedString(string: "\t"))
    glyph.addAttributes(attributes, range: NSRange(location: 0, length: glyph.length))
    return glyph
  }

  static func dot(hollow: Bool, color: UIColor) -> UIImage {
    UIGraphicsImageRenderer(size: CGSize(width: 5, height: 5)).image { _ in
      if hollow {
        color.setStroke()
        let ring = UIBezierPath(ovalIn: CGRect(x: 0.6, y: 0.6, width: 3.8, height: 3.8))
        ring.lineWidth = 1.2
        ring.stroke()
      } else {
        color.setFill()
        UIBezierPath(ovalIn: CGRect(x: 0, y: 0, width: 5, height: 5)).fill()
      }
    }
  }

  static func checkbox(checked: Bool, typography: RichTypography) -> UIImage {
    UIGraphicsImageRenderer(size: CGSize(width: 16, height: 16)).image { _ in
      guard checked else {
        typography.quoteBarColor.setStroke()
        let ring = UIBezierPath(roundedRect: CGRect(x: 1.25, y: 1.25, width: 13.5, height: 13.5), cornerRadius: 4)
        ring.lineWidth = 1.5
        ring.stroke()
        return
      }
      typography.accentColor.setFill()
      UIBezierPath(roundedRect: CGRect(x: 0.5, y: 0.5, width: 15, height: 15), cornerRadius: 4.5).fill()
      let check = UIBezierPath()
      check.move(to: CGPoint(x: 4.6, y: 8.2))
      check.addLine(to: CGPoint(x: 6.8, y: 10.4))
      check.addLine(to: CGPoint(x: 11.4, y: 5.6))
      check.lineWidth = 1.6
      check.lineCapStyle = .round
      check.lineJoinStyle = .round
      typography.paperColor.setStroke()
      check.stroke()
    }
  }
}
