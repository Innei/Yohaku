import ExpoModulesCore
import UIKit

final class DomRemoteImageView: ExpoView {
  private let imageView = UIImageView()
  private var uri: String?
  private var images: [String] = []
  private var index = 0
  private var contentFit = "cover"
  private var loadGeneration = 0

  private lazy var tapRecognizer = UITapGestureRecognizer(
    target: self,
    action: #selector(handleTap)
  )

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    imageView.contentMode = .scaleAspectFill
    imageView.clipsToBounds = true
    imageView.frame = bounds
    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(imageView)
    tapRecognizer.isEnabled = false
    addGestureRecognizer(tapRecognizer)
    isAccessibilityElement = true
    accessibilityTraits = .image
  }

  func setUri(_ value: String) {
    guard uri != value else { return }
    uri = value
    reload()
  }

  func setContentFit(_ value: String) {
    contentFit = value
    imageView.contentMode = contentMode(for: value)
  }

  func setImages(_ value: [String]) {
    images = value
    let previewable = !value.isEmpty
    tapRecognizer.isEnabled = previewable
    isUserInteractionEnabled = previewable
    accessibilityTraits = previewable ? [.image, .button] : .image
  }

  func setIndex(_ value: Int) {
    index = value
  }

  func setAccessibilityLabelValue(_ value: String?) {
    accessibilityLabel = value
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    imageView.frame = bounds
  }

  @objc
  private func handleTap() {
    guard !images.isEmpty else { return }
    DomImagePreviewDomain.present(
      from: self,
      urls: images,
      index: index,
      objectFit: contentFit,
      cornerRadius: layer.cornerRadius,
      preparedImage: imageView.image
    )
  }

  private func reload() {
    imageView.image = nil
    loadGeneration += 1
    let generation = loadGeneration
    guard let uri, let source = DomImageAssetSource.resolve(uri) else { return }

    if let prepared = DomImageAssetStore.shared.preparedImage(for: source) {
      imageView.image = prepared
      return
    }

    DomImageAssetStore.shared.prepareImage(for: source) { [weak self] image in
      guard let self, self.loadGeneration == generation, let image else { return }
      self.imageView.alpha = 0
      self.imageView.image = image
      UIView.animate(withDuration: 0.12) {
        self.imageView.alpha = 1
      }
    }
  }

  private func contentMode(for fit: String) -> UIView.ContentMode {
    switch fit {
    case "contain": return .scaleAspectFit
    case "fill": return .scaleToFill
    default: return .scaleAspectFill
    }
  }
}
