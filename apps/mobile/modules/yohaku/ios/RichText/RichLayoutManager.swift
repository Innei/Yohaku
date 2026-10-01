import UIKit

extension NSAttributedString.Key {
  static let richBlockId = NSAttributedString.Key("YohakuRichBlockId")
  static let richHighlightId = NSAttributedString.Key("YohakuRichHighlightId")
  static let richSpoiler = NSAttributedString.Key("YohakuRichSpoiler")
  static let richQuote = NSAttributedString.Key("YohakuRichQuote")
  static let richRule = NSAttributedString.Key("YohakuRichRule")
  static let richMark = NSAttributedString.Key("YohakuRichMark")
  static let richRuby = NSAttributedString.Key("YohakuRichRuby")
  static let richCode = NSAttributedString.Key("YohakuRichCode")
  static let richHighlight = NSAttributedString.Key("YohakuRichHighlight")
  static let richSpoilerMask = NSAttributedString.Key("YohakuRichSpoilerMask")
}

// Attribute values must survive UIKit archiving on copy and drag, so ruby is a plain
// string: the node key keeps adjacent annotations (漢(かん)字(じ)) apart.
enum RichRuby {
  static let separator: Character = "\u{1F}"

  static func value(id: String?, reading: String) -> NSString {
    "\(id ?? "")\(separator)\(reading)" as NSString
  }

  static func reading(of value: Any?) -> String? {
    (value as? String)?.split(separator: separator, maxSplits: 1, omittingEmptySubsequences: false).last.map(String.init)
  }
}

enum RichMarkStyle {
  static let dotted = "dotted"
  static let solid = "solid"
}

struct RichTabMark {
  let range: NSRange
  let count: Int
  let active: Bool
}

final class RichTabRail: UIView {
  struct Tab {
    var y: CGFloat
    var count: Int
    var active: Bool
  }

  static let width: CGFloat = 36
  var tabs: [Tab] = [] { didSet { setNeedsDisplay() } }
  var color = UIColor.tintColor { didSet { setNeedsDisplay() } }
  var inkColor = UIColor.systemBackground { didSet { setNeedsDisplay() } }

  override init(frame: CGRect) {
    super.init(frame: frame)
    isOpaque = false
    backgroundColor = .clear
    isUserInteractionEnabled = false
    contentMode = .redraw
  }

  required init?(coder: NSCoder) { nil }

  override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }
    for tab in tabs {
      let label = tab.count > 0 ? String(tab.count) : ""
      let attributes: [NSAttributedString.Key: Any] = [.font: RichLayoutManager.markCountFont, .foregroundColor: inkColor]
      let size = (label as NSString).size(withAttributes: attributes)
      let width = max(15, ceil(size.width) + 8)
      let frame = CGRect(x: bounds.maxX - width, y: tab.y - 8, width: width, height: 16)
      context.saveGState()
      if tab.active {
        context.setShadow(offset: CGSize(width: 0, height: 2), blur: 6, color: UIColor.black.withAlphaComponent(0.2).cgColor)
      }
      (tab.active ? color : color.withAlphaComponent(0.6)).setFill()
      UIBezierPath(roundedRect: frame, byRoundingCorners: [.topLeft, .bottomLeft], cornerRadii: CGSize(width: 3, height: 3)).fill()
      context.restoreGState()
      (label as NSString).draw(at: CGPoint(x: frame.minX + 4, y: frame.midY - size.height / 2), withAttributes: attributes)
    }
  }
}

struct RichInkSegment {
  let rect: CGRect
  let baseline: CGFloat
  let font: UIFont
}

final class RichLayoutManager: NSLayoutManager {
  var quoteBarColor = UIColor.separator
  var ruleColor = UIColor.tertiaryLabel
  var markColor = UIColor.tintColor
  var rubyColor = UIColor.secondaryLabel
  var codeColor = UIColor.secondarySystemFill
  var highlightColor = UIColor.systemYellow.withAlphaComponent(0.35)
  var spoilerColor = UIColor.label
  static let markCountFont = UIFont.monospacedDigitSystemFont(ofSize: 9, weight: .medium)
  static let codeGap: CGFloat = 5

  func apply(_ typography: RichTypography) {
    quoteBarColor = typography.quoteBarColor
    ruleColor = typography.mutedColor
    markColor = typography.accentColor
    rubyColor = typography.secondaryColor
    codeColor = typography.codeBackground
    highlightColor = typography.highlightColor
    spoilerColor = typography.color
  }

  // Line fragments span the whole fixed line height plus paragraph spacing, so
  // backgrounds hug the run's own font box instead. Trailing kern is spacing, not ink.
  func inkSegments(for characters: NSRange, in storage: NSTextStorage, at origin: CGPoint) -> [RichInkSegment] {
    let glyphs = glyphRange(forCharacterRange: characters, actualCharacterRange: nil)
    var out: [RichInkSegment] = []
    enumerateLineFragments(forGlyphRange: glyphs) { rect, _, container, lineGlyphs, _ in
      let segment = NSIntersectionRange(glyphs, lineGlyphs)
      guard segment.length > 0 else { return }
      let bounds = self.boundingRect(forGlyphRange: segment, in: container)
      let first = self.characterIndexForGlyph(at: segment.location)
      let last = self.characterIndexForGlyph(at: NSMaxRange(segment) - 1)
      let kern = CGFloat((storage.attribute(.kern, at: last, effectiveRange: nil) as? NSNumber)?.doubleValue ?? 0)
      let font = storage.attribute(.font, at: first, effectiveRange: nil) as? UIFont ?? .systemFont(ofSize: 15)
      let baseline = origin.y + rect.minY + self.location(forGlyphAt: segment.location).y
      out.append(RichInkSegment(
        rect: CGRect(
          x: origin.x + bounds.minX,
          y: baseline - font.ascender,
          width: max(0, bounds.width - kern),
          height: font.ascender - font.descender
        ),
        baseline: baseline,
        font: font
      ))
    }
    return out
  }

  override func drawBackground(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
    super.drawBackground(forGlyphRange: glyphsToShow, at: origin)
    guard let storage = textStorage, let context = UIGraphicsGetCurrentContext() else { return }
    let characters = characterRange(forGlyphRange: glyphsToShow, actualGlyphRange: nil)
    let whole = NSRange(location: 0, length: storage.length)

    // Consecutive quote blocks share one attribute run, so they draw as one bar.
    storage.enumerateAttribute(.richQuote, in: characters) { value, range, _ in
      guard value != nil else { return }
      var full = NSRange()
      _ = storage.attribute(.richQuote, at: range.location, longestEffectiveRange: &full, in: whole)
      guard range.location == max(full.location, characters.location) else { return }
      var top = CGFloat.greatestFiniteMagnitude
      var bottom: CGFloat = 0
      self.enumerateLineFragments(forGlyphRange: self.glyphRange(forCharacterRange: full, actualCharacterRange: nil)) { _, used, _, _, _ in
        top = min(top, used.minY)
        bottom = max(bottom, used.maxY)
      }
      guard bottom - top > 8 else { return }
      self.quoteBarColor.setFill()
      UIBezierPath(
        roundedRect: CGRect(x: origin.x, y: origin.y + top + 4, width: 2, height: bottom - top - 8),
        cornerRadius: 1
      ).fill()
    }

    storage.enumerateAttribute(.richRule, in: characters) { value, range, _ in
      guard value != nil else { return }
      let glyphs = self.glyphRange(forCharacterRange: range, actualCharacterRange: nil)
      // A colored rule is the print masthead underline; body rules are the three-dot break.
      if let color = value as? UIColor {
        context.setFillColor(color.cgColor)
        self.enumerateLineFragments(forGlyphRange: glyphs) { rect, _, container, _, _ in
          context.fill(CGRect(x: origin.x, y: rect.midY + origin.y, width: container.size.width, height: 1))
        }
        return
      }
      self.ruleColor.setFill()
      self.enumerateLineFragments(forGlyphRange: glyphs) { _, used, container, _, _ in
        let center = CGPoint(x: origin.x + container.size.width / 2, y: origin.y + used.midY)
        for step in -1...1 {
          UIBezierPath(ovalIn: CGRect(x: center.x + CGFloat(step) * 17 - 1.5, y: center.y - 1.5, width: 3, height: 3)).fill()
        }
      }
    }

    storage.enumerateAttribute(.richCode, in: characters) { value, range, _ in
      guard value != nil else { return }
      self.codeColor.setFill()
      for ink in self.inkSegments(for: range, in: storage, at: origin) {
        UIBezierPath(roundedRect: ink.rect.insetBy(dx: -3, dy: -1), cornerRadius: 4).fill()
      }
    }

    storage.enumerateAttribute(.richHighlight, in: characters) { value, range, _ in
      guard value != nil else { return }
      self.highlightColor.setFill()
      for ink in self.inkSegments(for: range, in: storage, at: origin) {
        let size = ink.font.pointSize
        UIBezierPath(rect: CGRect(x: ink.rect.minX, y: ink.baseline - size * 0.38, width: ink.rect.width, height: size * 0.5)).fill()
      }
    }

    storage.enumerateAttribute(.richSpoilerMask, in: characters) { value, range, _ in
      guard value != nil else { return }
      for ink in self.inkSegments(for: range, in: storage, at: origin) {
        let plate = UIBezierPath(roundedRect: ink.rect.insetBy(dx: -1, dy: -1), cornerRadius: 3)
        context.saveGState()
        plate.addClip()
        self.spoilerColor.withAlphaComponent(0.72).setFill()
        plate.fill()
        let bounds = plate.bounds
        let stripes = UIBezierPath()
        var x = bounds.minX - bounds.height
        while x < bounds.maxX {
          stripes.move(to: CGPoint(x: x, y: bounds.maxY))
          stripes.addLine(to: CGPoint(x: x + bounds.height, y: bounds.minY))
          x += 4
        }
        stripes.lineWidth = 1.5
        self.spoilerColor.setStroke()
        stripes.stroke()
        context.restoreGState()
      }
    }

    storage.enumerateAttribute(.richMark, in: characters) { value, range, _ in
      guard let style = value as? String else { return }
      let solid = style == RichMarkStyle.solid
      context.setFillColor((solid ? self.markColor : self.markColor.withAlphaComponent(0.6)).cgColor)
      for ink in self.inkSegments(for: range, in: storage, at: origin) {
        let y = ink.baseline + round(ink.font.pointSize / 3)
        if solid {
          context.fill(CGRect(x: ink.rect.minX, y: y, width: ink.rect.width, height: 1.5))
          continue
        }
        var x = ink.rect.minX
        while x + 1.5 <= ink.rect.maxX {
          context.fillEllipse(in: CGRect(x: x, y: y, width: 1.5, height: 1.5))
          x += 3.5
        }
      }
    }
  }

  override func drawGlyphs(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
    super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)
    guard let storage = textStorage, let context = UIGraphicsGetCurrentContext() else { return }
    let characters = characterRange(forGlyphRange: glyphsToShow, actualGlyphRange: nil)
    storage.enumerateAttribute(.richRuby, in: characters) { value, range, _ in
      guard let reading = RichRuby.reading(of: value), !reading.isEmpty else { return }
      var full = NSRange()
      _ = storage.attribute(.richRuby, at: range.location, longestEffectiveRange: &full, in: NSRange(location: 0, length: storage.length))
      guard range.location == max(full.location, characters.location),
            storage.attribute(.richSpoilerMask, at: full.location, effectiveRange: nil) == nil
      else { return }
      // The reading is painted over the first line of its base, never inserted, so anchor offsets stay valid.
      let glyphs = self.glyphRange(forCharacterRange: full, actualCharacterRange: nil)
      var lineGlyphs = NSRange()
      let line = self.lineFragmentRect(forGlyphAt: glyphs.location, effectiveRange: &lineGlyphs)
      let segment = NSIntersectionRange(glyphs, lineGlyphs)
      guard segment.length > 0,
            let container = self.textContainer(forGlyphAt: glyphs.location, effectiveRange: nil)
      else { return }
      let box = self.boundingRect(forGlyphRange: segment, in: container)
      let font = (storage.attribute(.font, at: full.location, effectiveRange: nil) as? UIFont) ?? UIFont.systemFont(ofSize: 15)
      let rubyFont = font.withSize(max(7, round(font.pointSize * 0.5)))
      let attributes: [NSAttributedString.Key: Any] = [.font: rubyFont, .foregroundColor: self.rubyColor]
      let label = reading as NSString
      let width = label.size(withAttributes: attributes).width
      let baseline = line.minY + self.location(forGlyphAt: segment.location).y
      let rubyBaseline = baseline - font.ascender + 1
      label.draw(
        at: CGPoint(x: origin.x + box.midX - width / 2, y: origin.y + rubyBaseline - rubyFont.ascender),
        withAttributes: attributes
      )
    }
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
