import ExpoModulesCore
import UIKit

struct NavigationHeaderMenuItemSpec: Record {
  @Field var hidden: Bool = false
  @Field var icon: String?
  @Field var id: String = ""
  @Field var title: String = ""
}

/// A solid Paper control used by the legacy navigation header.
///
/// The view customizes only the visual trigger. Navigation ownership remains
/// with UIKit, and menu actions continue to use a native `UIMenu`.
final class NavigationHeaderControlView: ExpoView {
  private let button = UIButton(type: .custom)
  private let feedback = UIImpactFeedbackGenerator(style: .light)
  private var controlKind = "button"
  private var cornerRadius: CGFloat = 14
  private var iconName = ""
  private var menuItems: [NavigationHeaderMenuItemSpec] = []
  private var hapticEnabled = true
  private var restingShadowOpacity: Float = 0

  let onMenuAction = EventDispatcher()
  let onNativePress = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    isAccessibilityElement = false
    isOpaque = false
    layer.masksToBounds = false
    layer.shadowColor = UIColor.black.cgColor
    layer.shadowOffset = CGSize(width: 0, height: 4)
    layer.shadowRadius = 8

    button.adjustsImageWhenHighlighted = false
    button.backgroundColor = .secondarySystemBackground
    button.contentHorizontalAlignment = .center
    button.contentVerticalAlignment = .center
    button.isAccessibilityElement = true
    button.tintColor = .label
    button.layer.borderWidth = 0.5
    button.layer.cornerCurve = .continuous
    button.layer.masksToBounds = true

    button.addTarget(self, action: #selector(handlePrimaryAction), for: .touchUpInside)
    button.addTarget(self, action: #selector(handleTouchDown), for: .touchDown)
    button.addTarget(
      self,
      action: #selector(handleTouchUp),
      for: [.touchUpInside, .touchUpOutside, .touchCancel]
    )
    addSubview(button)
  }

  override var intrinsicContentSize: CGSize {
    CGSize(width: 40, height: 40)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    button.frame = bounds
    button.layer.cornerRadius = cornerRadius
    layer.shadowPath = UIBezierPath(
      roundedRect: bounds,
      cornerRadius: cornerRadius
    ).cgPath
  }

  func setAccessibilityIdentifier(_ identifier: String) {
    button.accessibilityIdentifier = identifier
  }

  func setControlKind(_ kind: String) {
    controlKind = kind
    updateMenu()
  }

  func setControlLabel(_ label: String) {
    button.accessibilityLabel = label
  }

  func setCornerRadius(_ radius: Double) {
    cornerRadius = CGFloat(radius)
    setNeedsLayout()
  }

  func setHapticEnabled(_ enabled: Bool) {
    hapticEnabled = enabled
  }

  func setIconColor(_ color: UIColor?) {
    button.tintColor = color ?? .label
  }

  func setIconName(_ name: String) {
    iconName = name
    updateIcon()
  }

  func setMenuItems(_ items: [NavigationHeaderMenuItemSpec]) {
    menuItems = items
    updateMenu()
  }

  func setPaperColor(_ color: UIColor?) {
    button.backgroundColor = color ?? .secondarySystemBackground
  }

  func setRingColor(_ color: UIColor?) {
    button.layer.borderColor = (color ?? .separator).cgColor
  }

  func setShadowOpacity(_ opacity: Double) {
    restingShadowOpacity = Float(min(1, max(0, opacity)))
    layer.shadowOpacity = restingShadowOpacity
  }

  @objc private func handlePrimaryAction() {
    guard controlKind != "menu" else { return }
    onNativePress()
  }

  @objc private func handleTouchDown() {
    if hapticEnabled {
      feedback.prepare()
      feedback.impactOccurred()
    }
    UIView.animate(
      withDuration: 0.12,
      delay: 0,
      options: [.allowUserInteraction, .beginFromCurrentState]
    ) {
      self.button.transform = CGAffineTransform(scaleX: 0.985, y: 0.985)
      self.layer.shadowOpacity = self.restingShadowOpacity * 0.55
    }
  }

  @objc private func handleTouchUp() {
    UIView.animate(
      withDuration: 0.32,
      delay: 0,
      usingSpringWithDamping: 0.82,
      initialSpringVelocity: 0,
      options: [.allowUserInteraction, .beginFromCurrentState]
    ) {
      self.button.transform = .identity
      self.layer.shadowOpacity = self.restingShadowOpacity
    }
  }

  private func updateIcon() {
    let configuration = UIImage.SymbolConfiguration(pointSize: 17, weight: .medium)
    button.setImage(
      UIImage(systemName: iconName, withConfiguration: configuration),
      for: .normal
    )
  }

  private func updateMenu() {
    guard controlKind == "menu" else {
      button.menu = nil
      button.showsMenuAsPrimaryAction = false
      return
    }

    let actions = menuItems
      .filter { !$0.hidden && !$0.id.isEmpty && !$0.title.isEmpty }
      .map { item in
        UIAction(
          title: item.title,
          image: item.icon.flatMap { UIImage(systemName: $0) }
        ) { [weak self] _ in
          self?.onMenuAction(["id": item.id])
        }
      }

    button.menu = UIMenu(children: actions)
    button.preferredMenuElementOrder = .fixed
    button.showsMenuAsPrimaryAction = !actions.isEmpty
  }
}
