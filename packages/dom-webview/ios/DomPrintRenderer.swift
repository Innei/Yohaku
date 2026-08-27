import UIKit
import WebKit

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
  static func printTarget(siteName: String) async {
    guard
      let targetId,
      let owner = DomWebViewRegistry.shared.get(webViewId: targetId),
      let webView = owner.webView
    else { return }

    let renderer = DomPrintPageRenderer(siteName: siteName)
    renderer.addPrintFormatter(webView.viewPrintFormatter(), startingAtPageAt: 0)

    let info = UIPrintInfo.printInfo()
    info.outputType = .general
    info.orientation = .portrait
    info.jobName = siteName

    let controller = UIPrintInteractionController.shared
    controller.printInfo = info
    controller.printPageRenderer = renderer

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      let finish = { continuation.resume() }
      if let host = webView.window ?? keyWindow() {
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

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }
  }
}

final class DomPrintPageRenderer: UIPrintPageRenderer {
  private let siteName: String

  init(siteName: String) {
    self.siteName = siteName
    super.init()
    headerHeight = 0
    footerHeight = 20
  }

  override func drawFooterForPage(at pageIndex: Int, in footerRect: CGRect) {
    let attributes: [NSAttributedString.Key: Any] = [
      .font: UIFont.systemFont(ofSize: 10, weight: .regular),
      .foregroundColor: UIColor(white: 0.36, alpha: 1),
    ]
    let baseline = footerRect.minY + 4
    (siteName as NSString).draw(
      at: CGPoint(x: footerRect.minX, y: baseline),
      withAttributes: attributes
    )
    let page = "\(pageIndex + 1)" as NSString
    let pageSize = page.size(withAttributes: attributes)
    page.draw(
      at: CGPoint(x: footerRect.maxX - pageSize.width, y: baseline),
      withAttributes: attributes
    )
  }
}
