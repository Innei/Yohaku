import ExpoModulesCore
import ImageIO
import UIKit

/// The native, collapsed avatar used by the Settings peer header.
///
/// Its rendering contract follows Telegram's `AvatarNode`: the view owns image
/// loading, display-size decoding, aspect-fill layout, circular clipping, and a
/// deterministic initials placeholder. React supplies peer data and layout only.
final class SettingsAvatarView: ExpoView {
  private static let maximumImageBytes = 20 * 1024 * 1024
  private static let imageCache = NSCache<NSString, UIImage>()
  private static let gradientColors: [[UIColor]] = [
    [UIColor(red: 1, green: 0.318, blue: 0.416, alpha: 1),
     UIColor(red: 1, green: 0.533, blue: 0.369, alpha: 1)],
    [UIColor(red: 1, green: 0.659, blue: 0.361, alpha: 1),
     UIColor(red: 1, green: 0.804, blue: 0.416, alpha: 1)],
    [UIColor(red: 0.4, green: 0.373, blue: 1, alpha: 1),
     UIColor(red: 0.51, green: 0.694, blue: 1, alpha: 1)],
    [UIColor(red: 0.329, green: 0.796, blue: 0.408, alpha: 1),
     UIColor(red: 0.627, green: 0.871, blue: 0.494, alpha: 1)],
    [UIColor(red: 0.29, green: 0.8, blue: 0.804, alpha: 1),
     UIColor(red: 0, green: 0.988, blue: 0.992, alpha: 1)],
    [UIColor(red: 0.165, green: 0.62, blue: 0.945, alpha: 1),
     UIColor(red: 0.447, green: 0.835, blue: 0.992, alpha: 1)],
    [UIColor(red: 0.839, green: 0.412, blue: 0.929, alpha: 1),
     UIColor(red: 0.878, green: 0.635, blue: 0.953, alpha: 1)],
  ]

  private let placeholderView = UIView()
  private let placeholderGradient = CAGradientLayer()
  private let placeholderLabel = UILabel()
  private let placeholderIcon = UIImageView()
  private let imageView = UIImageView()

  private var imageUrl = ""
  private var peerId = ""
  private var peerName = ""
  private var loadedKey: String?
  private var requestedKey: String?
  private var requestGeneration = 0
  private var requestTask: URLSessionDataTask?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    clipsToBounds = true
    isAccessibilityElement = true
    accessibilityTraits = .image

    placeholderGradient.startPoint = CGPoint(x: 0.5, y: 0)
    placeholderGradient.endPoint = CGPoint(x: 0.5, y: 1)
    placeholderView.layer.addSublayer(placeholderGradient)

    placeholderLabel.adjustsFontForContentSizeCategory = true
    placeholderLabel.adjustsFontSizeToFitWidth = true
    placeholderLabel.baselineAdjustment = .alignCenters
    placeholderLabel.minimumScaleFactor = 0.65
    placeholderLabel.textAlignment = .center
    placeholderLabel.textColor = .white

    let iconConfiguration = UIImage.SymbolConfiguration(pointSize: 40, weight: .regular)
    placeholderIcon.image = UIImage(
      systemName: "person.fill",
      withConfiguration: iconConfiguration
    )
    placeholderIcon.contentMode = .center
    placeholderIcon.tintColor = UIColor.white.withAlphaComponent(0.82)

    imageView.contentMode = .scaleAspectFill
    imageView.isAccessibilityElement = false
    imageView.isHidden = true

    addSubview(placeholderView)
    placeholderView.addSubview(placeholderLabel)
    placeholderView.addSubview(placeholderIcon)
    addSubview(imageView)

    updatePlaceholder()
  }

  deinit {
    requestTask?.cancel()
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    placeholderView.frame = bounds
    placeholderGradient.frame = placeholderView.bounds
    placeholderLabel.frame = placeholderView.bounds.insetBy(dx: 12, dy: 12)
    placeholderIcon.frame = placeholderView.bounds
    imageView.frame = bounds

    let diameter = min(bounds.width, bounds.height)
    layer.cornerRadius = diameter / 2
    placeholderGradient.cornerRadius = diameter / 2
    placeholderLabel.font = roundedPlaceholderFont(
      size: floor(diameter * 16 / 37)
    )

    loadImageIfNeeded()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      requestTask?.cancel()
      requestTask = nil
      requestedKey = nil
    } else {
      loadImageIfNeeded()
    }
  }

  func setAccessibilityLabel(_ label: String) {
    accessibilityLabel = label
  }

  func setImageUrl(_ value: String) {
    guard imageUrl != value else { return }
    imageUrl = value
    resetImageRequest()
  }

  func setPeerId(_ value: String) {
    guard peerId != value else { return }
    peerId = value
    updatePlaceholder()
  }

  func setPeerName(_ value: String) {
    guard peerName != value else { return }
    peerName = value
    updatePlaceholder()
  }

  private func resetImageRequest() {
    requestGeneration += 1
    requestTask?.cancel()
    requestTask = nil
    requestedKey = nil
    loadedKey = nil
    imageView.image = nil
    imageView.isHidden = true
    placeholderView.isHidden = false
    loadImageIfNeeded()
  }

  private func loadImageIfNeeded() {
    guard window != nil, !imageUrl.isEmpty else { return }
    let pointSize = min(bounds.width, bounds.height)
    guard pointSize > 0 else { return }

    let scale = window?.windowScene?.screen.scale ?? traitCollection.displayScale
    let maximumPixelSize = max(1, Int(ceil(pointSize * scale)))
    let cacheKey = "\(imageUrl)#\(maximumPixelSize)"
    guard cacheKey != loadedKey, cacheKey != requestedKey else { return }

    requestGeneration += 1
    let generation = requestGeneration
    requestTask?.cancel()
    requestTask = nil
    requestedKey = cacheKey

    if let cached = Self.imageCache.object(forKey: cacheKey as NSString) {
      install(image: cached, key: cacheKey, generation: generation)
      return
    }

    guard let url = URL(string: imageUrl) else {
      finishFailedRequest(key: cacheKey, generation: generation)
      return
    }

    if url.isFileURL {
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        let data = try? Data(contentsOf: url, options: [.mappedIfSafe])
        self?.decode(
          data: data,
          key: cacheKey,
          generation: generation,
          maximumPixelSize: maximumPixelSize
        )
      }
      return
    }

    guard let scheme = url.scheme?.lowercased(), scheme == "https" || scheme == "http" else {
      finishFailedRequest(key: cacheKey, generation: generation)
      return
    }

    var request = URLRequest(url: url)
    request.cachePolicy = .returnCacheDataElseLoad
    request.timeoutInterval = 20
    requestTask = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard error == nil else {
        DispatchQueue.main.async {
          self?.finishFailedRequest(key: cacheKey, generation: generation)
        }
        return
      }
      if let response = response as? HTTPURLResponse,
        !(200..<300).contains(response.statusCode)
      {
        DispatchQueue.main.async {
          self?.finishFailedRequest(key: cacheKey, generation: generation)
        }
        return
      }
      self?.decode(
        data: data,
        key: cacheKey,
        generation: generation,
        maximumPixelSize: maximumPixelSize
      )
    }
    requestTask?.resume()
  }

  private func decode(
    data: Data?,
    key: String,
    generation: Int,
    maximumPixelSize: Int
  ) {
    guard let data, !data.isEmpty, data.count <= Self.maximumImageBytes,
      let image = Self.downsampledImage(data: data, maximumPixelSize: maximumPixelSize)
    else {
      DispatchQueue.main.async { [weak self] in
        self?.finishFailedRequest(key: key, generation: generation)
      }
      return
    }

    let cost = image.cgImage.map { $0.bytesPerRow * $0.height } ?? data.count
    Self.imageCache.setObject(image, forKey: key as NSString, cost: cost)
    DispatchQueue.main.async { [weak self] in
      self?.install(image: image, key: key, generation: generation)
    }
  }

  private func install(image: UIImage, key: String, generation: Int) {
    guard generation == requestGeneration, key == requestedKey else { return }
    requestTask = nil
    requestedKey = nil
    loadedKey = key
    imageView.image = image
    imageView.backgroundColor = .red
    imageView.isHidden = false
    placeholderView.isHidden = true
    bringSubviewToFront(imageView)
  }

  private func finishFailedRequest(key: String, generation: Int) {
    guard generation == requestGeneration, key == requestedKey else { return }
    requestTask = nil
    requestedKey = nil
  }

  private func updatePlaceholder() {
    let letters = Self.initials(from: peerName)
    placeholderLabel.text = letters
    placeholderLabel.isHidden = letters.isEmpty
    placeholderIcon.isHidden = !letters.isEmpty

    let colors: [UIColor]
    if peerId.isEmpty {
      colors = [UIColor(white: 0.69, alpha: 1), UIColor(white: 0.8, alpha: 1)]
    } else {
      let index = Int(Self.stableHash(peerId) % UInt64(Self.gradientColors.count))
      colors = Self.gradientColors[index]
    }
    placeholderGradient.colors = colors.map(\.cgColor)
  }

  private func roundedPlaceholderFont(size: CGFloat) -> UIFont {
    let base = UIFont.systemFont(ofSize: size, weight: .bold)
    guard let descriptor = base.fontDescriptor.withDesign(.rounded) else { return base }
    return UIFont(descriptor: descriptor, size: size)
  }

  private static func initials(from name: String) -> String {
    let parts = name.split(whereSeparator: { $0.isWhitespace })
    guard let first = parts.first?.first else { return "" }
    if parts.count > 1, let last = parts.last?.first {
      return String(first).uppercased() + String(last).uppercased()
    }
    return String(first).uppercased()
  }

  private static func stableHash(_ value: String) -> UInt64 {
    var hash: UInt64 = 1_469_598_103_934_665_603
    for byte in value.utf8 {
      hash ^= UInt64(byte)
      hash &*= 1_099_511_628_211
    }
    return hash
  }

  private static func downsampledImage(data: Data, maximumPixelSize: Int) -> UIImage? {
    let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
    guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions) else {
      return nil
    }
    let thumbnailOptions = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceThumbnailMaxPixelSize: maximumPixelSize,
    ] as CFDictionary
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbnailOptions) else {
      return nil
    }
    return UIImage(cgImage: image)
  }
}
