import CryptoKit
import ExpoModulesCore
import UIKit
import WebKit

struct SvgRasterPayload: Record {
  @Field var svg: String = ""
  @Field var width: Double = 360
  @Field var height: Double = 240
  @Field var bg: String = "#ffffff"
}

private final class SvgSnapshotJob: NSObject, WKNavigationDelegate {
  let webView: WKWebView
  private let continuation: CheckedContinuation<UIImage, Error>
  private var finished = false
  var onFinish: (() -> Void)?

  init(webView: WKWebView, continuation: CheckedContinuation<UIImage, Error>) {
    self.webView = webView
    self.continuation = continuation
    super.init()
    webView.navigationDelegate = self
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    // Fonts and layout settle a frame after didFinish; snapshotting
    // immediately yields blank text runs.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [self] in
      let config = WKSnapshotConfiguration()
      config.rect = webView.bounds
      config.afterScreenUpdates = true
      webView.takeSnapshot(with: config) { image, error in
        self.complete(image: image, error: error)
      }
    }
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    complete(image: nil, error: error)
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    complete(image: nil, error: error)
  }

  private func complete(image: UIImage?, error: Error?) {
    guard !finished else { return }
    finished = true
    onFinish?()
    if let image {
      continuation.resume(returning: image)
    } else {
      continuation.resume(throwing: error ?? SvgRasterDomain.RenderError.renderFailed)
    }
  }
}

@MainActor
enum SvgRasterDomain {
  private static let renderScale: CGFloat = 2
  private static var jobs: [ObjectIdentifier: SvgSnapshotJob] = [:]

  enum RenderError: Error, LocalizedError {
    case emptySource
    case renderFailed

    var errorDescription: String? {
      switch self {
      case .emptySource: return "Empty SVG"
      case .renderFailed: return "SVG render returned no image"
      }
    }
  }

  struct RenderedImage {
    let height: CGFloat
    let uri: String
    let width: CGFloat
  }

  static func render(svg: String, width: Double, height: Double, bg: String) async throws -> RenderedImage {
    let trimmed = svg.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { throw RenderError.emptySource }
    let size = CGSize(width: max(1, width), height: max(1, height))

    let dest = cacheURL(svg: trimmed, size: size, bg: bg)
    if let cached = UIImage(contentsOfFile: dest.path) {
      return RenderedImage(height: size.height, uri: dest.absoluteString, width: size.width)
    }

    let frame = CGRect(x: -20000, y: 0, width: size.width * renderScale, height: size.height * renderScale)
    let webView = WKWebView(frame: frame, configuration: WKWebViewConfiguration())
    webView.isOpaque = false
    webView.backgroundColor = .clear
    webView.scrollView.isScrollEnabled = false
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.backgroundColor = UIColor(richHex: bg) ?? .clear
    // WKWebView only paints while attached to a window; it lives far
    // off-screen for the duration of the snapshot.
    guard let window = UIApplication.shared.connectedScenes
      .compactMap({ ($0 as? UIWindowScene)?.keyWindow }).first
    else { throw RenderError.renderFailed }
    window.addSubview(webView)
    defer { webView.removeFromSuperview() }

    let html = """
    <!doctype html><html><head><meta name="viewport" content="width=\(Int(frame.width))">
    <style>html,body{margin:0;background:\(bg);width:\(Int(frame.width))px;height:\(Int(frame.height))px;overflow:hidden}
    svg{display:block;width:\(Int(frame.width))px;height:\(Int(frame.height))px}</style></head>
    <body>\(trimmed)</body></html>
    """

    let image: UIImage = try await withCheckedThrowingContinuation { continuation in
      let job = SvgSnapshotJob(webView: webView, continuation: continuation)
      let id = ObjectIdentifier(job)
      jobs[id] = job
      job.onFinish = { jobs[id] = nil }
      webView.loadHTMLString(html, baseURL: nil)
    }
    guard let png = image.pngData() else { throw RenderError.renderFailed }
    try png.write(to: dest, options: .atomic)
    return RenderedImage(height: size.height, uri: dest.absoluteString, width: size.width)
  }

  private static func cacheURL(svg: String, size: CGSize, bg: String) -> URL {
    let key = "\(svg)\n\(size.width)x\(size.height)\n\(bg)\n\(renderScale)"
    let digest = SHA256.hash(data: Data(key.utf8))
      .compactMap { String(format: "%02x", $0) }
      .joined()
    return FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("yohaku-svg-\(digest).png")
  }
}
