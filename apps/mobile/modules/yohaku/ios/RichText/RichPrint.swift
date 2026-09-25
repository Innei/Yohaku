import ImageIO
import MapKit
import SwiftUI
import UIKit

private enum RichPrintMetrics {
  static let mm: CGFloat = 72 / 25.4
  static let headerHeight = 12 * mm
  static let footerHeight: CGFloat = 20
  static let sideInset = 16 * mm
  static let a4 = CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
  static let imagePixelLimit = 2000
  static let thumbnailPixelLimit = 480
  static let mediaWidth = a4.width - 2 * sideInset
  static let mapHeight: CGFloat = 220
  static let klineHeight: CGFloat = 170
  static let gridGap: CGFloat = 4
}

enum RichPrintDomain {
  @MainActor
  static func run(_ payload: [String: Any]) async -> String {
    let typography = RichTypography(payload["typography"] as? [String: Any] ?? [:])
    let items = payload["items"] as? [[String: Any]] ?? []
    let siteName = payload["siteName"] as? String ?? ""
    let jobName = (payload["jobName"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? siteName
    let images = await loadImages(items: items, referer: payload["referer"] as? String)
    let media = await renderMedia(
      items: items,
      images: images,
      typography: typography,
      klineColors: payload["klineColors"] as? [String: Any] ?? [:]
    )
    let text = compose(
      masthead: payload["masthead"] as? [String: Any] ?? [:],
      items: items,
      images: images,
      media: media,
      typography: typography
    )
    let renderer = RichPrintPageRenderer(text: text, typography: typography, siteName: siteName)
    if payload["exportPdf"] as? Bool ?? false {
      return writePDF(renderer: renderer, jobName: jobName) ?? ""
    }
    await present(renderer: renderer, jobName: jobName)
    return ""
  }

  private static func compose(
    masthead: [String: Any],
    items: [[String: Any]],
    images: [String: UIImage],
    media: [Int: UIImage],
    typography: RichTypography
  ) -> NSAttributedString {
    let result = NSMutableAttributedString()
    let size = typography.fontSize
    let small = round(size * 0.82 * 10) / 10

    func paragraph(lineHeight: CGFloat, spacing: CGFloat, alignment: NSTextAlignment = .natural) -> NSMutableParagraphStyle {
      let style = NSMutableParagraphStyle()
      style.minimumLineHeight = lineHeight
      style.maximumLineHeight = lineHeight
      style.paragraphSpacing = spacing
      style.alignment = alignment
      return style
    }

    func append(_ part: NSAttributedString) {
      guard part.length > 0 else { return }
      if result.length > 0 {
        var attributes = result.attributes(at: result.length - 1, effectiveRange: nil)
        attributes[.attachment] = nil
        attributes[.richMath] = nil
        result.append(NSAttributedString(string: "\n", attributes: attributes))
      }
      result.append(part)
    }

    func caption(_ text: String, alignment: NSTextAlignment = .natural) -> NSAttributedString {
      NSAttributedString(string: text, attributes: [
        .font: typography.bodyFont(size: small),
        .foregroundColor: typography.secondaryColor,
        .paragraphStyle: paragraph(lineHeight: small * 1.5, spacing: typography.paragraphGap, alignment: alignment),
      ])
    }

    if let title = masthead["title"] as? String, !title.isEmpty {
      let titleSize = round(size * 1.6)
      append(NSAttributedString(string: title, attributes: [
        .font: typography.font(family: typography.quoteFontFamily ?? typography.fontFamily, size: titleSize, weight: .medium).0,
        .foregroundColor: typography.color,
        .paragraphStyle: paragraph(lineHeight: round(titleSize * 1.29), spacing: 8),
      ]))
      append(NSAttributedString(string: "\u{00A0}", attributes: [
        .font: typography.bodyFont(size: 1),
        .paragraphStyle: paragraph(lineHeight: 2, spacing: 6),
        .richRule: typography.accentColor,
      ]))
      let lines = [masthead["meta"] as? String, masthead["url"] as? String]
        .compactMap { $0?.isEmpty == false ? $0 : nil }
      for (index, line) in lines.enumerated() {
        let spacing = index == lines.count - 1 ? typography.paragraphGap * 1.5 : 2
        append(NSAttributedString(string: line, attributes: [
          .font: typography.bodyFont(size: small),
          .foregroundColor: typography.secondaryColor,
          .paragraphStyle: paragraph(lineHeight: small * 1.5, spacing: spacing),
        ]))
      }
    }

    func figure(_ image: UIImage, caption text: String?) {
      let attachment = NSTextAttachment()
      attachment.image = image
      let figure = NSMutableAttributedString(attachment: attachment)
      figure.addAttribute(
        .paragraphStyle,
        value: paragraph(lineHeight: 0, spacing: 6, alignment: .center),
        range: NSRange(location: 0, length: figure.length)
      )
      append(figure)
      if let text, !text.isEmpty { append(caption(text, alignment: .center)) }
    }

    for (index, item) in items.enumerated() {
      switch item["kind"] as? String {
      case "text":
        let blocks = item["blocks"] as? [[String: Any]] ?? []
        append(RichAttributedBuilder.build(blocks: blocks, typography: typography).0)
      case "map", "kline", "imageGrid":
        let text = item["caption"] as? String
        if let image = media[index] {
          figure(image, caption: text)
        } else if let text, !text.isEmpty {
          append(caption(text))
        }
      case "math":
        let latex = item["latex"] as? String ?? ""
        if let math = RichMath.attachment(
          latex: latex,
          fontSize: round(size * 1.3),
          color: typography.color,
          mode: .display,
          attributes: [.paragraphStyle: paragraph(lineHeight: 0, spacing: typography.paragraphGap, alignment: .center)]
        ) {
          append(math)
        } else {
          append(NSAttributedString(string: latex, attributes: [
            .font: typography.codeFont(size: round(size * 0.86 * 10) / 10),
            .foregroundColor: typography.color,
            .paragraphStyle: paragraph(lineHeight: round(size * 1.3), spacing: typography.paragraphGap),
          ]))
        }
      case "image":
        let text = item["caption"] as? String
        if let src = item["src"] as? String, let image = images[src] {
          figure(image, caption: text)
        } else if let text, !text.isEmpty {
          append(caption(text))
        }
      case "code":
        let codeSize = round(size * 0.86 * 10) / 10
        let code = (item["code"] as? String ?? "").replacingOccurrences(of: "\n", with: "\u{2028}")
        append(NSAttributedString(string: code, attributes: [
          .font: typography.codeFont(size: codeSize),
          .foregroundColor: typography.color,
          .backgroundColor: typography.codeBackground,
          .paragraphStyle: paragraph(lineHeight: round(codeSize * 1.5), spacing: typography.paragraphGap),
        ]))
      case "caption":
        append(caption(item["text"] as? String ?? ""))
      default:
        continue
      }
    }
    return result
  }

  private static func loadImages(items: [[String: Any]], referer: String?) async -> [String: UIImage] {
    var limits: [String: Int] = [:]
    for item in items {
      switch item["kind"] as? String {
      case "image":
        if let src = item["src"] as? String { limits[src] = RichPrintMetrics.imagePixelLimit }
      case "imageGrid":
        for src in item["srcs"] as? [String] ?? [] {
          limits[src] = max(limits[src] ?? 0, RichPrintMetrics.thumbnailPixelLimit)
        }
      default:
        break
      }
    }
    return await withTaskGroup(of: (String, UIImage?).self) { group in
      for (src, limit) in limits {
        group.addTask { (src, await loadImage(src, referer: referer, pixelLimit: limit)) }
      }
      var images: [String: UIImage] = [:]
      for await (src, image) in group {
        if let image { images[src] = image }
      }
      return images
    }
  }

  private static func loadImage(_ src: String, referer: String?, pixelLimit: Int) async -> UIImage? {
    guard let url = URL(string: src) else { return nil }
    var request = URLRequest(url: url, timeoutInterval: 20)
    if let referer, !referer.isEmpty, url.scheme?.hasPrefix("http") == true {
      request.setValue(referer, forHTTPHeaderField: "Referer")
    }
    guard
      let (data, _) = try? await URLSession.shared.data(for: request),
      let source = CGImageSourceCreateWithData(data as CFData, nil),
      let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: pixelLimit,
      ] as CFDictionary)
    else { return nil }
    return UIImage(cgImage: cgImage)
  }

  @MainActor
  private static func renderMedia(
    items: [[String: Any]],
    images: [String: UIImage],
    typography: RichTypography,
    klineColors: [String: Any]
  ) async -> [Int: UIImage] {
    var media: [Int: UIImage] = [:]
    for (index, item) in items.enumerated() {
      switch item["kind"] as? String {
      case "imageGrid":
        let srcs = item["srcs"] as? [String] ?? []
        let columns = max(1, (item["columns"] as? NSNumber)?.intValue ?? 3)
        media[index] = imageGrid(srcs.map { images[$0] }, columns: columns, fill: typography.codeBackground)
      case "map":
        let polylines = (item["polylines"] as? [[[Double]]] ?? []).map { line in
          line.compactMap { $0.count >= 2 ? CLLocationCoordinate2D(latitude: $0[0], longitude: $0[1]) : nil }
        }.filter { $0.count > 1 }
        media[index] = await mapSnapshot(polylines, accent: typography.accentColor)
      case "kline":
        media[index] = klineImage(item, colors: klineColors)
      default:
        continue
      }
    }
    return media
  }

  private static func imageGrid(_ images: [UIImage?], columns: Int, fill: UIColor) -> UIImage? {
    guard !images.isEmpty else { return nil }
    let width = RichPrintMetrics.mediaWidth
    let gap = RichPrintMetrics.gridGap
    let cell = (width - gap * CGFloat(columns - 1)) / CGFloat(columns)
    let cellHeight = cell * 2 / 3
    let rows = Int(ceil(Double(images.count) / Double(columns)))
    let size = CGSize(width: width, height: CGFloat(rows) * cellHeight + CGFloat(rows - 1) * gap)
    let format = UIGraphicsImageRendererFormat()
    format.scale = 2
    return UIGraphicsImageRenderer(size: size, format: format).image { context in
      for (index, image) in images.enumerated() {
        let rect = CGRect(
          x: CGFloat(index % columns) * (cell + gap),
          y: CGFloat(index / columns) * (cellHeight + gap),
          width: cell,
          height: cellHeight
        )
        fill.setFill()
        context.fill(rect)
        guard let image, image.size.width > 0, image.size.height > 0 else { continue }
        let scale = max(rect.width / image.size.width, rect.height / image.size.height)
        let drawn = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        context.cgContext.saveGState()
        context.cgContext.clip(to: rect)
        image.draw(in: CGRect(
          x: rect.midX - drawn.width / 2,
          y: rect.midY - drawn.height / 2,
          width: drawn.width,
          height: drawn.height
        ))
        context.cgContext.restoreGState()
      }
    }
  }

  @MainActor
  private static func mapSnapshot(_ segments: [[CLLocationCoordinate2D]], accent: UIColor) async -> UIImage? {
    guard !segments.isEmpty else { return nil }
    var rect = MKMapRect.null
    for segment in segments {
      rect = rect.union(MKPolyline(coordinates: segment, count: segment.count).boundingMapRect)
    }
    let padX = max(rect.width * 0.15, 400)
    let padY = max(rect.height * 0.15, 400)
    let options = MKMapSnapshotter.Options()
    options.mapRect = rect.insetBy(dx: -padX, dy: -padY)
    options.size = CGSize(width: RichPrintMetrics.mediaWidth, height: RichPrintMetrics.mapHeight)
    options.scale = 2
    options.traitCollection = UITraitCollection(userInterfaceStyle: .light)
    let configuration = MKStandardMapConfiguration(emphasisStyle: .muted)
    configuration.pointOfInterestFilter = .excludingAll
    options.preferredConfiguration = configuration

    guard let snapshot = try? await MKMapSnapshotter(options: options).start() else { return nil }
    let format = UIGraphicsImageRendererFormat()
    format.scale = 2
    return UIGraphicsImageRenderer(size: options.size, format: format).image { context in
      snapshot.image.draw(at: .zero)
      let cg = context.cgContext
      cg.setLineCap(.round)
      cg.setLineJoin(.round)
      for (width, color) in [(CGFloat(6), UIColor.white), (CGFloat(3), accent)] {
        cg.setLineWidth(width)
        cg.setStrokeColor(color.cgColor)
        for segment in segments {
          cg.beginPath()
          for (index, coordinate) in segment.enumerated() {
            let point = snapshot.point(for: coordinate)
            if index == 0 { cg.move(to: point) } else { cg.addLine(to: point) }
          }
          cg.strokePath()
        }
      }
      if let start = segments.first?.first, let end = segments.last?.last {
        for (coordinate, isStart) in [(start, true), (end, false)] {
          let point = snapshot.point(for: coordinate)
          let dot = UIBezierPath(ovalIn: CGRect(x: point.x - 5, y: point.y - 5, width: 10, height: 10))
          dot.lineWidth = 2
          (isStart ? UIColor.white : accent).setFill()
          (isStart ? accent : UIColor.white).setStroke()
          dot.fill()
          dot.stroke()
        }
      }
    }
  }

  @MainActor
  private static func klineImage(_ item: [String: Any], colors: [String: Any]) -> UIImage? {
    let model = KlineModel()
    model.bars = (item["bars"] as? [[String: Any]] ?? []).map { raw in
      var bar = KlineBar()
      bar.t = (raw["t"] as? NSNumber)?.doubleValue ?? 0
      bar.o = (raw["o"] as? NSNumber)?.doubleValue ?? 0
      bar.h = (raw["h"] as? NSNumber)?.doubleValue ?? 0
      bar.l = (raw["l"] as? NSNumber)?.doubleValue ?? 0
      bar.c = (raw["c"] as? NSNumber)?.doubleValue ?? 0
      bar.v = (raw["v"] as? NSNumber)?.doubleValue ?? 0
      return bar
    }
    guard !model.bars.isEmpty else { return nil }
    model.emas = (item["ema"] as? [[String: Any]] ?? []).map { raw in
      var ema = KlineEma()
      ema.period = (raw["period"] as? NSNumber)?.intValue ?? 0
      ema.values = (raw["values"] as? [NSNumber] ?? []).map(\.doubleValue)
      ema.color = (raw["color"] as? String).flatMap { UIColor(richHex: $0) }
      return ema
    }
    func color(_ key: String) -> Color {
      Color((colors[key] as? String).flatMap { UIColor(richHex: $0) } ?? .gray)
    }
    model.upColor = color("up")
    model.downColor = color("down")
    model.gridColor = color("grid")
    model.labelColor = color("label")
    model.volumeColor = color("volume")
    let renderer = ImageRenderer(content: KlineChart(model: model)
      .frame(width: RichPrintMetrics.mediaWidth, height: RichPrintMetrics.klineHeight)
      .environment(\.colorScheme, .light))
    renderer.scale = 2
    return renderer.uiImage
  }

  @MainActor
  private static func present(renderer: UIPrintPageRenderer, jobName: String) async {
    let info = UIPrintInfo.printInfo()
    info.outputType = .general
    info.orientation = .portrait
    info.jobName = jobName

    let controller = UIPrintInteractionController.shared
    controller.printInfo = info
    controller.printPageRenderer = renderer

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      var resumed = false
      let finish = {
        guard !resumed else { return }
        resumed = true
        continuation.resume()
      }
      let presented: Bool
      if let host = keyWindow() {
        let rect = CGRect(x: host.bounds.midX - 1, y: host.bounds.midY - 1, width: 2, height: 2)
        presented = controller.present(from: rect, in: host, animated: true) { _, _, _ in finish() }
      } else {
        presented = controller.present(animated: true) { _, _, _ in finish() }
      }
      if !presented { finish() }
    }
  }

  private static func writePDF(renderer: UIPrintPageRenderer, jobName: String) -> String? {
    let paper = RichPrintMetrics.a4
    renderer.setValue(paper, forKey: "paperRect")
    renderer.setValue(paper, forKey: "printableRect")
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("yohaku-article-print.pdf")
    let format = UIGraphicsPDFRendererFormat()
    format.documentInfo = [kCGPDFContextTitle as String: jobName]
    do {
      try UIGraphicsPDFRenderer(bounds: paper, format: format).writePDF(to: url) { context in
        let pages = renderer.numberOfPages
        renderer.prepare(forDrawingPages: NSRange(location: 0, length: pages))
        for index in 0..<pages {
          context.beginPage()
          renderer.drawPage(at: index, in: paper)
        }
      }
    } catch {
      return nil
    }
    return url.path
  }

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }
  }
}

final class RichPrintPageRenderer: UIPrintPageRenderer {
  private let storage: NSTextStorage
  private let layout = RichLayoutManager()
  private let siteName: String
  private let footerColor: UIColor
  private var pageSize: CGSize = .zero

  init(text: NSAttributedString, typography: RichTypography, siteName: String) {
    storage = NSTextStorage(attributedString: text)
    self.siteName = siteName
    footerColor = typography.secondaryColor
    super.init()
    layout.usesFontLeading = false
    layout.quoteColor = typography.secondaryColor.withAlphaComponent(0.5)
    layout.ruleColor = typography.secondaryColor.withAlphaComponent(0.3)
    storage.addLayoutManager(layout)
    headerHeight = RichPrintMetrics.headerHeight
    footerHeight = RichPrintMetrics.footerHeight
  }

  override var numberOfPages: Int {
    paginate()
    return layout.textContainers.count
  }

  private var contentSize: CGSize {
    CGSize(
      width: printableRect.width - 2 * RichPrintMetrics.sideInset,
      height: printableRect.height - headerHeight - footerHeight
    )
  }

  private func paginate() {
    let size = contentSize
    guard size != pageSize, size.width > 0, size.height > 0 else { return }
    pageSize = size
    while !layout.textContainers.isEmpty { layout.removeTextContainer(at: 0) }
    fitAttachments(in: size)
    repeat {
      let container = NSTextContainer(size: size)
      container.lineFragmentPadding = 0
      layout.addTextContainer(container)
      if layout.glyphRange(for: container).length == 0 {
        layout.removeTextContainer(at: layout.textContainers.count - 1)
        break
      }
    } while NSMaxRange(layout.glyphRange(for: layout.textContainers.last!)) < layout.numberOfGlyphs
  }

  private func fitAttachments(in size: CGSize) {
    let maxHeight = size.height * 0.85
    var mathScales: [(NSRange, CGFloat)] = []
    storage.enumerateAttribute(.attachment, in: NSRange(location: 0, length: storage.length)) { value, range, _ in
      guard let attachment = value as? NSTextAttachment else { return }
      if let key = storage.attribute(.richMath, at: range.location, effectiveRange: nil) as? String {
        guard let box = RichMath.box(forKey: key) else { return }
        let scale = min(1, size.width / box.size.width, maxHeight / box.size.height)
        attachment.bounds = RichMath.bounds(of: box, scale: scale, onBaseline: attachment.bounds.minY >= 0)
        mathScales.append((range, scale))
        return
      }
      guard let image = attachment.image else { return }
      let natural = image.size
      guard natural.width > 0, natural.height > 0 else { return }
      let scale = min(1, size.width / natural.width, maxHeight / natural.height)
      attachment.bounds = CGRect(x: 0, y: 0, width: natural.width * scale, height: natural.height * scale)
    }
    for (range, scale) in mathScales {
      storage.addAttribute(.richMathScale, value: NSNumber(value: Double(scale)), range: range)
    }
  }

  override func drawContentForPage(at pageIndex: Int, in contentRect: CGRect) {
    paginate()
    guard pageIndex < layout.textContainers.count else { return }
    let glyphs = layout.glyphRange(for: layout.textContainers[pageIndex])
    let origin = CGPoint(x: contentRect.minX + RichPrintMetrics.sideInset, y: contentRect.minY)
    layout.drawBackground(forGlyphRange: glyphs, at: origin)
    layout.drawGlyphs(forGlyphRange: glyphs, at: origin)
  }

  override func drawFooterForPage(at pageIndex: Int, in footerRect: CGRect) {
    let attributes: [NSAttributedString.Key: Any] = [
      .font: UIFont.systemFont(ofSize: 9, weight: .regular),
      .foregroundColor: footerColor,
    ]
    let inset = RichPrintMetrics.sideInset
    let baseline = footerRect.minY + 4
    (siteName as NSString).draw(at: CGPoint(x: footerRect.minX + inset, y: baseline), withAttributes: attributes)
    let page = "\(pageIndex + 1)" as NSString
    let width = page.size(withAttributes: attributes).width
    page.draw(at: CGPoint(x: footerRect.maxX - inset - width, y: baseline), withAttributes: attributes)
  }
}
