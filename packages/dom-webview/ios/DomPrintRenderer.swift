import UIKit
import WebKit

private enum PrintPageMetrics {
  static let mm: CGFloat = 72 / 25.4
  static let headerHeight = 12 * mm
  static let footerHeight: CGFloat = 20
  static let sideInset = 16 * mm
}

enum DomPrintDomain {
  static var targetId: Int?

  static func mark(id: Int?, enabled: Bool) {
    guard let id else { return }
    if enabled {
      targetId = id
    } else if targetId == id {
      targetId = nil
    }
  }

  @MainActor
  static func exportPDF(siteName: String, jobName: String) async -> String? {
    guard let renderer = await makeRenderer(siteName: siteName) else { return nil }
    let name = jobName.isEmpty ? siteName : jobName
    let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("yohaku-article-print.pdf")
    guard writePDF(renderer: renderer, jobName: name, to: url) else { return nil }
    return url.path
  }

  @MainActor
  static func printTarget(siteName: String, jobName: String) async {
    guard let renderer = await makeRenderer(siteName: siteName) else { return }

    let info = UIPrintInfo.printInfo()
    info.outputType = .general
    info.orientation = .portrait
    info.jobName = jobName.isEmpty ? siteName : jobName

    let controller = UIPrintInteractionController.shared
    controller.printInfo = info
    controller.printPageRenderer = renderer

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      let finish = { continuation.resume() }
      if let host = keyWindow() {
        let rect = CGRect(
          x: host.bounds.midX - 1,
          y: host.bounds.midY - 1,
          width: 2,
          height: 2
        )
        controller.present(from: rect, in: host, animated: true) { _, _, _ in
          finish()
        }
      } else {
        controller.present(animated: true) { _, _, _ in
          finish()
        }
      }
    }
  }

  @MainActor
  private static func makeRenderer(siteName: String) async -> DomPrintPageRenderer? {
    guard
      let targetId,
      let owner = DomWebViewRegistry.shared.get(webViewId: targetId),
      let webView = owner.webView
    else { return nil }

    let formatter = webView.viewPrintFormatter()
    formatter.contentInsets = UIEdgeInsets(
      top: 0,
      left: PrintPageMetrics.sideInset,
      bottom: 0,
      right: PrintPageMetrics.sideInset
    )
    let renderer = DomPrintPageRenderer(
      siteName: siteName,
      footerInset: await footerInset(for: webView)
    )
    renderer.addPrintFormatter(formatter, startingAtPageAt: 0)
    return renderer
  }

  @MainActor
  private static func footerInset(for webView: WKWebView) async -> CGFloat {
    let cssLeft: CGFloat = await withCheckedContinuation { continuation in
      webView.evaluateJavaScript(
        """
        (function(){
          function search(win) {
            try {
              var el = win.document.querySelector('.print-masthead h1, .print-masthead, .rich-content');
              if (el) return el.getBoundingClientRect().left;
              for (var i = 0; i < win.frames.length; i++) {
                var found = search(win.frames[i]);
                if (found) return found;
              }
            } catch (e) {}
            return 0;
          }
          return search(window);
        })()
        """
      ) { result, _ in
        let value: CGFloat
        if let number = result as? NSNumber {
          value = CGFloat(truncating: number)
        } else if let double = result as? Double {
          value = CGFloat(double)
        } else {
          value = 0
        }
        continuation.resume(returning: value)
      }
    }
    let contentWidth = 595.2 - 2 * PrintPageMetrics.sideInset
    let scale = contentWidth / max(webView.bounds.width, 1)
    // The 680pt print host still has ~35px of chrome the CSS reset misses.
    // Prefer the measured edge; fall back to that 35px so AirPrint matches.
    let leading = cssLeft > 1 ? cssLeft : 35
    return PrintPageMetrics.sideInset + leading * scale
  }

  private static func writePDF(
    renderer: UIPrintPageRenderer,
    jobName: String,
    to url: URL
  ) -> Bool {
    let paper = CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
    renderer.setValue(paper, forKey: "paperRect")
    renderer.setValue(paper, forKey: "printableRect")
    UIGraphicsBeginPDFContextToFile(
      url.path,
      paper,
      [kCGPDFContextTitle as String: jobName]
    )
    renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
    let bounds = UIGraphicsGetPDFContextBounds()
    for index in 0..<renderer.numberOfPages {
      UIGraphicsBeginPDFPage()
      renderer.drawPage(at: index, in: bounds)
    }
    UIGraphicsEndPDFContext()
    return FileManager.default.fileExists(atPath: url.path)
  }

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }
  }
}

final class DomPrintPageRenderer: UIPrintPageRenderer {
  private let siteName: String
  private let footerInset: CGFloat

  init(siteName: String, footerInset: CGFloat) {
    self.siteName = siteName
    self.footerInset = footerInset
    super.init()
    headerHeight = PrintPageMetrics.headerHeight
    footerHeight = PrintPageMetrics.footerHeight
  }

  override func drawFooterForPage(at pageIndex: Int, in footerRect: CGRect) {
    let attributes: [NSAttributedString.Key: Any] = [
      .font: UIFont.systemFont(ofSize: 10, weight: .regular),
      .foregroundColor: UIColor(white: 0.36, alpha: 1),
    ]
    let inset = footerInset
    let baseline = footerRect.minY + 4
    (siteName as NSString).draw(
      at: CGPoint(x: footerRect.minX + inset, y: baseline),
      withAttributes: attributes
    )
    let page = "\(pageIndex + 1)" as NSString
    let pageSize = page.size(withAttributes: attributes)
    page.draw(
      at: CGPoint(x: footerRect.maxX - inset - pageSize.width, y: baseline),
      withAttributes: attributes
    )
  }
}
