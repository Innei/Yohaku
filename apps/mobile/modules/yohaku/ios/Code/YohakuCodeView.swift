import ExpoModulesCore
import UIKit

final class YohakuCodeView: ExpoView {
  let onContentSize = EventDispatcher()

  var code = ""
  var language = ""
  var fontFamily: String?
  var fontSize: CGFloat = 13
  var lineHeight: CGFloat = 20
  var padding: CGFloat = 12
  var paddingTop: CGFloat?
  var boldFontFamily: String?
  var textColor: UIColor = .label

  private struct Layout: Equatable {
    let code: String
    let language: String
    let fontFamily: String?
    let fontSize: CGFloat
    let lineHeight: CGFloat
    let padding: CGFloat
    let paddingTop: CGFloat?
    let boldFontFamily: String?
  }

  private static let queue = DispatchQueue(label: "in.innei.yohaku.code-highlight", qos: .userInitiated)

  private let scrollView = UIScrollView()
  private let textView: UITextView
  private let layoutManager: NSLayoutManager
  private var rendered: Layout?
  private var baseFont = UIFont.monospacedSystemFont(ofSize: 13, weight: .regular)
  private var boldFont: UIFont?
  private var spans: [CodeSpan] = []
  private var generation = 0
  private var contentSize: CGSize = .zero
  private var reportedHeight: CGFloat = -1

  required init(appContext: AppContext? = nil) {
    let storage = NSTextStorage()
    let layout = NSLayoutManager()
    let container = NSTextContainer(size: CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude))
    // TextKit adds font leading on top of maximumLineHeight.
    layout.usesFontLeading = false
    container.widthTracksTextView = false
    container.heightTracksTextView = false
    container.lineFragmentPadding = 0
    storage.addLayoutManager(layout)
    layout.addTextContainer(container)
    layoutManager = layout
    textView = UITextView(frame: .zero, textContainer: container)
    super.init(appContext: appContext)

    textView.isEditable = false
    textView.isScrollEnabled = false
    textView.isSelectable = true
    textView.backgroundColor = .clear
    textView.dataDetectorTypes = []
    textView.contentInsetAdjustmentBehavior = .never
    scrollView.showsHorizontalScrollIndicator = false
    scrollView.showsVerticalScrollIndicator = false
    scrollView.alwaysBounceVertical = false
    scrollView.contentInsetAdjustmentBehavior = .never
    scrollView.addSubview(textView)
    addSubview(scrollView)

    registerForTraitChanges([UITraitUserInterfaceStyle.self]) { (view: YohakuCodeView, _) in
      view.applyStyles()
    }
  }

  func update() {
    let next = Layout(
      code: code, language: language, fontFamily: fontFamily,
      fontSize: fontSize, lineHeight: lineHeight, padding: padding,
      paddingTop: paddingTop, boldFontFamily: boldFontFamily
    )
    guard next != rendered else {
      applyStyles()
      return
    }
    if next.code != rendered?.code { scrollView.contentOffset = .zero }
    rendered = next
    baseFont = fontFamily.flatMap { RichTypography.resolve($0, size: fontSize) }
      ?? .monospacedSystemFont(ofSize: fontSize, weight: .regular)
    boldFont = boldFontFamily.flatMap { RichTypography.resolve($0, size: fontSize) }
    textView.textContainerInset = UIEdgeInsets(top: paddingTop ?? padding, left: padding, bottom: padding, right: padding)
    spans = []
    textView.textStorage.setAttributedString(NSAttributedString(string: code))
    applyStyles()
    measure()
    highlight()
  }

  private func highlight() {
    generation += 1
    let token = generation
    let code = code
    let language = language
    guard CodeLanguages.resolve(language) != nil else { return }
    Self.queue.async { [weak self] in
      let spans = CodeHighlighter.shared.highlight(code, language: language) ?? []
      DispatchQueue.main.async {
        guard let self, self.generation == token, !spans.isEmpty else { return }
        self.spans = spans
        self.applyStyles()
      }
    }
  }

  private func applyStyles() {
    let storage = textView.textStorage
    let full = NSRange(location: 0, length: storage.length)
    guard full.length > 0 else { return }
    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
    paragraph.lineBreakMode = .byClipping
    let dark = traitCollection.userInterfaceStyle == .dark

    storage.beginEditing()
    storage.setAttributes([.font: baseFont, .foregroundColor: textColor, .paragraphStyle: paragraph], range: full)
    for span in spans where NSMaxRange(span.range) <= full.length {
      guard let style = CodeTheme.style(for: span.capture, dark: dark) else { continue }
      if let color = style.color {
        storage.addAttribute(.foregroundColor, value: UIColor(codeHex: color), range: span.range)
      }
      if style.bold || style.italic {
        storage.addAttribute(.font, value: styled(bold: style.bold, italic: style.italic), range: span.range)
      }
    }
    storage.endEditing()
  }

  // Custom mono faces register each weight as its own family member, so the bold
  // trait lookup fails on them; the dedicated face is passed in instead.
  private func styled(bold: Bool, italic: Bool) -> UIFont {
    if bold, !italic, let boldFont { return boldFont }
    var traits = baseFont.fontDescriptor.symbolicTraits
    if bold { traits.insert(.traitBold) }
    if italic { traits.insert(.traitItalic) }
    guard let descriptor = baseFont.fontDescriptor.withSymbolicTraits(traits) else { return baseFont }
    return UIFont(descriptor: descriptor, size: baseFont.pointSize)
  }

  private func measure() {
    layoutManager.ensureLayout(for: textView.textContainer)
    let used = layoutManager.usedRect(for: textView.textContainer)
    contentSize = CGSize(
      width: ceil(used.width) + padding * 2,
      height: ceil(max(used.height, lineHeight)) + (paddingTop ?? padding) + padding
    )
    setNeedsLayout()
    if contentSize.height != reportedHeight {
      reportedHeight = contentSize.height
      onContentSize(["height": contentSize.height])
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    scrollView.frame = bounds
    let width = max(contentSize.width, bounds.width)
    textView.frame = CGRect(origin: .zero, size: CGSize(width: width, height: contentSize.height))
    scrollView.contentSize = CGSize(width: width, height: bounds.height)
  }
}

private extension UIColor {
  convenience init(codeHex hex: UInt32) {
    self.init(
      red: CGFloat((hex >> 16) & 0xFF) / 255,
      green: CGFloat((hex >> 8) & 0xFF) / 255,
      blue: CGFloat(hex & 0xFF) / 255,
      alpha: 1
    )
  }
}
