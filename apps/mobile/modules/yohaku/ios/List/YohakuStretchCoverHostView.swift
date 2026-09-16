import ExpoModulesCore
import UIKit

final class YohakuNoteHeroHostView: ExpoView, YohakuNativeScrollConsumer {
  private let noteHeroSlot = UIView()
  private var noteHero = YohakuNoteHeroSpec()
  private var noteHeroRole: YohakuNoteHeroSlotRole = .detail
  private var noteHeroContentInsetTop: CGFloat = 0
  private var noteHeroMetaColor: UIColor?
  private var noteHeroTitleColor: UIColor?
  private weak var observedScroll: UIScrollView?
  private var topBlur: VariableBlurEdgeView?
  private var topBlurHeight: CGFloat = 0

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    noteHeroSlot.isUserInteractionEnabled = false
    addSubview(noteHeroSlot)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    updateNoteHero()
  }

  deinit {
    YohakuSharedNoteHeroCoordinator.shared.unregister(slot: noteHeroSlot)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    // Fabric uses UIView indices as React child indices. The hero occupies 0.
    super.mountChildComponentView(childComponentView, index: index + 1)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    super.unmountChildComponentView(childComponentView, index: index + 1)
    if observedScroll == nil || observedScroll?.isDescendant(of: self) == false {
      observedScroll = nil
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    noteHeroSlot.frame = bounds
    if let topBlur {
      topBlur.frame = CGRect(x: 0, y: 0, width: bounds.width, height: topBlurHeight)
      bringSubviewToFront(topBlur)
    }
    updateNoteHero()
  }

  func setNoteHeroRole(_ value: String) {
    noteHeroRole = value == "list" ? .list : .detail
    updateNoteHero()
  }

  func setNoteHeroContentInsetTop(_ value: Double) {
    noteHeroContentInsetTop = CGFloat(value)
    updateNoteHero()
  }

  func setNoteHeroCoverPlaceholderUri(_ value: String?) {
    noteHero.coverPlaceholderUri = value
    updateNoteHero()
  }

  func setNoteHeroCoverUri(_ value: String?) {
    noteHero.coverUri = value
    updateNoteHero()
  }

  func setNoteHeroHeight(_ value: Double) {
    if value > 0 { noteHero.height = value }
    updateNoteHero()
  }

  func setNoteHeroID(_ value: String?) {
    noteHero.id = value ?? ""
    updateNoteHero()
  }

  func setNoteHeroMeta(_ value: String?) {
    noteHero.meta = value ?? ""
    updateNoteHero()
  }

  func setNoteHeroMetaColor(_ value: UIColor?) {
    noteHeroMetaColor = value
    updateNoteHero()
  }

  func setNoteHeroTitle(_ value: String?) {
    noteHero.title = value ?? ""
    updateNoteHero()
  }

  func setNoteHeroTitleColor(_ value: UIColor?) {
    noteHeroTitleColor = value
    updateNoteHero()
  }

  func nativeScrollDidChange(_ scroll: UIScrollView) {
    if observedScroll !== scroll {
      observedScroll = scroll
      YohakuScrollEdges.hideTop(scroll)
    }
    updateNoteHero()
  }

  func nativeScrollDidDetach(_ scroll: UIScrollView) {
    if observedScroll === scroll { observedScroll = nil }
  }

  func setNativeTopBlurHeight(_ value: Double) {
    topBlurHeight = max(0, CGFloat(value))
    if topBlur == nil, topBlurHeight > 0 {
      let blur = VariableBlurEdgeView(appContext: appContext)
      topBlur = blur
      blur.setReadabilityColor(nativeTopBlurReadabilityColor)
      blur.setNavigationForegroundColor(nativeTopBlurForegroundColor)
      addSubview(blur)
    }
    topBlur?.isHidden = topBlurHeight == 0
    setNeedsLayout()
    updateNoteHero()
  }

  func setNativeTopBlurReadabilityColor(_ color: UIColor?) {
    // Colors may arrive before the height prop.
    nativeTopBlurReadabilityColor = color
    topBlur?.setReadabilityColor(color)
  }

  func setNativeTopBlurForegroundColor(_ color: UIColor?) {
    nativeTopBlurForegroundColor = color
    topBlur?.setNavigationForegroundColor(color)
  }

  private var nativeTopBlurReadabilityColor: UIColor?
  private var nativeTopBlurForegroundColor: UIColor?

  private func updateNoteHero() {
    let offsetY = observedScroll?.contentOffset.y ?? 0
    let topInset = observedScroll?.adjustedContentInset.top ?? 0
    let progress = min(1, max(0, (offsetY + topInset) / 32))
    topBlur?.setProgress(Double(progress * progress * (3 - 2 * progress)))
    let hasCover =
      noteHero.coverUri?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
      == false
    let laid = YohakuNoteHeroLayout.frame(
      cellY: noteHeroRole == .list
        ? noteHeroContentInsetTop - offsetY
        : (hasCover ? -topInset - offsetY : -offsetY),
      heroHeight: CGFloat(noteHero.height),
      width: bounds.width,
      stretches: hasCover,
      // The list includes padding and UIKit's resting top inset in cellY.
      // They extend the cover behind the header, but are not a pull gesture.
      restingCellY: noteHeroRole == .list ? noteHeroContentInsetTop + topInset : 0
    )
    YohakuSharedNoteHeroCoordinator.shared.update(
      slot: noteHeroSlot,
      role: noteHeroRole,
      spec: noteHero.id.isEmpty ? nil : noteHero,
      titleColor: noteHeroTitleColor,
      metaColor: noteHeroMetaColor,
      frame: laid.frame,
      blur: laid.blur
    )
  }
}

final class YohakuStretchCoverHostView: ExpoView, YohakuNativeScrollConsumer {
  private let stretchCover = YohakuListStretchCoverView()
  private var stretchCoverHeight: CGFloat = 248
  private var stretchCoverUri: String?
  private var stretchAnchorY: CGFloat = 0
  private weak var observedScroll: UIScrollView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    addSubview(stretchCover)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    super.mountChildComponentView(childComponentView, index: index + 1)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    super.unmountChildComponentView(childComponentView, index: index + 1)
    if observedScroll == nil || observedScroll?.isDescendant(of: self) == false {
      observedScroll = nil
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateStretchCover()
  }

  func setStretchCoverPlaceholderUri(_ value: String?) {
    stretchCover.setPlaceholder(value)
    updateStretchCover()
  }

  func setStretchCoverUri(_ value: String?) {
    let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let uri = trimmed.isEmpty ? nil : trimmed
    guard uri != stretchCoverUri else {
      updateStretchCover()
      return
    }
    stretchCoverUri = uri
    stretchCover.setUri(uri)
    updateStretchCover()
  }

  func setStretchCoverHeight(_ value: Double) {
    if value > 0 { stretchCoverHeight = CGFloat(value) }
    updateStretchCover()
  }

  func setStretchCoverAnchorY(_ value: Double) {
    stretchAnchorY = CGFloat(value)
    updateStretchCover()
  }

  func nativeScrollDidChange(_ scroll: UIScrollView) {
    if observedScroll !== scroll {
      observedScroll = scroll
      YohakuScrollEdges.hideTop(scroll)
    }
    updateStretchCover()
  }

  func nativeScrollDidDetach(_ scroll: UIScrollView) {
    if observedScroll === scroll { observedScroll = nil }
  }

  private func updateStretchCover() {
    guard stretchCoverUri != nil else {
      stretchCover.isHidden = true
      return
    }
    let offsetY = observedScroll?.contentOffset.y ?? 0
    let laid = YohakuNoteHeroLayout.frame(
      cellY: stretchAnchorY - offsetY,
      heroHeight: stretchCoverHeight,
      width: bounds.width,
      stretches: true
    )
    stretchCover.isHidden = false
    stretchCover.frame = laid.frame
    stretchCover.setBlurOpacity(laid.blur)
  }
}
