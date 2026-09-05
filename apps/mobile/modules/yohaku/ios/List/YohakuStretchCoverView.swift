import UIKit

struct YohakuNoteHeroSpec {
  var coverPlaceholderUri: String?
  var coverUri: String?
  var height: Double = 98
  var id: String = ""
  var meta: String = ""
  var title: String = ""
}

enum YohakuNoteHeroLayout {
  static let blurDistance: CGFloat = 56

  static func frame(
    cellY: CGFloat,
    heroHeight: CGFloat,
    width: CGFloat,
    stretches: Bool
  ) -> (frame: CGRect, blur: CGFloat) {
    guard stretches else {
      return (CGRect(x: 0, y: cellY, width: width, height: heroHeight), 0)
    }
    let extra = max(0, cellY)
    return (
      CGRect(
        x: 0,
        y: min(0, cellY),
        width: width,
        height: heroHeight + extra
      ),
      min(1, extra / blurDistance)
    )
  }
}

enum YohakuNoteHeroSlotRole {
  case detail
  case list
}

final class YohakuNoteHeroView: UIView {
  private let blurView = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
  private let gradient = CAGradientLayer()
  private let imageView = UIImageView()
  private let metaLabel = UILabel()
  private let titleLabel = UILabel()
  private(set) var hasCover = false
  private var loadGeneration = 0
  private var loadedUri: String?
  private var placeholderImage: UIImage?
  private var placeholderUri: String?
  private var requestedUri: String?
  private var textMetaColor = UIColor.secondaryLabel
  private var textTitleColor = UIColor.label

  override init(frame: CGRect) {
    super.init(frame: frame)
    clipsToBounds = true
    isUserInteractionEnabled = false

    imageView.clipsToBounds = true
    imageView.contentMode = .scaleAspectFill
    blurView.alpha = 0
    gradient.colors = [
      UIColor.black.withAlphaComponent(0.08).cgColor,
      UIColor.black.withAlphaComponent(0.28).cgColor,
      UIColor.black.withAlphaComponent(0.78).cgColor,
    ]
    gradient.locations = [0, 0.46, 1]
    gradient.actions = ["bounds": NSNull(), "position": NSNull()]

    titleLabel.font =
      UIFont(name: "NotoSerifSC_500Medium", size: 28)
      ?? .systemFont(ofSize: 28, weight: .medium)
    titleLabel.numberOfLines = 2
    titleLabel.lineBreakMode = .byTruncatingTail
    metaLabel.font = .systemFont(ofSize: 12)
    metaLabel.numberOfLines = 1
    metaLabel.lineBreakMode = .byTruncatingTail

    addSubview(imageView)
    addSubview(blurView)
    layer.addSublayer(gradient)
    addSubview(titleLabel)
    addSubview(metaLabel)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    imageView.frame = bounds
    blurView.frame = bounds
    gradient.frame = bounds

    let horizontal: CGFloat = 20
    let textWidth = max(0, bounds.width - horizontal * 2)
    let titleHeight = min(
      72,
      ceil(
        titleLabel.sizeThatFits(
          CGSize(width: textWidth, height: CGFloat.greatestFiniteMagnitude)
        ).height)
    )
    let metaHeight: CGFloat = metaLabel.text?.isEmpty == false ? 18 : 0
    let gap: CGFloat = metaHeight > 0 ? 8 : 0
    let copyHeight = titleHeight + gap + metaHeight
    let copyY = hasCover ? max(0, bounds.height - 18 - copyHeight) : 0
    titleLabel.frame = CGRect(
      x: horizontal,
      y: copyY,
      width: textWidth,
      height: titleHeight
    )
    metaLabel.frame = CGRect(
      x: horizontal,
      y: titleLabel.frame.maxY + gap,
      width: textWidth,
      height: metaHeight
    )
  }

  func update(
    spec: YohakuNoteHeroSpec,
    titleColor: UIColor?,
    metaColor: UIColor?
  ) {
    textTitleColor = titleColor ?? .label
    textMetaColor = metaColor ?? .secondaryLabel
    titleLabel.attributedText = Self.line(
      spec.title,
      font: titleLabel.font,
      lineHeight: 36
    )
    metaLabel.attributedText = Self.line(
      spec.meta,
      font: metaLabel.font,
      lineHeight: 18
    )
    setPlaceholder(spec.coverPlaceholderUri)
    setUri(spec.coverUri)
    hasCover = normalized(spec.coverUri) != nil
    imageView.isHidden = !hasCover
    blurView.isHidden = !hasCover
    gradient.isHidden = !hasCover
    titleLabel.textColor = hasCover ? .white : textTitleColor
    metaLabel.textColor = hasCover ? .white : textMetaColor
    setNeedsLayout()
  }

  func setBlurOpacity(_ opacity: CGFloat) {
    blurView.alpha = hasCover ? opacity : 0
  }

  func setRole(_ role: YohakuNoteHeroSlotRole) {
    let detail = role == .detail
    accessibilityElementsHidden = !detail
    titleLabel.isAccessibilityElement = detail
    metaLabel.isAccessibilityElement = detail
  }

  private func setPlaceholder(_ uri: String?) {
    guard uri != placeholderUri else { return }
    placeholderUri = uri
    placeholderImage = Self.image(fromDataUri: uri)
    if loadedUri == nil {
      imageView.image = placeholderImage
    }
  }

  private func setUri(_ uri: String?) {
    let next = normalized(uri)
    guard next != requestedUri else { return }
    requestedUri = next
    loadedUri = nil
    imageView.image = placeholderImage
    loadGeneration += 1
    let generation = loadGeneration
    guard let next, let url = URL(string: next) else { return }
    URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
      guard let self, generation == self.loadGeneration else { return }
      guard let data, let image = UIImage(data: data) else {
        DispatchQueue.main.async {
          if generation == self.loadGeneration {
            self.requestedUri = nil
          }
        }
        return
      }
      DispatchQueue.main.async {
        guard generation == self.loadGeneration else { return }
        self.loadedUri = next
        UIView.transition(
          with: self.imageView,
          duration: 0.28,
          options: [.transitionCrossDissolve, .allowUserInteraction]
        ) {
          self.imageView.image = image
        }
      }
    }.resume()
  }

  private func normalized(_ uri: String?) -> String? {
    let trimmed = uri?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return trimmed.isEmpty ? nil : trimmed
  }

  private static func line(
    _ text: String,
    font: UIFont,
    lineHeight: CGFloat
  ) -> NSAttributedString {
    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
    return NSAttributedString(
      string: text,
      attributes: [.font: font, .paragraphStyle: paragraph]
    )
  }

  private static func image(fromDataUri uri: String?) -> UIImage? {
    guard
      let uri,
      uri.hasPrefix("data:"),
      let comma = uri.firstIndex(of: ","),
      let data = Data(base64Encoded: String(uri[uri.index(after: comma)...]))
    else { return nil }
    return UIImage(data: data)
  }
}

final class YohakuListStretchCoverView: UIView {
  private let imageView = UIImageView()
  private let blurView = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
  private var loadGeneration = 0
  private var placeholderImage: UIImage?
  private var loadedUri: String?

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isHidden = true
    clipsToBounds = true
    imageView.contentMode = .scaleAspectFill
    imageView.clipsToBounds = true
    blurView.alpha = 0
    addSubview(imageView)
    addSubview(blurView)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    imageView.frame = bounds
    blurView.frame = bounds
  }

  func setBlurOpacity(_ opacity: CGFloat) {
    blurView.alpha = opacity
  }

  func setPlaceholder(_ uri: String?) {
    placeholderImage = Self.image(fromDataUri: uri)
    if loadedUri == nil { imageView.image = placeholderImage }
  }

  func setUri(_ uri: String?) {
    loadGeneration += 1
    let generation = loadGeneration
    let trimmed = uri?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let next = trimmed.isEmpty ? nil : trimmed
    if next != loadedUri {
      loadedUri = nil
      imageView.image = placeholderImage
    }
    guard let next, let url = URL(string: next) else { return }
    URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
      guard
        let self,
        let data,
        let image = UIImage(data: data),
        generation == self.loadGeneration
      else { return }
      DispatchQueue.main.async {
        guard generation == self.loadGeneration else { return }
        self.loadedUri = next
        UIView.transition(
          with: self.imageView,
          duration: 0.28,
          options: [.transitionCrossDissolve, .allowUserInteraction]
        ) {
          self.imageView.image = image
        }
      }
    }.resume()
  }

  private static func image(fromDataUri uri: String?) -> UIImage? {
    guard
      let uri,
      uri.hasPrefix("data:"),
      let comma = uri.firstIndex(of: ","),
      let data = Data(base64Encoded: String(uri[uri.index(after: comma)...]))
    else { return nil }
    return UIImage(data: data)
  }
}

private final class YohakuNoteHeroSlotState {
  weak var view: UIView?
  var blur: CGFloat = 0
  var frame: CGRect = .zero
}

private final class YohakuSharedNoteHeroEntry {
  let detail = YohakuNoteHeroSlotState()
  let hero = YohakuNoteHeroView()
  let list = YohakuNoteHeroSlotState()
  var handledTransition: ObjectIdentifier?
  var ownerRole: YohakuNoteHeroSlotRole?
  var preparedRole: YohakuNoteHeroSlotRole?
  var transitioning = false
}

final class YohakuSharedNoteHeroCoordinator {
  static let shared = YohakuSharedNoteHeroCoordinator()

  private var entries: [String: YohakuSharedNoteHeroEntry] = [:]

  func update(
    slot: UIView,
    role: YohakuNoteHeroSlotRole,
    spec: YohakuNoteHeroSpec?,
    titleColor: UIColor?,
    metaColor: UIColor?,
    frame: CGRect,
    blur: CGFloat
  ) {
    let noteID = spec?.id.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    unregister(slot: slot, except: noteID.isEmpty ? nil : noteID)
    guard let spec, !noteID.isEmpty else { return }

    let entry = entries[noteID] ?? YohakuSharedNoteHeroEntry()
    entries[noteID] = entry
    let state = state(for: role, in: entry)
    state.view = slot
    state.frame = frame
    state.blur = blur
    entry.hero.update(spec: spec, titleColor: titleColor, metaColor: metaColor)
    present(entry)
  }

  func prepareTransition(noteID: String) {
    if let entry = entries[noteID], entry.preparedRole != nil {
      present(entry)
      return
    }
    guard
      let entry = entries[noteID],
      !entry.transitioning,
      let role = currentRole(entry),
      let slot = state(for: role, in: entry).view,
      isVisible(slot)
    else { return }

    entry.ownerRole = role
    entry.preparedRole = role
    let controller = viewController(for: slot)
    guard let container = controller?.navigationController?.view ?? slot.window else {
      return
    }
    let frame = entry.hero.convert(entry.hero.bounds, to: container)
    entry.hero.removeFromSuperview()
    entry.hero.frame = frame
    if let navigation = controller?.navigationController,
      navigation.navigationBar.superview === container
    {
      container.insertSubview(entry.hero, belowSubview: navigation.navigationBar)
    } else {
      container.addSubview(entry.hero)
    }
    present(entry)
  }

  func unregister(slot: UIView) {
    unregister(slot: slot, except: nil)
  }

  private func unregister(slot: UIView, except noteID: String?) {
    var emptyKeys: [String] = []
    for (key, entry) in entries where key != noteID {
      if entry.list.view === slot {
        entry.list.view = nil
        if entry.ownerRole == .list { entry.ownerRole = nil }
      }
      if entry.detail.view === slot {
        entry.detail.view = nil
        if entry.ownerRole == .detail { entry.ownerRole = nil }
      }
      if entry.hero.superview === slot {
        entry.hero.removeFromSuperview()
      }
      if noteID != nil,
        entry.list.view == nil,
        entry.detail.view == nil,
        !entry.transitioning
      {
        emptyKeys.append(key)
      } else if !entry.transitioning {
        present(entry)
      }
    }
    for key in emptyKeys {
      entries.removeValue(forKey: key)
    }
  }

  private func present(_ entry: YohakuSharedNoteHeroEntry) {
    guard !entry.transitioning else { return }
    if startNavigationTransition(entry) { return }
    if entry.preparedRole != nil { return }

    if let role = currentRole(entry), isVisible(state(for: role, in: entry).view) {
      attach(entry, to: role)
    } else if isVisible(entry.detail.view) {
      attach(entry, to: .detail)
    } else if isVisible(entry.list.view) {
      attach(entry, to: .list)
    } else {
      entry.hero.removeFromSuperview()
      entry.ownerRole = nil
    }
  }

  private func startNavigationTransition(_ entry: YohakuSharedNoteHeroEntry) -> Bool {
    guard
      let listView = entry.list.view,
      let detailView = entry.detail.view,
      let listController = viewController(for: listView),
      let detailController = viewController(for: detailView),
      let transition = detailController.transitionCoordinator
        ?? listController.transitionCoordinator,
      let fromController = transition.viewController(forKey: .from),
      let toController = transition.viewController(forKey: .to),
      let navigation = detailController.navigationController
        ?? listController.navigationController,
      navigation.navigationBar.superview === navigation.view
    else { return false }

    let transitionID = ObjectIdentifier(transition as AnyObject)
    guard entry.handledTransition != transitionID else { return false }

    let fromRole: YohakuNoteHeroSlotRole
    let toRole: YohakuNoteHeroSlotRole
    if listView.isDescendant(of: fromController.view),
      detailView.isDescendant(of: toController.view)
    {
      fromRole = .list
      toRole = .detail
    } else if detailView.isDescendant(of: fromController.view),
      listView.isDescendant(of: toController.view)
    {
      fromRole = .detail
      toRole = .list
    } else {
      return false
    }

    let from = state(for: fromRole, in: entry)
    let to = state(for: toRole, in: entry)
    guard
      entry.preparedRole == fromRole || entry.hero.superview === from.view,
      isVisible(from.view)
    else { return false }

    let container = navigation.view!
    let startFrame = entry.hero.convert(entry.hero.bounds, to: container)
    var endFrame = to.frame
    if toRole == .detail, !entry.hero.hasCover {
      endFrame.origin.y =
        navigation.navigationBar.convert(
          navigation.navigationBar.bounds,
          to: container
        ).maxY
    }
    entry.handledTransition = transitionID
    entry.transitioning = true
    entry.hero.removeFromSuperview()
    entry.hero.frame = startFrame
    entry.hero.setBlurOpacity(from.blur)
    entry.hero.setRole(toRole)
    container.insertSubview(entry.hero, belowSubview: navigation.navigationBar)

    let started = transition.animate(
      alongsideTransition: { _ in
        container.bringSubviewToFront(entry.hero)
        container.bringSubviewToFront(navigation.navigationBar)
        entry.hero.frame = endFrame
        entry.hero.setBlurOpacity(to.blur)
      },
      completion: { [weak self, weak entry] context in
        guard let self, let entry else { return }
        entry.transitioning = false
        entry.preparedRole = nil
        self.attach(entry, to: context.isCancelled ? fromRole : toRole)
      }
    )
    if !started {
      entry.transitioning = false
      entry.preparedRole = nil
      attach(entry, to: toRole)
    }
    return started
  }

  private func attach(
    _ entry: YohakuSharedNoteHeroEntry,
    to role: YohakuNoteHeroSlotRole
  ) {
    let state = state(for: role, in: entry)
    guard let slot = state.view else {
      entry.hero.removeFromSuperview()
      entry.ownerRole = nil
      return
    }
    if entry.hero.superview !== slot {
      entry.hero.removeFromSuperview()
      slot.insertSubview(entry.hero, at: 0)
    }
    entry.hero.frame = state.frame
    entry.hero.setBlurOpacity(state.blur)
    entry.hero.setRole(role)
    entry.ownerRole = role
  }

  private func currentRole(
    _ entry: YohakuSharedNoteHeroEntry
  ) -> YohakuNoteHeroSlotRole? {
    if entry.hero.superview === entry.detail.view { return .detail }
    if entry.hero.superview === entry.list.view { return .list }
    return nil
  }

  private func state(
    for role: YohakuNoteHeroSlotRole,
    in entry: YohakuSharedNoteHeroEntry
  ) -> YohakuNoteHeroSlotState {
    role == .list ? entry.list : entry.detail
  }

  private func viewController(for view: UIView) -> UIViewController? {
    var responder: UIResponder? = view
    while let current = responder {
      if let controller = current as? UIViewController { return controller }
      responder = current.next
    }
    return nil
  }

  private func isVisible(_ view: UIView?) -> Bool {
    guard
      let view,
      let window = view.window,
      !view.isHidden,
      view.alpha > 0.01
    else { return false }
    let frame = view.convert(view.bounds, to: window)
    let intersection = frame.intersection(window.bounds)
    return !intersection.isNull && intersection.width > 1 && intersection.height > 1
  }
}
