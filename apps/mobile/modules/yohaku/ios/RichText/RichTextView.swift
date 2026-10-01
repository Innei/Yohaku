import ExpoModulesCore
import UIKit

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
  private var tabMarks: [RichTabMark] = []
  private let tabRail = RichTabRail()
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
    addSubview(tabRail)

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
    // Underlines belong to comment marks; links are told apart by color alone.
    textView.linkTextAttributes = [.foregroundColor: typography.linkColor]
    layoutManager.apply(typography)
    tabRail.color = typography.accentColor
    tabRail.inkColor = typography.paperColor
    rebuild()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    textView.frame = bounds
    // Tabs hang off the screen edge, past the page gutter this view sits inside.
    let edge = window.map { convert(CGPoint(x: $0.bounds.maxX, y: 0), from: $0).x } ?? bounds.maxX
    tabRail.frame = CGRect(x: max(edge, bounds.maxX) - RichTabRail.width, y: 0, width: RichTabRail.width, height: bounds.height)
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
    placeTabs()
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

  override func didMoveToWindow() {
    super.didMoveToWindow()
    setNeedsLayout()
  }

  private func placeTabs() {
    var tabs: [CGFloat: RichTabRail.Tab] = [:]
    for mark in tabMarks {
      guard let ink = layoutManager.inkSegments(for: mark.range, in: textView.textStorage, at: .zero).first else { continue }
      let y = ink.rect.midY.rounded()
      var tab = tabs[y] ?? RichTabRail.Tab(y: y, count: 0, active: false)
      tab.count += mark.count
      tab.active = tab.active || mark.active
      tabs[y] = tab
    }
    tabRail.tabs = Array(tabs.values)
  }

  private func rebuild() {
    let (result, ranges) = RichAttributedBuilder.build(
      blocks: blocks,
      typography: typography,
      revealedSpoilers: textView.revealedSpoilers
    )

    var marks: [RichTabMark] = []
    for highlight in highlights {
      guard let blockId = highlight["blockId"] as? String,
            let start = highlight["start"] as? Int,
            let end = highlight["end"] as? Int,
            let block = ranges.first(where: { $0.id == blockId }) else { continue }
      let clampedStart = block.rendered(fromSource: max(0, min(start, block.sourceLength)), roundUp: false)
      let clampedEnd = max(clampedStart, block.rendered(fromSource: max(0, min(end, block.sourceLength)), roundUp: true))
      let range = NSRange(location: block.range.location + clampedStart, length: clampedEnd - clampedStart)
      guard range.length > 0 else { continue }
      switch highlight["kind"] as? String ?? "comment" {
      case "reading":
        result.addAttribute(.backgroundColor, value: typography.accentColor.withAlphaComponent(0.05), range: range)
      case "active":
        result.addAttribute(.richMark, value: RichMarkStyle.solid, range: range)
        marks.append(RichTabMark(range: range, count: 0, active: true))
      case "block-active":
        marks.append(RichTabMark(range: range, count: 0, active: true))
      case "block":
        marks.append(RichTabMark(range: range, count: 1, active: false))
      default:
        result.addAttribute(.richMark, value: RichMarkStyle.dotted, range: range)
        marks.append(RichTabMark(range: range, count: highlight["count"] as? Int ?? 1, active: false))
      }
      if let id = highlight["id"] as? String {
        result.addAttribute(.richHighlightId, value: id, range: range)
      }
    }

    blockRanges = ranges
    tabMarks = marks
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
