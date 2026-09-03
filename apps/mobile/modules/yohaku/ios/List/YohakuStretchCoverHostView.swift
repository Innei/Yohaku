import ExpoModulesCore
import UIKit

final class YohakuStretchCoverHostView: ExpoView {
  private let stretchCover = YohakuListStretchCoverView()
  private var stretchCoverHeight: CGFloat = 248
  private var stretchCoverUri: String?
  private var stretchAnchorY: CGFloat = 0
  private weak var observedScroll: UIScrollView?
  private var offsetObservation: NSKeyValueObservation?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    addSubview(stretchCover)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    attachScrollIfNeeded()
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    // Fabric uses UIView indices as React child indices. The cover occupies 0.
    super.mountChildComponentView(childComponentView, index: index + 1)
    attachScrollIfNeeded()
    DispatchQueue.main.async { [weak self] in
      self?.attachScrollIfNeeded()
    }
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    super.unmountChildComponentView(childComponentView, index: index + 1)
    if observedScroll == nil || observedScroll?.isDescendant(of: self) == false {
      detachScroll()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    attachScrollIfNeeded()
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
    if value > 0 {
      stretchCoverHeight = CGFloat(value)
    }
    updateStretchCover()
  }

  func setStretchCoverAnchorY(_ value: Double) {
    stretchAnchorY = CGFloat(value)
    updateStretchCover()
  }

  private func attachScrollIfNeeded() {
    let scroll = findScrollView()
    guard scroll !== observedScroll else { return }
    detachScroll()
    observedScroll = scroll
    offsetObservation = scroll?.observe(\.contentOffset, options: [.new]) {
      [weak self] _, _ in
      self?.updateStretchCover()
    }
    updateStretchCover()
  }

  private func detachScroll() {
    offsetObservation = nil
    observedScroll = nil
  }

  private func findScrollView() -> UIScrollView? {
    func walk(_ view: UIView) -> UIScrollView? {
      if view !== stretchCover, let scroll = view as? UIScrollView {
        return scroll
      }
      for child in view.subviews {
        if let scroll = walk(child) { return scroll }
      }
      return nil
    }
    return walk(self)
  }

  private func updateStretchCover() {
    guard stretchCoverUri != nil else {
      stretchCover.isHidden = true
      return
    }
    let offsetY = observedScroll?.contentOffset.y ?? 0
    let laid = YohakuStretchCoverLayout.frame(
      cellY: stretchAnchorY - offsetY,
      heroHeight: stretchCoverHeight,
      width: bounds.width
    )
    stretchCover.isHidden = false
    stretchCover.frame = laid.frame
    stretchCover.setBlurOpacity(laid.blur)
  }
}
