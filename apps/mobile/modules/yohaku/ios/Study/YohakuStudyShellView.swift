import ExpoModulesCore
import UIKit

private final class YohakuStudyContentHost: UIView {
  var onChildLayout: (() -> Void)?

  override func layoutSubviews() {
    super.layoutSubviews()
    onChildLayout?()
  }
}

private final class YohakuStudyPage {
  let scroll = UIScrollView()
  let avatar: SettingsAvatarView
  let placeholder = UIView()
  let contentHost = YohakuStudyContentHost()
  private var collapseDistance: CGFloat = 120

  init(appContext: AppContext?) {
    avatar = SettingsAvatarView(appContext: appContext)
    scroll.alwaysBounceVertical = true
    scroll.showsHorizontalScrollIndicator = false
    scroll.contentInsetAdjustmentBehavior = .never
    scroll.contentInset = .zero
    scroll.backgroundColor = .clear
    scroll.clipsToBounds = true
    YohakuScrollEdges.navigation(scroll)

    placeholder.clipsToBounds = true
    placeholder.isUserInteractionEnabled = false
    avatar.isUserInteractionEnabled = false

    scroll.addSubview(placeholder)
    scroll.addSubview(avatar)
    scroll.addSubview(contentHost)
  }

  func setCollapseDistance(_ value: CGFloat) {
    collapseDistance = value
    avatar.setCollapseDistance(Double(value))
  }

  func setImageUri(_ value: String) {
    let hasImage = !value.isEmpty
    avatar.isHidden = !hasImage
    placeholder.isHidden = hasImage
    if hasImage {
      avatar.setImageUri(value)
    } else {
      avatar.setImageUri("")
    }
  }

  func applyInsets(safeArea: UIEdgeInsets) {
    let bottom = max(safeArea.bottom, collapseDistance)
    let inset = UIEdgeInsets(top: safeArea.top, left: 0, bottom: bottom, right: 0)
    let displacement = scroll.contentOffset.y + scroll.contentInset.top
    let topChanged = scroll.contentInset.top != inset.top
    scroll.contentInset = inset
    scroll.verticalScrollIndicatorInsets = inset
    if topChanged {
      scroll.contentOffset.y = displacement - inset.top
    }
  }

  func layout(in bounds: CGRect) {
    let width = bounds.width
    let height = bounds.height
    guard width > 0, height > 0 else { return }
    scroll.frame = bounds

    let avatarSize: CGFloat = 100
    let avatarTop: CGFloat = 24
    let gap: CGFloat = 8
    let avatarFrame = CGRect(
      x: (width - avatarSize) / 2,
      y: avatarTop,
      width: avatarSize,
      height: avatarSize
    )
    avatar.frame = avatarFrame
    placeholder.frame = avatarFrame
    placeholder.layer.cornerRadius = avatarSize / 2

    let child = contentHost.subviews.first
    let childHeight = child?.frame.height ?? 0
    contentHost.frame = CGRect(
      x: 0,
      y: avatarFrame.maxY + gap,
      width: width,
      height: childHeight
    )
    if let child {
      child.frame = CGRect(x: 0, y: 0, width: width, height: childHeight)
    }

    // Keep enough vertical travel for the avatar collapse on short pages.
    let minHeight = max(0, height - scroll.contentInset.top + collapseDistance)
    scroll.contentSize = CGSize(
      width: width,
      height: max(contentHost.frame.maxY, minHeight)
    )
  }
}

final class YohakuStudyShellView: ExpoView {
  private let page: YohakuStudyPage

  required init(appContext: AppContext? = nil) {
    page = YohakuStudyPage(appContext: appContext)
    super.init(appContext: appContext)

    clipsToBounds = true
    backgroundColor = .clear
    addSubview(page.scroll)
    page.contentHost.onChildLayout = { [weak self] in
      self?.layoutPage()
    }
  }

  func setOwnerImageUri(_ value: String) {
    page.setImageUri(value)
  }

  func setRingColor(_ color: UIColor?) {
    page.avatar.setRingColor(color)
    page.placeholder.backgroundColor = color?.withAlphaComponent(0.18)
  }

  func setCollapseDistance(_ value: Double) {
    page.setCollapseDistance(CGFloat(value))
    layoutPage()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil else { return }
    layoutPage()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    layoutPage()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    layoutPage()
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    page.contentHost.addSubview(childComponentView)
    setNeedsLayout()
    layoutIfNeeded()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
    setNeedsLayout()
  }

  private func layoutPage() {
    page.applyInsets(safeArea: safeAreaInsets)
    page.layout(in: bounds)
  }
}
