import BeautifulMermaid
import CryptoKit
import ExpoModulesCore
import UIKit

struct MermaidRenderPayload: Record {
  @Field var bg: String = "#ffffff"
  @Field var fg: String = "#27272a"
  @Field var source: String = ""
}

enum MermaidDomain {
  private static let renderScale: CGFloat = 2

  enum RenderError: Error, LocalizedError {
    case emptySource
    case renderFailed

    var errorDescription: String? {
      switch self {
      case .emptySource: return "Render failed"
      case .renderFailed: return "Mermaid render returned no image"
      }
    }
  }

  struct RenderedImage {
    let height: CGFloat
    let uri: String
    let width: CGFloat
  }

  static func render(source: String, bg: String, fg: String) async throws -> RenderedImage {
    let trimmed = source.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { throw RenderError.emptySource }

    let dest = cacheURL(source: trimmed, bg: bg, fg: fg)
    if let cached = UIImage(contentsOfFile: dest.path) {
      return RenderedImage(
        height: cached.size.height,
        uri: dest.absoluteString,
        width: cached.size.width
      )
    }

    let theme = DiagramTheme(
      background: BMColor(hex: bg),
      foreground: BMColor(hex: fg)
    )
    guard let image = try await MermaidRenderer.renderImageAsync(
      source: trimmed,
      theme: theme,
      scale: renderScale
    ) else {
      throw RenderError.renderFailed
    }
    guard let png = image.pngData() else { throw RenderError.renderFailed }
    try png.write(to: dest, options: .atomic)
    return RenderedImage(
      height: image.size.height,
      uri: dest.absoluteString,
      width: image.size.width
    )
  }

  private static func cacheURL(source: String, bg: String, fg: String) -> URL {
    let key = "\(source)\n\(bg)\n\(fg)\n\(renderScale)"
    let digest = SHA256.hash(data: Data(key.utf8))
      .compactMap { String(format: "%02x", $0) }
      .joined()
    return FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("yohaku-mermaid-\(digest).png")
  }
}
