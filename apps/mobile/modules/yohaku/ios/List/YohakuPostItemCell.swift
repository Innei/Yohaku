import UIKit

final class YohakuPostItemCell: UICollectionViewCell, UITextViewDelegate {
  static let reuseIdentifier = "YohakuPostItemCell"

  var onLink: ((String, String) -> Void)?
  var onPress: (() -> Void)?

  private let titleLabel = UILabel()
  private let metaView = UITextView()

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    contentView.backgroundColor = .clear

    titleLabel.numberOfLines = 2
    titleLabel.lineBreakMode = .byTruncatingTail
    titleLabel.font = Self.titleFont()
    titleLabel.adjustsFontForContentSizeCategory = false
    titleLabel.isUserInteractionEnabled = true
    titleLabel.accessibilityTraits = .link
    titleLabel.addGestureRecognizer(
      UITapGestureRecognizer(target: self, action: #selector(handlePress))
    )
    contentView.addSubview(titleLabel)

    metaView.backgroundColor = .clear
    metaView.delegate = self
    metaView.isEditable = false
    metaView.isScrollEnabled = false
    metaView.font = Self.metaFont()
    metaView.adjustsFontForContentSizeCategory = false
    metaView.contentInsetAdjustmentBehavior = .never
    metaView.contentInset = .zero
    metaView.textContainerInset = .zero
    metaView.textContainer.lineFragmentPadding = 0
    applyMetaLinkStyle()
    contentView.addSubview(metaView)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func prepareForReuse() {
    super.prepareForReuse()
    onLink = nil
    onPress = nil
    titleLabel.attributedText = nil
    metaView.attributedText = nil
  }

  func configure(_ item: YohakuListItemSpec) {
    applyMetaLinkStyle()
    titleLabel.attributedText = Self.title(item.title)
    titleLabel.accessibilityLabel = item.title
    metaView.attributedText = Self.meta(item)
  }

  private func applyMetaLinkStyle() {
    metaView.font = Self.metaFont()
    metaView.linkTextAttributes = [
      .font: Self.metaFont(),
      .foregroundColor: Self.accent,
      .underlineStyle: 0,
    ]
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let width = contentView.bounds.width
    let titleHeight = Self.titleHeight(titleLabel.attributedText, width: width)
    titleLabel.frame = CGRect(x: 0, y: 12, width: width, height: titleHeight)
    metaView.frame = CGRect(
      x: 0,
      y: 12 + titleHeight + 10,
      width: width,
      height: max(FontScale.size(18), contentView.bounds.height - titleHeight - 33)
    )
  }

  static func height(for item: YohakuListItemSpec, width: CGFloat) -> CGFloat {
    let titleHeight = titleHeight(title(item.title), width: width)
    let metaHeight = metaHeight(meta(item), width: width)
    return 12 + titleHeight + 10 + metaHeight + 11
  }

  @objc
  private func handlePress() {
    onPress?()
  }

  func textView(
    _ textView: UITextView,
    shouldInteractWith URL: URL,
    in characterRange: NSRange,
    interaction: UITextItemInteraction
  ) -> Bool {
    guard
      URL.scheme == "yohaku",
      let kind = URL.host,
      let components = URLComponents(url: URL, resolvingAgainstBaseURL: false),
      let value = components.queryItems?.first(where: { $0.name == "value" })?.value
    else { return false }
    onLink?(kind, value)
    return false
  }

  private static func title(_ value: String) -> NSAttributedString {
    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = FontScale.size(26)
    paragraph.maximumLineHeight = FontScale.size(26)
    paragraph.lineBreakMode = .byTruncatingTail
    return NSAttributedString(
      string: value,
      attributes: [
        .font: titleFont(),
        .foregroundColor: neutral9,
        .paragraphStyle: paragraph,
      ]
    )
  }

  private static func titleHeight(_ title: NSAttributedString?, width: CGFloat) -> CGFloat {
    let line = FontScale.size(26)
    guard let title, title.length > 0, width > 0 else { return line }
    let probe = NSMutableAttributedString(attributedString: title)
    let wrap = NSMutableParagraphStyle()
    wrap.lineBreakMode = .byWordWrapping
    probe.addAttribute(
      .paragraphStyle,
      value: wrap,
      range: NSRange(location: 0, length: probe.length)
    )
    let box = probe.boundingRect(
      with: CGSize(width: width, height: .greatestFiniteMagnitude),
      options: .usesLineFragmentOrigin,
      context: nil
    )
    let lines = box.height > titleFont().lineHeight * 1.4 ? 2 : 1
    return line * CGFloat(lines)
  }

  private static func metaHeight(_ text: NSAttributedString, width: CGFloat) -> CGFloat {
    let line = FontScale.size(18)
    guard width > 0 else { return line }
    let box = text.boundingRect(
      with: CGSize(width: width, height: .greatestFiniteMagnitude),
      options: .usesLineFragmentOrigin,
      context: nil
    )
    return max(line, ceil(box.height))
  }

  private static func meta(_ item: YohakuListItemSpec) -> NSAttributedString {
    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = FontScale.size(18)
    paragraph.maximumLineHeight = FontScale.size(18)
    let base: [NSAttributedString.Key: Any] = [
      .font: metaFont(),
      .foregroundColor: neutral6,
      .paragraphStyle: paragraph,
    ]
    let separator = base.merging([.foregroundColor: neutral4]) { _, new in new }
    let result = NSMutableAttributedString(string: item.date, attributes: base)

    let hasCategory = !item.categoryName.isEmpty
    if hasCategory {
      result.append(NSAttributedString(string: " · ", attributes: separator))
      result.append(link(item.categoryName, kind: "category", value: item.categorySlug, attributes: base))
    }
    if !item.tags.isEmpty {
      result.append(NSAttributedString(string: hasCategory ? " / " : " ", attributes: separator))
      for (index, tag) in item.tags.enumerated() {
        if index > 0 {
          result.append(NSAttributedString(string: ", ", attributes: separator))
        }
        result.append(link(hasCategory ? tag : "#\(tag)", kind: "tag", value: tag, attributes: base))
      }
      if item.hiddenTagCount > 0 {
        result.append(NSAttributedString(string: " +\(item.hiddenTagCount)", attributes: base))
      }
    }
    return result
  }

  private static func link(
    _ text: String,
    kind: String,
    value: String,
    attributes: [NSAttributedString.Key: Any]
  ) -> NSAttributedString {
    var components = URLComponents()
    components.scheme = "yohaku"
    components.host = kind
    components.queryItems = [URLQueryItem(name: "value", value: value)]
    return NSAttributedString(
      string: text,
      attributes: attributes.merging([
        .foregroundColor: accent,
        .link: components.url as Any,
      ]) { _, new in new }
    )
  }

  private static func titleFont() -> UIFont {
    UIFont.systemFont(ofSize: FontScale.size(16), weight: .medium)
  }

  private static func metaFont() -> UIFont {
    UIFont.systemFont(ofSize: FontScale.size(12))
  }
  private static let accent = dynamic(light: 0xC56473, dark: 0xE095A4)
  private static let neutral4 = dynamic(light: 0xD0CEC6, dark: 0x5C5C5C)
  private static let neutral6 = dynamic(light: 0x787670, dark: 0xA8A8A8)
  private static let neutral9 = dynamic(light: 0x24231F, dark: 0xF0F0F0)

  private static func dynamic(light: UInt32, dark: UInt32) -> UIColor {
    UIColor { traits in color(traits.userInterfaceStyle == .dark ? dark : light) }
  }

  private static func color(_ hex: UInt32) -> UIColor {
    UIColor(
      red: CGFloat((hex >> 16) & 0xFF) / 255,
      green: CGFloat((hex >> 8) & 0xFF) / 255,
      blue: CGFloat(hex & 0xFF) / 255,
      alpha: 1
    )
  }
}
