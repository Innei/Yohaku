import WebKit

final class DomAssetSchemeHandler: NSObject, WKURLSchemeHandler {
  static let scheme = "yohaku-asset"

  private var tasks: [ObjectIdentifier: DomImageAssetLoadToken] = [:]
  private let lock = NSLock()

  static func install(on configuration: WKWebViewConfiguration) {
    if configuration.urlSchemeHandler(forURLScheme: scheme) == nil {
      configuration.setURLSchemeHandler(DomAssetSchemeHandler(), forURLScheme: scheme)
    }
  }

  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    guard
      let requestURL = urlSchemeTask.request.url,
      let source = DomImageAssetSource.resolveAssetURL(requestURL)
    else {
      urlSchemeTask.didFailWithError(
        NSError(
          domain: "YohakuAsset",
          code: 400,
          userInfo: [NSLocalizedDescriptionKey: "Invalid asset request"]
        )
      )
      return
    }

    let id = ObjectIdentifier(urlSchemeTask)
    let token = DomImageAssetStore.shared.load(source) { [weak self] result in
      guard let self, self.removeTask(id) != nil else { return }
      switch result {
      case .success(let asset):
        urlSchemeTask.didReceive(asset.response)
        urlSchemeTask.didReceive(asset.data)
        urlSchemeTask.didFinish()
      case .failure(let error):
        urlSchemeTask.didFailWithError(error)
      }
    }

    lock.lock()
    tasks[id] = token
    lock.unlock()
  }

  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    removeTask(ObjectIdentifier(urlSchemeTask))?.cancel()
  }

  @discardableResult
  private func removeTask(_ id: ObjectIdentifier) -> DomImageAssetLoadToken? {
    lock.lock()
    defer { lock.unlock() }
    return tasks.removeValue(forKey: id)
  }
}
