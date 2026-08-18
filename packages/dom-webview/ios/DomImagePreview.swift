import QuartzCore
import UIKit
import WebKit
import os

private struct DomImagePreviewRect: Decodable {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat

  var cgRect: CGRect {
    CGRect(x: x, y: y, width: width, height: height)
  }
}

private struct DomImagePreviewSourceLayout: Decodable {
  let currentSrc: String
  let rect: DomImagePreviewRect
  let objectFit: String?
  let objectPosition: String?
  let borderRadius: CGFloat?
}

private struct DomImagePreviewMessage: Decodable {
  let type: String
  let images: [String]?
  let index: Int?
  let src: String?
  let source: DomImagePreviewSourceLayout?
  let siteReferer: String?
}

enum DomImageFitMode: Equatable {
  case contain
  case cover
  case fill

  init(cssValue: String?) {
    switch cssValue {
    case "cover": self = .cover
    case "fill": self = .fill
    default: self = .contain
    }
  }
}

private struct DomImageDismissTransform {
  let scale: CGFloat
  let translation: CGPoint

  static let identity = DomImageDismissTransform(scale: 1, translation: .zero)

  var affineTransform: CGAffineTransform {
    CGAffineTransform(translationX: translation.x, y: translation.y)
      .scaledBy(x: scale, y: scale)
  }
}

private struct DomImageDismissState {
  let progress: CGFloat
  let transform: DomImageDismissTransform

  static let identity = DomImageDismissState(progress: 0, transform: .identity)
}

private enum DomImageDismissGeometry {
  static let commitProgress: CGFloat = 0.45
  static let commitVelocity: CGFloat = 1_200
  static let commitMinimumTranslation: CGFloat = 100

  static func dragState(
    translation: CGPoint,
    origin: DomImageDismissTransform = .identity,
    distance: CGFloat = 340,
    minimumScale: CGFloat = 0.68
  ) -> DomImageDismissState {
    let translationY = translation.y > 0 ? translation.y : translation.y / 3
    let resolvedTranslation = CGPoint(
      x: origin.translation.x + translation.x,
      y: origin.translation.y + translationY
    )
    let progress = min(max(resolvedTranslation.y / max(distance, 1), 0), 1)
    let scale = 1 - (1 - minimumScale) * progress
    return DomImageDismissState(
      progress: progress,
      transform: DomImageDismissTransform(
        scale: scale,
        translation: resolvedTranslation
      )
    )
  }

  static func shouldCommit(
    progress: CGFloat,
    translationY: CGFloat,
    velocityY: CGFloat
  ) -> Bool {
    progress > commitProgress
      || (velocityY > commitVelocity
        && translationY > commitMinimumTranslation)
  }
}

enum DomImagePreviewDomain {
  static let previewMessageType = "yohaku:image-preview"
  static let prewarmMessageType = "yohaku:image-preview-prewarm"

  private static let signpostLog = OSLog(
    subsystem: Bundle.main.bundleIdentifier ?? "com.yohaku.mobile",
    category: "ImagePreview"
  )
  private static let snapshotCache = NSCache<NSString, UIImage>()
  private static var coordinator: DomImagePreviewCoordinator?
  private static var pendingPresentationID: UUID?
  private static var pendingResolve: ((UIImage?) -> Void)?

  static func handle(messageBody: Any, from webView: WKWebView) -> Bool {
    dispatchPrecondition(condition: .onQueue(.main))
    guard
      let body = messageBody as? String,
      body.contains("yohaku:image-preview"),
      let data = body.data(using: .utf8),
      let message = try? JSONDecoder().decode(DomImagePreviewMessage.self, from: data)
    else {
      return false
    }

    switch message.type {
    case prewarmMessageType:
      prewarm(message: message, webView: webView)
      return true
    case previewMessageType:
      os_signpost(.event, log: signpostLog, name: "TapReceived")
      present(message: message, webView: webView)
      return true
    default:
      return false
    }
  }

  static func present(
    urls: [String],
    index: Int,
    currentSrc: String? = nil,
    sourceRectInWindow: CGRect?,
    objectFit: String?,
    cornerRadius: CGFloat,
    window: UIWindow?,
    preparedImage: UIImage? = nil,
    sourceView: UIView? = nil,
    siteReferer: String? = nil
  ) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard coordinator == nil, !urls.isEmpty else { return }

    let requestedIndex = max(0, min(index, urls.count - 1))
    var presentationSources = urls
    if let currentSrc {
      presentationSources[requestedIndex] = currentSrc
    }
    var sources = presentationSources.compactMap {
      DomImageAssetSource.resolve($0, siteReferer: siteReferer)
    }
    var selectedIndex = requestedIndex
    if sources.count != presentationSources.count {
      let selectedRaw = currentSrc ?? urls[requestedIndex]
      guard let selected = DomImageAssetSource.resolve(selectedRaw, siteReferer: siteReferer)
      else { return }
      sources = [selected]
      selectedIndex = 0
    }

    guard let window = window ?? keyWindow() else { return }
    present(
      sources: sources,
      index: selectedIndex,
      sourceRectInWindow: sourceRectInWindow,
      objectFit: DomImageFitMode(cssValue: objectFit),
      cornerRadius: max(0, cornerRadius),
      window: window,
      preparedImage: preparedImage,
      sourceView: sourceView
    )
  }

  static func present(
    from view: UIView,
    urls: [String],
    index: Int,
    objectFit: String?,
    cornerRadius: CGFloat,
    preparedImage: UIImage?,
    siteReferer: String? = nil
  ) {
    guard let window = view.window ?? keyWindow() else {
      present(
        urls: urls,
        index: index,
        sourceRectInWindow: nil,
        objectFit: objectFit,
        cornerRadius: cornerRadius,
        window: nil,
        preparedImage: preparedImage,
        sourceView: view,
        siteReferer: siteReferer
      )
      return
    }
    let rect = view.convert(view.bounds, to: window)
      .intersection(window.bounds)
    present(
      urls: urls,
      index: index,
      currentSrc: nil,
      sourceRectInWindow: rect,
      objectFit: objectFit,
      cornerRadius: cornerRadius,
      window: window,
      preparedImage: preparedImage,
      sourceView: view,
      siteReferer: siteReferer
    )
  }

  private static func resolvedSiteReferer(
    message: DomImagePreviewMessage,
    webView: WKWebView
  ) -> String? {
    message.siteReferer ?? (webView as? DomWKWebView)?.siteReferer
  }

  private static func prewarm(message: DomImagePreviewMessage, webView: WKWebView) {
    let siteReferer = resolvedSiteReferer(message: message, webView: webView)
    guard
      let layout = message.source,
      let source = DomImageAssetSource.resolve(layout.currentSrc, siteReferer: siteReferer)
    else {
      return
    }
    DomImageAssetStore.shared.prepareImage(for: source)
    if isLikelyVector(source) {
      captureSnapshot(webView: webView, layout: layout, source: source, completion: nil)
    }
  }

  private static func present(message: DomImagePreviewMessage, webView: WKWebView) {
    let rawSources = message.images ?? message.src.map { [$0] } ?? []
    guard !rawSources.isEmpty else { return }
    let siteReferer = resolvedSiteReferer(message: message, webView: webView)

    let requestedIndex = max(0, min(message.index ?? 0, rawSources.count - 1))
    var presentationSources = rawSources
    if let currentSrc = message.source?.currentSrc {
      presentationSources[requestedIndex] = currentSrc
    }
    var sources = presentationSources.compactMap {
      DomImageAssetSource.resolve($0, siteReferer: siteReferer)
    }
    var selectedIndex = requestedIndex
    if sources.count != presentationSources.count {
      let selectedRaw = message.source?.currentSrc ?? rawSources[requestedIndex]
      guard let selected = DomImageAssetSource.resolve(selectedRaw, siteReferer: siteReferer)
      else { return }
      sources = [selected]
      selectedIndex = 0
    }

    guard let window = webView.window ?? keyWindow() else { return }
    var sourceRect: CGRect?
    if let layout = message.source {
      let converted = webView.convert(layout.rect.cgRect.standardized, to: window)
        .intersection(webView.convert(webView.bounds, to: window))
        .intersection(window.bounds)
      if converted.width > 1, converted.height > 1 {
        sourceRect = converted
      }
    }

    let selectedSource = sources[selectedIndex]
    // Inline PNG/JPEG already is the preview asset. A WebView snapshot of the
    // live node (zoom chrome, current pan) is the wrong picture and pops in
    // when ImageIO finishes — use the decoded raster for the whole hero.
    let snapshot =
      isInlineRaster(selectedSource)
      ? nil
      : snapshotCache.object(forKey: selectedSource.cacheKey as NSString)
    present(
      sources: sources,
      index: selectedIndex,
      sourceRectInWindow: sourceRect,
      objectFit: DomImageFitMode(cssValue: message.source?.objectFit),
      cornerRadius: max(0, message.source?.borderRadius ?? 0),
      window: window,
      preparedImage: snapshot,
      sourceView: nil
    )

    if snapshot == nil, let layout = message.source, !isInlineRaster(selectedSource) {
      captureSnapshot(
        webView: webView,
        layout: layout,
        source: selectedSource
      ) { image in
        pendingResolve?(image)
      }
    }
  }

  private static func present(
    sources: [DomImageAssetSource],
    index: Int,
    sourceRectInWindow: CGRect?,
    objectFit: DomImageFitMode,
    cornerRadius: CGFloat,
    window: UIWindow,
    preparedImage: UIImage?,
    sourceView: UIView?
  ) {
    guard coordinator == nil, !sources.isEmpty else { return }
    let selectedIndex = max(0, min(index, sources.count - 1))
    let selectedSource = sources[selectedIndex]
    let sourceRect = resolvedSourceRect(sourceRectInWindow, in: window)

    let presentationID = UUID()
    pendingPresentationID = presentationID
    let resolve: (UIImage?) -> Void = { image in
      guard
        pendingPresentationID == presentationID,
        coordinator == nil,
        let image
      else {
        return
      }
      pendingPresentationID = nil
      pendingResolve = nil
      os_signpost(.event, log: signpostLog, name: "PreparedImageResolved")
      presentResolved(
        image: image,
        sources: sources,
        index: selectedIndex,
        sourceRect: sourceRect,
        sourceFit: objectFit,
        sourceCornerRadius: cornerRadius,
        window: window,
        sourceView: sourceView
      )
    }
    pendingResolve = resolve

    if let image = preparedImage
      ?? DomImageAssetStore.shared.preparedImage(for: selectedSource)
    {
      resolve(image)
      return
    }

    DomImageAssetStore.shared.prepareImage(for: selectedSource, completion: resolve)
  }

  private static func resolvedSourceRect(_ rect: CGRect?, in window: UIWindow) -> CGRect {
    if let rect, rect.width > 1, rect.height > 1 {
      return rect
    }
    let size = CGSize(width: 72, height: 72)
    return CGRect(
      x: window.bounds.midX - size.width / 2,
      y: window.bounds.midY - size.height / 2,
      width: size.width,
      height: size.height
    )
  }

  static func keyWindow() -> UIWindow? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    return scene?.windows.first(where: \.isKeyWindow) ?? scene?.windows.first
  }

  private static func presentResolved(
    image: UIImage,
    sources: [DomImageAssetSource],
    index: Int,
    sourceRect: CGRect,
    sourceFit: DomImageFitMode,
    sourceCornerRadius: CGFloat,
    window: UIWindow,
    sourceView: UIView?
  ) {
    guard let presenter = topViewController(from: window.rootViewController) else { return }
    let next = DomImagePreviewCoordinator(
      sources: sources,
      initialIndex: index,
      initialImage: image,
      sourceRectInWindow: sourceRect,
      sourceFit: sourceFit,
      sourceCornerRadius: sourceCornerRadius,
      window: window,
      sourceView: sourceView,
      onDismiss: {
        coordinator = nil
      }
    )
    coordinator = next
    next.present(from: presenter)
    os_signpost(.event, log: signpostLog, name: "PresentationCommitted")
  }

  private static func captureSnapshot(
    webView: WKWebView,
    layout: DomImagePreviewSourceLayout,
    source: DomImageAssetSource,
    completion: ((UIImage?) -> Void)?
  ) {
    if let cached = snapshotCache.object(forKey: source.cacheKey as NSString) {
      completion?(cached)
      return
    }
    let rect = layout.rect.cgRect.standardized.intersection(webView.bounds)
    guard rect.width > 1, rect.height > 1 else {
      completion?(nil)
      return
    }
    let configuration = WKSnapshotConfiguration()
    configuration.rect = rect
    if isLikelyVector(source) {
      configuration.snapshotWidth = NSNumber(value: max(rect.width, webView.bounds.width))
    }
    webView.takeSnapshot(with: configuration) { image, _ in
      if let image {
        snapshotCache.setObject(
          image,
          forKey: source.cacheKey as NSString,
          cost: image.cgImage.map { $0.bytesPerRow * $0.height } ?? 0
        )
      }
      completion?(image)
    }
  }

  private static func isLikelyVector(_ source: DomImageAssetSource) -> Bool {
    if source.rawValue.lowercased().hasPrefix("data:image/svg+xml") { return true }
    return source.remoteURL?.pathExtension.lowercased() == "svg"
  }

  private static func isInlineRaster(_ source: DomImageAssetSource) -> Bool {
    let raw = source.rawValue.lowercased()
    return raw.hasPrefix("data:image/") && !raw.hasPrefix("data:image/svg+xml")
  }

  private static func topViewController(from root: UIViewController?) -> UIViewController? {
    guard let root else { return nil }
    if let presented = root.presentedViewController {
      return topViewController(from: presented)
    }
    if let navigation = root as? UINavigationController {
      return topViewController(from: navigation.visibleViewController)
    }
    if let tabs = root as? UITabBarController {
      return topViewController(from: tabs.selectedViewController)
    }
    for child in root.children.reversed() where child.viewIfLoaded?.window != nil {
      return topViewController(from: child)
    }
    return root
  }
}

private final class DomImagePreviewCoordinator: NSObject, UIViewControllerTransitioningDelegate {
  private let sources: [DomImageAssetSource]
  private let initialIndex: Int
  private let initialImage: UIImage
  private let sourceRectInWindow: CGRect
  private let sourceFit: DomImageFitMode
  private let sourceCornerRadius: CGFloat
  private weak var window: UIWindow?
  private weak var sourceView: UIView?
  private var sourceViewWasHidden = false
  private let onDismiss: () -> Void
  private weak var viewer: DomImagePageViewController?

  init(
    sources: [DomImageAssetSource],
    initialIndex: Int,
    initialImage: UIImage,
    sourceRectInWindow: CGRect,
    sourceFit: DomImageFitMode,
    sourceCornerRadius: CGFloat,
    window: UIWindow,
    sourceView: UIView?,
    onDismiss: @escaping () -> Void
  ) {
    self.sources = sources
    self.initialIndex = initialIndex
    self.initialImage = initialImage
    self.sourceRectInWindow = sourceRectInWindow
    self.sourceFit = sourceFit
    self.sourceCornerRadius = sourceCornerRadius
    self.window = window
    self.sourceView = sourceView
    self.onDismiss = onDismiss
  }

  func present(from presenter: UIViewController) {
    let viewer = DomImagePageViewController(
      sources: sources,
      initialIndex: initialIndex,
      initialImage: initialImage,
      sourceFit: sourceFit,
      sourceCornerRadius: sourceCornerRadius
    )
    viewer.modalPresentationStyle = .custom
    viewer.transitioningDelegate = self
    viewer.onClose = { [weak viewer] in
      viewer?.dismiss(animated: true)
    }
    viewer.dismissalTargetRectProvider = { [weak self, weak viewer] in
      guard let self, let viewer, let window = self.window else { return nil }
      return viewer.view.convert(self.currentSourceRectInWindow(), from: window)
    }
    viewer.onInteractiveDismissCommitted = { [weak viewer] in
      viewer?.dismiss(animated: false)
    }
    viewer.onDidDismiss = { [weak self] in
      guard let self else { return }
      self.restoreSourceView()
      self.onDismiss()
    }
    self.viewer = viewer
    hideSourceView()
    presenter.present(viewer, animated: true)
  }

  func animationController(
    forPresented presented: UIViewController,
    presenting: UIViewController,
    source: UIViewController
  ) -> UIViewControllerAnimatedTransitioning? {
    DomImageTransitionAnimator(
      presenting: true,
      sourceRectInWindow: sourceRectInWindow,
      sourceFit: sourceFit,
      sourceCornerRadius: sourceCornerRadius,
      initialIndex: initialIndex,
      fallbackImage: initialImage,
      window: window
    )
  }

  func animationController(forDismissed dismissed: UIViewController)
    -> UIViewControllerAnimatedTransitioning?
  {
    DomImageTransitionAnimator(
      presenting: false,
      sourceRectInWindow: currentSourceRectInWindow(),
      sourceFit: sourceFit,
      sourceCornerRadius: sourceCornerRadius,
      initialIndex: initialIndex,
      fallbackImage: initialImage,
      window: window
    )
  }

  private func currentSourceRectInWindow() -> CGRect {
    guard let sourceView, let window, sourceView.window === window else {
      return sourceRectInWindow
    }
    let rect = sourceView.convert(sourceView.bounds, to: window).intersection(window.bounds)
    guard rect.width > 1, rect.height > 1 else { return sourceRectInWindow }
    return rect
  }

  private func hideSourceView() {
    guard let sourceView else { return }
    sourceViewWasHidden = sourceView.isHidden
    sourceView.isHidden = true
  }

  private func restoreSourceView() {
    sourceView?.isHidden = sourceViewWasHidden
  }

}

private final class DomImageTransitionAnimator: NSObject, UIViewControllerAnimatedTransitioning {
  private let presenting: Bool
  private let sourceRectInWindow: CGRect
  private let sourceFit: DomImageFitMode
  private let sourceCornerRadius: CGFloat
  private let initialIndex: Int
  private let fallbackImage: UIImage
  private weak var window: UIWindow?

  init(
    presenting: Bool,
    sourceRectInWindow: CGRect,
    sourceFit: DomImageFitMode,
    sourceCornerRadius: CGFloat,
    initialIndex: Int,
    fallbackImage: UIImage,
    window: UIWindow?
  ) {
    self.presenting = presenting
    self.sourceRectInWindow = sourceRectInWindow
    self.sourceFit = sourceFit
    self.sourceCornerRadius = sourceCornerRadius
    self.initialIndex = initialIndex
    self.fallbackImage = fallbackImage
    self.window = window
  }

  func transitionDuration(using transitionContext: UIViewControllerContextTransitioning?)
    -> TimeInterval
  {
    0.34
  }

  func animateTransition(using transitionContext: UIViewControllerContextTransitioning) {
    presenting
      ? animatePresentation(using: transitionContext)
      : animateDismissal(using: transitionContext)
  }

  private func animatePresentation(using context: UIViewControllerContextTransitioning) {
    guard
      let toController = context.viewController(forKey: .to) as? DomImagePageViewController,
      let toView = context.view(forKey: .to)
    else {
      context.completeTransition(false)
      return
    }
    let container = context.containerView
    toView.frame = context.finalFrame(for: toController)
    container.addSubview(toView)
    toController.view.layoutIfNeeded()
    toController.setTransitionContentHidden(true)
    toController.setTransitionChromeAlpha(0)
    toController.setTransitionBackgroundAlpha(0)

    let sourceFrame = convertedSourceFrame(in: container)
    let transitionView = DomImageTransitionView(
      image: fallbackImage,
      frame: container.bounds,
      imageViewport: sourceFrame,
      fitMode: sourceFit,
      cornerRadius: sourceCornerRadius
    )
    container.addSubview(transitionView)

    UIView.animate(
      withDuration: transitionDuration(using: context),
      delay: 0,
      usingSpringWithDamping: 0.9,
      initialSpringVelocity: 0,
      options: [.curveEaseOut, .allowUserInteraction]
    ) {
      transitionView.apply(
        imageViewport: container.bounds,
        fitMode: .contain,
        cornerRadius: 0
      )
      toController.setTransitionBackgroundAlpha(1)
      toController.setTransitionChromeAlpha(1)
    } completion: { _ in
      let completed = !context.transitionWasCancelled
      toController.setTransitionContentHidden(false)
      transitionView.removeFromSuperview()
      context.completeTransition(completed)
    }
  }

  private func animateDismissal(using context: UIViewControllerContextTransitioning) {
    guard
      let fromController = context.viewController(forKey: .from) as? DomImagePageViewController,
      let fromView = context.view(forKey: .from)
    else {
      context.completeTransition(false)
      return
    }
    let container = context.containerView
    let image = fromController.currentImage ?? fallbackImage
    let returnsToSource = fromController.currentIndex == initialIndex
    fromController.setTransitionContentHidden(true)
    fromController.setTransitionChromeAlpha(0)

    let transitionView = DomImageTransitionView(
      image: image,
      frame: container.bounds,
      imageViewport: container.bounds,
      fitMode: .contain,
      cornerRadius: 0
    )
    container.addSubview(transitionView)
    let fallbackFrame = CGRect(
      x: container.bounds.midX - container.bounds.width * 0.4,
      y: container.bounds.midY - container.bounds.height * 0.4,
      width: container.bounds.width * 0.8,
      height: container.bounds.height * 0.8
    )

    UIView.animate(
      withDuration: transitionDuration(using: context),
      delay: 0,
      options: [.curveEaseOut, .allowUserInteraction]
    ) {
      transitionView.apply(
        imageViewport: returnsToSource ? self.convertedSourceFrame(in: container) : fallbackFrame,
        fitMode: returnsToSource ? self.sourceFit : .contain,
        cornerRadius: returnsToSource ? self.sourceCornerRadius : 0
      )
      transitionView.alpha = returnsToSource ? 1 : 0
      fromController.setTransitionBackgroundAlpha(0)
    } completion: { _ in
      let completed = !context.transitionWasCancelled
      if !completed {
        fromController.setTransitionContentHidden(false)
        fromController.setTransitionChromeAlpha(1)
        fromController.setTransitionBackgroundAlpha(1)
      }
      transitionView.removeFromSuperview()
      if completed {
        fromView.removeFromSuperview()
      }
      context.completeTransition(completed)
    }
  }

  private func convertedSourceFrame(in container: UIView) -> CGRect {
    guard let window else { return sourceRectInWindow }
    return container.convert(sourceRectInWindow, from: window)
  }
}

private final class DomImageTransitionView: UIView {
  private let imageView = UIImageView()
  private let imageSize: CGSize

  init(
    image: UIImage,
    frame: CGRect,
    imageViewport: CGRect,
    fitMode: DomImageFitMode,
    cornerRadius: CGFloat
  ) {
    self.imageSize = image.size
    super.init(frame: frame)
    isUserInteractionEnabled = false
    imageView.image = image
    imageView.contentMode = .scaleToFill
    imageView.clipsToBounds = true
    imageView.layer.cornerCurve = .continuous
    addSubview(imageView)
    apply(imageViewport: imageViewport, fitMode: fitMode, cornerRadius: cornerRadius)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func apply(imageViewport: CGRect, fitMode: DomImageFitMode, cornerRadius: CGFloat) {
    imageView.frame = Self.imageFrame(
      imageSize: imageSize,
      viewport: imageViewport,
      fitMode: fitMode
    )
    imageView.layer.contentsRect = Self.contentsRect(
      imageSize: imageSize,
      viewport: imageViewport,
      fitMode: fitMode
    )
    imageView.layer.cornerRadius = cornerRadius
  }

  private static func imageFrame(
    imageSize: CGSize,
    viewport: CGRect,
    fitMode: DomImageFitMode
  ) -> CGRect {
    guard imageSize.width > 0,
      imageSize.height > 0,
      viewport.width > 0,
      viewport.height > 0
    else {
      return viewport
    }
    guard fitMode == .contain else { return viewport }
    let scale = min(viewport.width / imageSize.width, viewport.height / imageSize.height)
    let size = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
    return CGRect(
      x: viewport.midX - size.width / 2,
      y: viewport.midY - size.height / 2,
      width: size.width,
      height: size.height
    )
  }

  private static func contentsRect(
    imageSize: CGSize,
    viewport: CGRect,
    fitMode: DomImageFitMode
  ) -> CGRect {
    guard fitMode == .cover,
      imageSize.width > 0,
      imageSize.height > 0,
      viewport.width > 0,
      viewport.height > 0
    else {
      return CGRect(x: 0, y: 0, width: 1, height: 1)
    }
    let scale = max(viewport.width / imageSize.width, viewport.height / imageSize.height)
    let visibleWidth = min(1, viewport.width / (imageSize.width * scale))
    let visibleHeight = min(1, viewport.height / (imageSize.height * scale))
    return CGRect(
      x: (1 - visibleWidth) / 2,
      y: (1 - visibleHeight) / 2,
      width: visibleWidth,
      height: visibleHeight
    )
  }
}

private final class DomImagePageViewController: UIViewController,
  UICollectionViewDataSource,
  UICollectionViewDelegate,
  UIGestureRecognizerDelegate
{
  let sources: [DomImageAssetSource]
  let initialIndex: Int
  let initialImage: UIImage
  private let sourceFit: DomImageFitMode
  private let sourceCornerRadius: CGFloat

  var onClose: (() -> Void)?
  var dismissalTargetRectProvider: (() -> CGRect?)?
  var onInteractiveDismissCommitted: (() -> Void)?
  var onDidDismiss: (() -> Void)?

  private let backgroundView = UIView()
  private let mediaViewport = UIView()
  private let layout = UICollectionViewFlowLayout()
  private lazy var collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
  private let closeButton = UIButton(type: .system)
  private let counterLabel = UILabel()
  private var positionedInitialItem = false
  private var didReportDismissal = false
  private var dismissalGeneration = 0
  private var dismissalGestureOrigin = DomImageDismissTransform.identity
  private var lastDismissGestureTranslation = CGPoint.zero
  private var dismissalState = DomImageDismissState.identity
  private var dismissalMediaAnimator: UIViewPropertyAnimator?
  private var dismissalBackdropAnimator: UIViewPropertyAnimator?
  private var dismissalChromeAnimator: UIViewPropertyAnimator?
  private var dismissalTransitionView: DomImageTransitionView?
  private var isCompletingDismissal = false

  private lazy var dismissPanGestureRecognizer: UIPanGestureRecognizer = {
    let recognizer = UIPanGestureRecognizer(target: self, action: #selector(handleDismissPan(_:)))
    recognizer.delegate = self
    recognizer.cancelsTouchesInView = false
    recognizer.maximumNumberOfTouches = 1
    return recognizer
  }()

  init(
    sources: [DomImageAssetSource],
    initialIndex: Int,
    initialImage: UIImage,
    sourceFit: DomImageFitMode,
    sourceCornerRadius: CGFloat
  ) {
    self.sources = sources
    self.initialIndex = initialIndex
    self.initialImage = initialImage
    self.sourceFit = sourceFit
    self.sourceCornerRadius = sourceCornerRadius
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    backgroundView.backgroundColor = .black
    backgroundView.frame = view.bounds
    backgroundView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(backgroundView)

    mediaViewport.frame = view.bounds
    mediaViewport.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(mediaViewport)

    layout.scrollDirection = .horizontal
    layout.minimumLineSpacing = 0
    layout.minimumInteritemSpacing = 0
    collectionView.backgroundColor = .clear
    collectionView.isPagingEnabled = true
    collectionView.showsHorizontalScrollIndicator = false
    collectionView.alwaysBounceHorizontal = sources.count > 1
    collectionView.dataSource = self
    collectionView.delegate = self
    collectionView.register(
      DomImagePageCell.self, forCellWithReuseIdentifier: DomImagePageCell.reuseID)
    collectionView.frame = mediaViewport.bounds
    collectionView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    mediaViewport.addSubview(collectionView)

    var closeConfiguration = UIButton.Configuration.filled()
    closeConfiguration.image = UIImage(systemName: "xmark")
    closeConfiguration.baseForegroundColor = .white
    closeConfiguration.baseBackgroundColor = UIColor.black.withAlphaComponent(0.45)
    closeConfiguration.cornerStyle = .capsule
    closeButton.configuration = closeConfiguration
    closeButton.accessibilityLabel = "Close image preview"
    closeButton.addTarget(self, action: #selector(close), for: .touchUpInside)
    view.addSubview(closeButton)

    counterLabel.textColor = .white
    counterLabel.font = .monospacedDigitSystemFont(ofSize: 13, weight: .medium)
    counterLabel.textAlignment = .center
    counterLabel.backgroundColor = UIColor.black.withAlphaComponent(0.45)
    counterLabel.layer.cornerRadius = 14
    counterLabel.clipsToBounds = true
    view.addSubview(counterLabel)
    updateCounter()

    view.addGestureRecognizer(dismissPanGestureRecognizer)
    collectionView.panGestureRecognizer.require(toFail: dismissPanGestureRecognizer)
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    let sizeChanged = layout.itemSize != view.bounds.size
    layout.itemSize = view.bounds.size
    if sizeChanged { layout.invalidateLayout() }
    closeButton.frame = CGRect(
      x: view.bounds.width - view.safeAreaInsets.right - 52,
      y: view.safeAreaInsets.top + 8,
      width: 40,
      height: 40
    )
    counterLabel.frame = CGRect(
      x: (view.bounds.width - 72) / 2,
      y: view.safeAreaInsets.top + 14,
      width: 72,
      height: 28
    )
    guard !positionedInitialItem, view.bounds.width > 0 else { return }
    positionedInitialItem = true
    collectionView.layoutIfNeeded()
    collectionView.scrollToItem(
      at: IndexPath(item: initialIndex, section: 0),
      at: .centeredHorizontally,
      animated: false
    )
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    guard isBeingDismissed, !didReportDismissal else { return }
    didReportDismissal = true
    onDidDismiss?()
  }

  override var prefersStatusBarHidden: Bool { true }
  override var prefersHomeIndicatorAutoHidden: Bool { true }

  var currentIndex: Int {
    guard view.bounds.width > 0 else { return initialIndex }
    return max(
      0, min(Int(round(collectionView.contentOffset.x / view.bounds.width)), sources.count - 1))
  }

  var currentImage: UIImage? {
    (collectionView.cellForItem(at: IndexPath(item: currentIndex, section: 0)) as? DomImagePageCell)?
      .image
  }

  func setTransitionContentHidden(_ hidden: Bool) {
    mediaViewport.alpha = hidden ? 0 : 1
  }

  func setTransitionChromeAlpha(_ alpha: CGFloat) {
    closeButton.alpha = alpha
    counterLabel.alpha = alpha
  }

  func setTransitionBackgroundAlpha(_ alpha: CGFloat) {
    backgroundView.alpha = alpha
  }

  func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int)
    -> Int
  {
    sources.count
  }

  func collectionView(
    _ collectionView: UICollectionView,
    cellForItemAt indexPath: IndexPath
  ) -> UICollectionViewCell {
    guard
      let cell = collectionView.dequeueReusableCell(
        withReuseIdentifier: DomImagePageCell.reuseID,
        for: indexPath
      ) as? DomImagePageCell
    else {
      return UICollectionViewCell()
    }
    cell.configure(
      source: sources[indexPath.item],
      initialImage: indexPath.item == initialIndex ? initialImage : nil
    )
    cell.configureExternalDismissGesture(dismissPanGestureRecognizer)
    return cell
  }

  func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    updateCounter()
    prepareAdjacentImages()
  }

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard gestureRecognizer === dismissPanGestureRecognizer, !isCompletingDismissal else {
      return false
    }
    let translation = dismissPanGestureRecognizer.translation(in: view)
    let velocity = dismissPanGestureRecognizer.velocity(in: view)
    let direction = abs(translation.x) + abs(translation.y) > 0.5 ? translation : velocity
    let cell =
      collectionView.cellForItem(at: IndexPath(item: currentIndex, section: 0)) as? DomImagePageCell
    let directionAllowed = direction.y > 0 && abs(direction.y) > abs(direction.x) * 1.12
    let zoomAllowed = cell?.isAtMinimumZoom ?? true
    let allowed = directionAllowed && zoomAllowed
    if allowed { lastDismissGestureTranslation = translation }
    return allowed
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    false
  }

  @objc private func close() {
    onClose?()
  }

  @objc private func handleDismissPan(_ recognizer: UIPanGestureRecognizer) {
    let translation = recognizer.translation(in: view)
    let velocity = recognizer.velocity(in: view)
    switch recognizer.state {
    case .began:
      beginInteractiveDismissal()
      _ = applyInteractiveDismissal(
        translation: resolvedDismissGestureTranslation(translation))
    case .changed:
      applyInteractiveDismissal(translation: translation)
    case .ended:
      let state = applyInteractiveDismissal(
        translation: resolvedDismissGestureTranslation(translation))
      let shouldCommit = DomImageDismissGeometry.shouldCommit(
        progress: state.progress,
        translationY: state.transform.translation.y,
        velocityY: velocity.y
      )
      if shouldCommit {
        commitInteractiveDismissal(velocity: velocity)
      } else {
        cancelInteractiveDismissal(velocity: velocity)
      }
    case .cancelled, .failed:
      _ = applyInteractiveDismissal(translation: translation)
      cancelInteractiveDismissal(velocity: velocity)
    default:
      break
    }
  }

  private func beginInteractiveDismissal() {
    dismissalGeneration += 1
    settleDismissalAnimationsAtCurrentPosition()
    dismissalGestureOrigin = transitionTransform(from: mediaViewport.transform)
    dismissalState = state(for: dismissalGestureOrigin)
    mediaViewport.alpha = 1
  }

  @discardableResult
  private func applyInteractiveDismissal(translation: CGPoint) -> DomImageDismissState {
    lastDismissGestureTranslation = translation
    let state = DomImageDismissGeometry.dragState(
      translation: translation,
      origin: dismissalGestureOrigin
    )
    dismissalState = state
    mediaViewport.transform = state.transform.affineTransform
    mediaViewport.alpha = 1
    backgroundView.alpha = 1 - state.progress
    setTransitionChromeAlpha(max(0, 1 - state.progress * 2))
    return state
  }

  private func commitInteractiveDismissal(velocity: CGPoint) {
    let generation = dismissalGeneration
    isCompletingDismissal = true
    settleDismissalAnimationsAtCurrentPosition()

    if let target = dismissalTransitionTarget() {
      let duration = dismissalSettlingDuration(
        from: CGPoint(x: target.imageFrame.midX, y: target.imageFrame.midY),
        to: CGPoint(x: target.targetRect.midX, y: target.targetRect.midY),
        velocity: velocity
      )
      let transitionView = DomImageTransitionView(
        image: target.image,
        frame: view.bounds,
        imageViewport: target.imageFrame,
        fitMode: .contain,
        cornerRadius: 0
      )
      transitionView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      view.insertSubview(transitionView, aboveSubview: mediaViewport)
      dismissalTransitionView = transitionView
      mediaViewport.alpha = 0

      guard !UIAccessibility.isReduceMotionEnabled else {
        transitionView.apply(
          imageViewport: target.targetRect,
          fitMode: sourceFit,
          cornerRadius: sourceCornerRadius
        )
        backgroundView.alpha = 0
        setTransitionChromeAlpha(0)
        onInteractiveDismissCommitted?()
        return
      }

      let springVelocity = normalizedSpringVelocity(
        from: CGPoint(x: target.imageFrame.midX, y: target.imageFrame.midY),
        to: CGPoint(x: target.targetRect.midX, y: target.targetRect.midY),
        velocity: velocity
      )
      let timing = UISpringTimingParameters(
        dampingRatio: 0.92,
        initialVelocity: CGVector(dx: springVelocity, dy: springVelocity)
      )
      let mediaAnimator = UIViewPropertyAnimator(duration: duration, timingParameters: timing)
      mediaAnimator.addAnimations { [self] in
        transitionView.apply(
          imageViewport: target.targetRect,
          fitMode: sourceFit,
          cornerRadius: sourceCornerRadius
        )
      }
      mediaAnimator.addCompletion { [weak self, weak mediaAnimator] position in
        guard let self,
          dismissalMediaAnimator === mediaAnimator,
          dismissalGeneration == generation,
          position == .end
        else { return }
        dismissalMediaAnimator = nil
        onInteractiveDismissCommitted?()
      }
      let backdropAnimator = UIViewPropertyAnimator(
        duration: min(duration, 0.24),
        curve: .easeOut
      ) { [self] in
        backgroundView.alpha = 0
        setTransitionChromeAlpha(0)
      }
      backdropAnimator.addCompletion { [weak self, weak backdropAnimator] _ in
        guard self?.dismissalBackdropAnimator === backdropAnimator else { return }
        self?.dismissalBackdropAnimator = nil
      }
      dismissalState = DomImageDismissState(
        progress: 1,
        transform: dismissalState.transform
      )
      dismissalMediaAnimator = mediaAnimator
      dismissalBackdropAnimator = backdropAnimator
      mediaAnimator.startAnimation()
      backdropAnimator.startAnimation()
      return
    }

    let driftX = min(max(velocity.x * 0.08, -70), 70)
    let driftY = min(max(velocity.y * 0.08, 90), 260)
    let exit = DomImageDismissTransform(
      scale: dismissalState.transform.scale * 0.88,
      translation: CGPoint(
        x: dismissalState.transform.translation.x + driftX,
        y: dismissalState.transform.translation.y + driftY
      )
    )
    guard !UIAccessibility.isReduceMotionEnabled else {
      mediaViewport.transform = exit.affineTransform
      mediaViewport.alpha = 0
      backgroundView.alpha = 0
      setTransitionChromeAlpha(0)
      onInteractiveDismissCommitted?()
      return
    }

    let mediaAnimator = UIViewPropertyAnimator(duration: 0.22, curve: .easeOut) { [self] in
      mediaViewport.transform = exit.affineTransform
      mediaViewport.alpha = 0
      backgroundView.alpha = 0
      setTransitionChromeAlpha(0)
    }
    mediaAnimator.addCompletion { [weak self, weak mediaAnimator] position in
      guard let self,
        dismissalMediaAnimator === mediaAnimator,
        dismissalGeneration == generation,
        position == .end
      else { return }
      dismissalMediaAnimator = nil
      onInteractiveDismissCommitted?()
    }
    dismissalState = DomImageDismissState(progress: 1, transform: exit)
    dismissalMediaAnimator = mediaAnimator
    mediaAnimator.startAnimation()
  }

  private func cancelInteractiveDismissal(velocity: CGPoint) {
    let generation = dismissalGeneration
    isCompletingDismissal = false
    settleDismissalAnimationsAtCurrentPosition()
    let duration = dismissalSettlingDuration(
      from: dismissalState.transform.translation,
      to: .zero,
      velocity: velocity
    )
    guard !UIAccessibility.isReduceMotionEnabled else {
      resetInteractiveDismissal()
      return
    }

    let springVelocity = normalizedSpringVelocity(
      from: dismissalState.transform.translation,
      to: .zero,
      velocity: velocity
    )
    let timing = UISpringTimingParameters(
      dampingRatio: 0.9,
      initialVelocity: CGVector(dx: springVelocity, dy: springVelocity)
    )
    let mediaAnimator = UIViewPropertyAnimator(duration: duration, timingParameters: timing)
    mediaAnimator.addAnimations { [self] in
      mediaViewport.transform = .identity
      mediaViewport.alpha = 1
    }
    mediaAnimator.addCompletion { [weak self, weak mediaAnimator] position in
      guard let self,
        dismissalMediaAnimator === mediaAnimator,
        dismissalGeneration == generation,
        !isCompletingDismissal,
        position == .end
      else { return }
      dismissalMediaAnimator = nil
      dismissalGestureOrigin = .identity
      lastDismissGestureTranslation = .zero
      dismissalState = .identity
    }
    let backdropAnimator = UIViewPropertyAnimator(
      duration: min(duration, 0.22),
      curve: .easeOut
    ) { [self] in
      backgroundView.alpha = 1
    }
    backdropAnimator.addCompletion { [weak self, weak backdropAnimator] _ in
      guard self?.dismissalBackdropAnimator === backdropAnimator else { return }
      self?.dismissalBackdropAnimator = nil
    }
    let chromeDelay = min(duration * 0.28, 0.12)
    let chromeAnimator = UIViewPropertyAnimator(
      duration: min(duration - chromeDelay, 0.24),
      curve: .easeOut
    ) { [self] in
      setTransitionChromeAlpha(1)
    }
    chromeAnimator.addCompletion { [weak self, weak chromeAnimator] _ in
      guard self?.dismissalChromeAnimator === chromeAnimator else { return }
      self?.dismissalChromeAnimator = nil
    }
    dismissalMediaAnimator = mediaAnimator
    dismissalBackdropAnimator = backdropAnimator
    dismissalChromeAnimator = chromeAnimator
    mediaAnimator.startAnimation()
    backdropAnimator.startAnimation()
    chromeAnimator.startAnimation(afterDelay: chromeDelay)
  }

  private func dismissalTransitionTarget() -> (
    image: UIImage,
    imageFrame: CGRect,
    targetRect: CGRect
  )? {
    guard currentIndex == initialIndex,
      let targetRect = dismissalTargetRectProvider?(),
      let cell = collectionView.cellForItem(
        at: IndexPath(item: currentIndex, section: 0)
      ) as? DomImagePageCell,
      let image = cell.image,
      let imageFrame = cell.displayedImageFrame(in: view),
      imageFrame.width > 1,
      imageFrame.height > 1,
      targetRect.width > 1,
      targetRect.height > 1
    else { return nil }
    return (image, imageFrame, targetRect)
  }

  private func resetInteractiveDismissal() {
    dismissalTransitionView?.removeFromSuperview()
    dismissalTransitionView = nil
    dismissalGestureOrigin = .identity
    lastDismissGestureTranslation = .zero
    dismissalState = .identity
    mediaViewport.transform = .identity
    mediaViewport.alpha = 1
    backgroundView.alpha = 1
    setTransitionChromeAlpha(1)
  }

  private func settleDismissalAnimationsAtCurrentPosition() {
    settleAnimatorAtCurrentPosition(dismissalMediaAnimator)
    settleAnimatorAtCurrentPosition(dismissalBackdropAnimator)
    settleAnimatorAtCurrentPosition(dismissalChromeAnimator)
    dismissalMediaAnimator = nil
    dismissalBackdropAnimator = nil
    dismissalChromeAnimator = nil
  }

  private func settleAnimatorAtCurrentPosition(_ animator: UIViewPropertyAnimator?) {
    guard let animator, animator.state == .active else { return }
    animator.stopAnimation(false)
    animator.finishAnimation(at: .current)
  }

  private func transitionTransform(from transform: CGAffineTransform) -> DomImageDismissTransform {
    DomImageDismissTransform(
      scale: hypot(transform.a, transform.c),
      translation: CGPoint(x: transform.tx, y: transform.ty)
    )
  }

  private func resolvedDismissGestureTranslation(_ translation: CGPoint) -> CGPoint {
    abs(translation.x) + abs(translation.y) > 0.5
      ? translation
      : lastDismissGestureTranslation
  }

  private func state(for transform: DomImageDismissTransform) -> DomImageDismissState {
    DomImageDismissState(
      progress: min(max(transform.translation.y / 340, 0), 1),
      transform: transform
    )
  }

  private func normalizedSpringVelocity(
    from current: CGPoint,
    to target: CGPoint,
    velocity: CGPoint
  ) -> CGFloat {
    let delta = CGPoint(x: target.x - current.x, y: target.y - current.y)
    let squaredDistance = delta.x * delta.x + delta.y * delta.y
    guard squaredDistance > 1 else { return 0 }
    let projectedVelocity = (velocity.x * delta.x + velocity.y * delta.y) / squaredDistance
    return min(max(projectedVelocity, -1.2), 3)
  }

  private func dismissalSettlingDuration(
    from current: CGPoint,
    to target: CGPoint,
    velocity: CGPoint
  ) -> TimeInterval {
    let delta = CGPoint(x: target.x - current.x, y: target.y - current.y)
    let distance = hypot(delta.x, delta.y)
    guard distance > 1 else { return 0.26 }
    let velocityTowardTarget = max(
      0,
      (velocity.x * delta.x + velocity.y * delta.y) / distance
    )
    let distanceAddition = min(distance / 1_200, 0.14)
    let velocityReduction = min(velocityTowardTarget / 12_000, 0.08)
    return min(max(0.28 + distanceAddition - velocityReduction, 0.26), 0.42)
  }

  private func updateCounter() {
    counterLabel.text = "\(currentIndex + 1) / \(sources.count)"
  }

  private func prepareAdjacentImages() {
    for index in [currentIndex - 1, currentIndex + 1] where sources.indices.contains(index) {
      DomImageAssetStore.shared.prepareImage(for: sources[index])
    }
  }
}

private final class DomImagePageCell: UICollectionViewCell, UIScrollViewDelegate {
  static let reuseID = "DomImagePageCell"

  private let scrollView = UIScrollView()
  private let imageView = UIImageView()
  private var representedKey: String?

  override init(frame: CGRect) {
    super.init(frame: frame)
    scrollView.delegate = self
    scrollView.minimumZoomScale = 1
    scrollView.maximumZoomScale = 4
    scrollView.bouncesZoom = true
    scrollView.showsHorizontalScrollIndicator = false
    scrollView.showsVerticalScrollIndicator = false
    scrollView.frame = contentView.bounds
    scrollView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    contentView.addSubview(scrollView)

    imageView.contentMode = .scaleAspectFit
    imageView.clipsToBounds = true
    imageView.frame = scrollView.bounds
    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    scrollView.addSubview(imageView)

    let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
    doubleTap.numberOfTapsRequired = 2
    scrollView.addGestureRecognizer(doubleTap)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func prepareForReuse() {
    super.prepareForReuse()
    representedKey = nil
    imageView.layer.removeAnimation(forKey: kCATransition)
    imageView.image = nil
    scrollView.setZoomScale(1, animated: false)
  }

  var image: UIImage? { imageView.image }
  var isAtMinimumZoom: Bool {
    scrollView.zoomScale <= scrollView.minimumZoomScale + 0.01
  }

  func configureExternalDismissGesture(_ gestureRecognizer: UIPanGestureRecognizer) {
    scrollView.panGestureRecognizer.require(toFail: gestureRecognizer)
  }

  func displayedImageFrame(in view: UIView) -> CGRect? {
    guard let image = imageView.image,
      image.size.width > 0,
      image.size.height > 0,
      imageView.bounds.width > 0,
      imageView.bounds.height > 0
    else { return nil }
    let scale = min(
      imageView.bounds.width / image.size.width,
      imageView.bounds.height / image.size.height
    )
    let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
    let frame = CGRect(
      x: imageView.bounds.midX - size.width / 2,
      y: imageView.bounds.midY - size.height / 2,
      width: size.width,
      height: size.height
    )
    return imageView.convert(frame, to: view)
  }

  func configure(source: DomImageAssetSource, initialImage: UIImage?) {
    representedKey = source.cacheKey
    scrollView.setZoomScale(1, animated: false)
    if let initialImage {
      setImage(initialImage, animated: false)
    } else if let prepared = DomImageAssetStore.shared.preparedImage(for: source) {
      setImage(prepared, animated: false)
    } else {
      setImage(
        UIImage(systemName: "photo")?.withTintColor(
          UIColor.white.withAlphaComponent(0.2),
          renderingMode: .alwaysOriginal
        ),
        animated: false
      )
    }

    DomImageAssetStore.shared.prepareImage(for: source) { [weak self] image in
      guard let self, self.representedKey == source.cacheKey, let image else { return }
      self.setImage(image, animated: true)
    }
  }

  private func setImage(_ image: UIImage?, animated: Bool) {
    if animated, imageView.image != nil, let image, imageView.image !== image {
      let transition = CATransition()
      transition.duration = 0.22
      transition.type = .fade
      transition.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
      imageView.layer.add(transition, forKey: kCATransition)
    }
    imageView.image = image
  }

  func viewForZooming(in scrollView: UIScrollView) -> UIView? {
    imageView
  }

  func scrollViewDidZoom(_ scrollView: UIScrollView) {
    let horizontalInset = max(0, (scrollView.bounds.width - imageView.frame.width) / 2)
    let verticalInset = max(0, (scrollView.bounds.height - imageView.frame.height) / 2)
    scrollView.contentInset = UIEdgeInsets(
      top: verticalInset,
      left: horizontalInset,
      bottom: verticalInset,
      right: horizontalInset
    )
  }

  @objc private func handleDoubleTap(_ recognizer: UITapGestureRecognizer) {
    if scrollView.zoomScale > scrollView.minimumZoomScale + 0.01 {
      scrollView.setZoomScale(scrollView.minimumZoomScale, animated: true)
      return
    }
    let point = recognizer.location(in: imageView)
    let targetScale = min(2.5, scrollView.maximumZoomScale)
    let size = CGSize(
      width: scrollView.bounds.width / targetScale,
      height: scrollView.bounds.height / targetScale
    )
    scrollView.zoom(
      to: CGRect(
        x: point.x - size.width / 2,
        y: point.y - size.height / 2,
        width: size.width,
        height: size.height
      ),
      animated: true
    )
  }
}
