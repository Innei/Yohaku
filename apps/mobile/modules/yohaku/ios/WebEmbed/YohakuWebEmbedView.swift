import ExpoModulesCore
import UIKit
import WebKit

private let hostHTML = """
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}#host{display:block}</style>
</head>
<body>
<div id="host"></div>
<script>
(function () {
  const post = (message) => window.webkit.messageHandlers.yohaku.postMessage(message)
  const hostEl = document.getElementById('host')
  let handle = null
  let current = null
  new ResizeObserver(() => post({ type: 'height', value: Math.ceil(hostEl.getBoundingClientRect().height) })).observe(hostEl)
  window.__yohakuMount = (config) => {
    current = { props: config.props, host: { theme: config.theme } }
    try { handle && handle.unmount && handle.unmount() } catch (_) {}
    handle = null
    const shadow = hostEl.shadowRoot || hostEl.attachShadow({ mode: 'open' })
    shadow.replaceChildren()
    const container = document.createElement('div')
    container.style.minHeight = config.initialHeight + 'px'
    shadow.append(container)
    import(config.url).then((mod) => {
      const component = mod && mod.default
      if (!component || typeof component.mount !== 'function') throw new Error('no mount')
      handle = component.mount(container, current)
    }).catch(() => post({ type: 'error' }))
  }
  window.__yohakuTheme = (theme) => {
    if (!current) return
    current = { props: current.props, host: { theme } }
    try { handle && handle.update && handle.update(current) } catch (_) {}
  }
  post({ type: 'ready' })
})()
</script>
</body>
</html>
"""

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
  weak var target: YohakuWebEmbedView?

  init(_ target: YohakuWebEmbedView) {
    self.target = target
  }

  func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
    target?.receive(message.body)
  }
}

final class YohakuWebEmbedView: ExpoView, WKNavigationDelegate, WKUIDelegate {
  let onContentHeight = EventDispatcher()
  let onEmbedError = EventDispatcher()
  let onEmbedLink = EventDispatcher()

  var url = ""
  var props: [String: Any] = [:]
  var theme = "light"
  var initialHeight: Double = 320
  var baseUrl = ""

  private let webView: WKWebView
  private var ready = false
  private var loadedBase: String?
  private var awaitingHostLoad = false
  private var mounted: (url: String, props: String)?
  private var mountedTheme: String?

  required init(appContext: AppContext? = nil) {
    let configuration = WKWebViewConfiguration()
    webView = WKWebView(frame: .zero, configuration: configuration)
    super.init(appContext: appContext)
    configuration.userContentController.add(WeakMessageHandler(self), name: "yohaku")
    webView.isOpaque = false
    webView.backgroundColor = .clear
    webView.scrollView.backgroundColor = .clear
    webView.scrollView.isScrollEnabled = false
    webView.scrollView.bounces = false
    webView.navigationDelegate = self
    webView.uiDelegate = self
    addSubview(webView)
  }

  deinit {
    webView.configuration.userContentController.removeScriptMessageHandler(forName: "yohaku")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    webView.frame = bounds
  }

  func update() {
    if loadedBase != baseUrl {
      loadedBase = baseUrl
      ready = false
      mounted = nil
      mountedTheme = nil
      awaitingHostLoad = true
      webView.loadHTMLString(hostHTML, baseURL: URL(string: baseUrl))
      return
    }
    mountIfNeeded()
  }

  func receive(_ body: Any) {
    guard let message = body as? [String: Any], let type = message["type"] as? String else { return }
    switch type {
    case "ready":
      ready = true
      mountIfNeeded()
    case "height":
      if let value = message["value"] as? Double, value > 0 { onContentHeight(["height": value]) }
    case "error":
      onEmbedError([:])
    default:
      break
    }
  }

  private func mountIfNeeded() {
    guard ready, !url.isEmpty else { return }
    let propsJSON = json(props) ?? "{}"
    if mounted?.url != url || mounted?.props != propsJSON {
      mounted = (url, propsJSON)
      mountedTheme = theme
      let config: [String: Any] = ["url": url, "props": props, "theme": theme, "initialHeight": initialHeight]
      guard let payload = json(config) else { return }
      webView.evaluateJavaScript("window.__yohakuMount(\(payload))")
    } else if mountedTheme != theme, let payload = json(theme) {
      mountedTheme = theme
      webView.evaluateJavaScript("window.__yohakuTheme(\(payload))")
    }
  }

  private func json(_ value: Any) -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]) else { return nil }
    return String(data: data, encoding: .utf8)
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    let mainFrame = navigationAction.targetFrame?.isMainFrame != false
    if !mainFrame || awaitingHostLoad || navigationAction.request.url?.scheme == "about" {
      if mainFrame { awaitingHostLoad = false }
      decisionHandler(.allow)
      return
    }
    guard let target = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }
    if navigationAction.navigationType == .linkActivated {
      onEmbedLink(["url": target.absoluteString])
    }
    decisionHandler(.cancel)
  }

  func webView(
    _ webView: WKWebView,
    createWebViewWith configuration: WKWebViewConfiguration,
    for navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    if let target = navigationAction.request.url { onEmbedLink(["url": target.absoluteString]) }
    return nil
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    loadedBase = nil
    update()
  }
}
