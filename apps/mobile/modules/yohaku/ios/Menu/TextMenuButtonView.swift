import ExpoModulesCore
import UIKit

/// Transparent text trigger that presents a native `UIMenu` as the primary action.
final class TextMenuButtonView: ExpoView {
  private let button = UIButton(type: .system)
  private var menuItems: [NavigationHeaderMenuItemSpec] = []
  private var titleText = ""
  private var titleColor: UIColor = .secondaryLabel
  private var titleSize: CGFloat = 13
  private var disabled = false

  let onMenuAction = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    isOpaque = false
    button.configuration = makeConfiguration()
    button.preferredMenuElementOrder = .fixed
    addSubview(button)
    refresh()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    button.frame = bounds
  }

  func setAccessibilityLabel(_ label: String) {
    button.accessibilityLabel = label
  }

  func setDisabled(_ isDisabled: Bool) {
    disabled = isDisabled
    refresh()
  }

  func setMenuItems(_ items: [NavigationHeaderMenuItemSpec]) {
    menuItems = items
    refresh()
  }

  func setTitle(_ title: String) {
    titleText = title
    refresh()
  }

  func setTitleColor(_ color: UIColor?) {
    titleColor = color ?? .secondaryLabel
    refresh()
  }

  func setTitleSize(_ size: Double) {
    titleSize = CGFloat(size)
    refresh()
  }

  private func refresh() {
    button.isEnabled = !disabled
    button.alpha = disabled ? 0.4 : 1
    button.configuration = makeConfiguration()
    let menu = makeYohakuMenu(items: menuItems) { [weak self] id in
      self?.onMenuAction(["id": id])
    }
    button.menu = disabled ? nil : menu
    button.showsMenuAsPrimaryAction = !disabled && !menu.children.isEmpty
  }

  private func makeConfiguration() -> UIButton.Configuration {
    var config = UIButton.Configuration.plain()
    config.contentInsets = .zero
    config.title = titleText
    config.baseForegroundColor = titleColor
    let pointSize = titleSize
    config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = UIFont.monospacedDigitSystemFont(ofSize: pointSize, weight: .medium)
      return outgoing
    }
    let chevron = UIImage.SymbolConfiguration(
      pointSize: max(8, titleSize - 5),
      weight: .semibold
    )
    config.image = UIImage(systemName: "chevron.down", withConfiguration: chevron)
    config.imagePlacement = .trailing
    config.imagePadding = 3
    return config
  }
}
