import UIKit

enum YohakuStretchCoverLayout {
  static let blurDistance: CGFloat = 56

  static func frame(
    cellY: CGFloat,
    heroHeight: CGFloat,
    width: CGFloat
  ) -> (frame: CGRect, blur: CGFloat) {
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
    if loadedUri == nil {
      imageView.image = placeholderImage
    }
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
