// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import ExpoModulesCore
import WebKit

// `WKWebView` subclass that can hide the keyboard input accessory bar.
// https://stackoverflow.com/a/58001395/7070640
final class DomWKWebView: WKWebView {
  var hidesInputAccessoryView = false
  var selectionMenu = "default"
  var selectionCommentTitle = "评论"
  var selectionBlockTitle = "本段"
  var siteReferer: String?

  override var inputAccessoryView: UIView? {
    hidesInputAccessoryView ? nil : super.inputAccessoryView
  }

  override func buildMenu(with builder: UIMenuBuilder) {
    super.buildMenu(with: builder)
    guard selectionMenu == "copyComment" else { return }
    builder.remove(menu: .lookup)
    builder.remove(menu: .share)
    builder.remove(menu: .speech)
    builder.remove(menu: .learn)
    let comment = UIAction(title: selectionCommentTitle) { [weak self] _ in
      self?.requestSelectionComment()
    }
    let block = UIAction(title: selectionBlockTitle) { [weak self] _ in
      self?.requestBlockComment()
    }
    builder.insertSibling(
      UIMenu(
        identifier: UIMenu.Identifier("dev.yohaku.selectionComment"),
        options: .displayInline,
        children: [comment, block]
      ),
      afterMenu: .standardEdit
    )
  }

  func requestSelectionComment() {
    evaluateJavaScript(
      "window.__yohakuRequestSelectionComment?window.__yohakuRequestSelectionComment():window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'yohaku:selection-comment-invalid'}))"
    )
  }

  func requestBlockComment() {
    evaluateJavaScript(
      "window.__yohakuRequestBlockComment?window.__yohakuRequestBlockComment():window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'yohaku:selection-block-invalid'}))"
    )
  }
}

extension WKWebViewConfiguration {
  // Release builds load the DOM bundle over `file://`, where WebKit hands every
  // file its own opaque origin: reading `document.styleSheets[i].cssRules`
  // throws `SecurityError` for each exported `<link>` stylesheet. Libraries that
  // copy page CSS into a shadow root — react-tweet's `IsolatedTweet`, which the
  // X embed renders through — then adopt nothing and paint unstyled. Dev never
  // shows it because Metro inlines the same CSS as `<style>` tags, which are
  // always same-origin.
  // The key-value path is the public-looking name, but the only accessor
  // WebKit actually declares is the underscored one KVC falls back to — probing
  // for the unprefixed selector answers `false` and would skip the fix.
  func enableFileAccessFromFileURLs() {
    guard preferences.responds(to: Selector(("_setAllowFileAccessFromFileURLs:"))) else { return }
    preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
  }
}

// A pooled webview keeps rendering while it waits to be adopted, so the pool
// records what it reports and replays it to the adopting view.
private final class PooledInstance {
  static let replayCapacity = 8
  // A prime is claimed by the mount it was fired for, which is one push
  // transition away. Anything older was never claimed — expiring it keeps a
  // prime that lost its screen from parking the instance out of reach forever.
  static let primeLifetime: TimeInterval = 5

  let webView: DomWKWebView
  // Log evidence only, no behavioral use.
  let origin: String
  private(set) var primeKey: String?
  private(set) var replay: [(type: String, body: String)] = []
  private var primedAt: Date?

  var acceptsPrime: Bool {
    guard let primedAt else { return true }
    return Date().timeIntervalSince(primedAt) > Self.primeLifetime
  }

  init(_ webView: DomWKWebView, origin: String) {
    self.webView = webView
    self.origin = origin
  }

  func claimPrime(key: String) {
    releasePrime()
    primeKey = key
    primedAt = Date()
  }

  func record(type: String, body: String) {
    if let index = replay.firstIndex(where: { $0.type == type }) {
      replay[index] = (type, body)
    } else if replay.count < Self.replayCapacity {
      replay.append((type, body))
    }
  }

  func releasePrime() {
    primeKey = nil
    primedAt = nil
    replay = []
  }
}

// Yohaku patch: keeps booted webviews alive across component unmounts so a
// remount with the same source URL adopts a warm instance instead of reloading.
// New props still land through the `$$props` emission on JS mount, so adopted
// instances re-render with fresh content without a page load.
//
// `take()` also backfills: after an adopt drops the pool below `backfillTarget`,
// it boots a replacement for the same URL in the background so a second deep
// navigation (article -> in-body link -> article) still finds a warm instance
// instead of paying the cold-boot cost the pool exists to avoid.
//
// `prime()` pushes a screen's content into a pooled instance at the moment of
// the tap, so the page renders while the push transition plays instead of
// waiting for the mount's `$$props`. The pool listens for the result itself —
// while pooled there is no `DomWebView` to receive it — and replays it to
// whichever view adopts the instance under the same key.
final class DomWebViewPool: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
  struct Adoption {
    let webView: DomWKWebView
    let replay: [String]
  }

  static let shared = DomWebViewPool()
  private static let capacity = 2
  private static let backfillTarget = 1
  private static let backfillTimeout: TimeInterval = 10
  // A native action is a pending call, not a state report, and its marshalled
  // prop belongs to the screen that unmounted — replaying it after adoption
  // would run another screen's callback. It is answered instead (see
  // `rejectNativeAction`), never recorded.
  private static let nativeActionMessageType = "$$native_action"
  private static let nativeActionResultMessageType = "$$native_action_result"
  private static let domEventName = "$$dom_event"
  private var instances: [PooledInstance] = []
  // Strong: this is the only reference keeping the in-flight boot alive
  // before it lands in `instances` — weak here would let ARC free it before
  // navigation finishes.
  private var backfillingWebView: DomWKWebView?
  private var backfillInFlight = false
  // The document-start scripts a real mount would install (RNW bridge, and
  // critically Expo's own `injectedJavaScriptObject` that seeds
  // `$$EXPO_INITIAL_PROPS` for the DOM bundle's inline bootstrap) — a
  // backfilled instance gets exactly one real navigation and is never
  // reloaded again, so without these its bootstrap throws, `registerDOMComponent`
  // bails, and the page never mounts. The `injectedJavaScriptObject` script is
  // replayed with its `content` field emptied: booting the runtime does not
  // require booting the article, and the full payload would render, decode,
  // and fetch a duplicate of whatever the user is currently reading. Handed
  // over by `DomWebView.resetupScripts()` after every real setup.
  // Main-thread only, unlike `sourceURL`: both writer and reader already run
  // there, so no lock is needed.
  private var bootScriptsURL: URL?
  private var bootScripts: [WKUserScript] = []

  func noteBootScripts(_ scripts: [WKUserScript], for url: URL) {
    bootScriptsURL = url
    bootScripts = scripts
  }

  // The DOM component's URL is `getBaseURL()/<babel-generated filePath>`, which
  // app code cannot reconstruct (the path is an md5 of the source file URL in
  // release builds); handing back the URL a real mount resolved is the only
  // honest way for a caller to name the instances it wants primed.
  // Written on main, read from the JS thread by the synchronous accessor.
  private var storedSourceURL: URL?
  private let sourceURLLock = NSLock()

  var sourceURL: URL? {
    sourceURLLock.lock()
    defer { sourceURLLock.unlock() }
    return storedSourceURL
  }

  func noteSourceURL(_ url: URL?) {
    guard let url else { return }
    sourceURLLock.lock()
    storedSourceURL = url
    sourceURLLock.unlock()
  }

  // A warm boot builds its file URL from `Bundle.main.resourceURL` while a real
  // mount's comes through `RCTConvert` — same file, but `/private/var` vs `/var`
  // style differences would read as different URLs and silently strand every
  // warmed instance, so file URLs also match on standardized paths.
  static func urlsMatch(_ lhs: URL?, _ rhs: URL) -> Bool {
    guard let lhs else { return false }
    if lhs.absoluteURL == rhs.absoluteURL { return true }
    guard lhs.isFileURL, rhs.isFileURL else { return false }
    return lhs.standardizedFileURL.resolvingSymlinksInPath().path
      == rhs.standardizedFileURL.resolvingSymlinksInPath().path
  }

  func take(url: URL?, primeKey: String?) -> Adoption? {
    guard let url else { return nil }
    let matchesURL = { (instance: PooledInstance) in
      Self.urlsMatch(instance.webView.url, url)
    }
    let primed = primeKey.flatMap { key in
      instances.firstIndex { matchesURL($0) && $0.primeKey == key }
    }
    guard let index = primed ?? instances.firstIndex(where: matchesURL) else {
      log.info("[YohakuPool] miss \(url.absoluteString) pooled=\(instances.count)")
      return nil
    }
    let instance = instances.remove(at: index)
    instance.webView.navigationDelegate = nil
    if primed == nil, instance.primeKey != nil {
      // Primed content was made visible again by its own render; without this
      // the adopting screen shows another article until its props arrive.
      instance.webView.evaluateJavaScript(Self.resetScript, completionHandler: nil)
    }
    let replay = primed == nil ? [] : instance.replay.map(\.body)
    log.info(
      "[YohakuPool] adopt origin=\(instance.origin) \(url.absoluteString) pooled=\(instances.count) replay=\(replay.count)"
    )
    scheduleBackfill(sourceURL: url)
    return Adoption(webView: instance.webView, replay: replay)
  }

  func give(_ webView: DomWKWebView) {
    guard webView.url != nil, instances.count < Self.capacity else {
      log.info("[YohakuPool] discard pooled=\(instances.count)")
      return
    }
    webView.removeFromSuperview()
    webView.uiDelegate = nil
    webView.scrollView.delegate = nil
    webView.selectionMenu = "default"
    webView.selectionCommentTitle = "评论"
    webView.selectionBlockTitle = "本段"
    webView.siteReferer = nil
    let controller = webView.configuration.userContentController
    controller.removeAllScriptMessageHandlers()
    controller.add(WeakScriptMessageHandler(delegate: self), name: DomWebView.POST_MESSAGE_HANDLER_NAME)
    webView.evaluateJavaScript(Self.resetScript, completionHandler: nil)
    webView.scrollView.contentOffset = .zero
    webView.navigationDelegate = self
    instances.append(PooledInstance(webView, origin: "give"))
    log.info("[YohakuPool] give pooled=\(instances.count)")
  }

  // Boots the pool at launch with no React mount having happened yet: the
  // caller fabricates the boot inputs a real mount would have produced
  // (initialProps with empty content, the body-size observer, the media
  // rewrite) and this resolves which exported DOM component is the article
  // body. A later real mount overwrites the source URL and boot scripts with
  // its captured, fully-real versions.
  func warm(
    candidates: [URL],
    injectedObjectJson: String,
    injectedJavaScript: String,
    injectedJavaScriptBeforeContentLoaded: String
  ) {
    guard instances.isEmpty, !backfillInFlight, bootScriptsURL == nil else {
      log.info("[YohakuPool] warm skipped pooled=\(instances.count)")
      return
    }
    // File reads (the html and the JS bundles it references, potentially MBs)
    // stay off the main thread; only the WebKit boot hops back.
    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let url = Self.resolveArticleBodyURL(candidates: candidates) else {
        log.info("[YohakuPool] warm found no article DOM component")
        return
      }
      DispatchQueue.main.async {
        guard let self else { return }
        guard self.instances.isEmpty, !self.backfillInFlight, self.bootScriptsURL == nil else {
          log.info("[YohakuPool] warm lost the race to a real mount")
          return
        }
        var scripts: [WKUserScript] = [
          WKUserScript(source: DomWebView.postMessageBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        ]
        // Injection times mirror `DomWebView.setInjectedJS` /
        // `setInjectedJSBeforeContentLoaded` / `setInjectedJavaScriptObject`.
        if !injectedJavaScript.isEmpty {
          scripts.append(WKUserScript(source: injectedJavaScript, injectionTime: .atDocumentEnd, forMainFrameOnly: false))
        }
        if !injectedJavaScriptBeforeContentLoaded.isEmpty {
          scripts.append(WKUserScript(source: injectedJavaScriptBeforeContentLoaded, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        }
        scripts.append(WKUserScript(
          source: DomWebView.injectedObjectJsonBridgeScript(payload: injectedObjectJson),
          injectionTime: .atDocumentStart,
          forMainFrameOnly: true
        ))
        self.noteBootScripts(scripts, for: url)
        self.noteSourceURL(url)
        log.info("[YohakuPool] warm booting \(url.absoluteString)")
        self.scheduleBackfill(sourceURL: url)
      }
    }
  }

  // The article body's page is the one whose JS defines `window.__yohakuPrime`
  // (already this pool's prime contract) — recognized by grepping each
  // candidate html's referenced script files for the literal. Works on both
  // export layouts: embedded `www.bundle` (relative `_expo/static/...` tree)
  // and an OTA update's flat directory of content-md5 names.
  private static let primeMarker = Data("__yohakuPrime".utf8)

  private static func resolveArticleBodyURL(candidates: [URL]) -> URL? {
    var htmls = candidates.filter { $0.pathExtension == "html" }
    if htmls.isEmpty {
      guard let dir = Bundle.main.resourceURL?.appendingPathComponent("www.bundle") else { return nil }
      let listing = (try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)) ?? []
      htmls = listing.filter { $0.pathExtension == "html" }
    }
    guard let scriptSrc = try? NSRegularExpression(pattern: #"src="([^"]+\.js)""#) else { return nil }
    for html in htmls {
      guard let text = try? String(contentsOf: html, encoding: .utf8) else { continue }
      let dir = html.deletingLastPathComponent()
      let range = NSRange(text.startIndex..., in: text)
      let referencesPrime = scriptSrc.matches(in: text, range: range).contains { match in
        guard let srcRange = Range(match.range(at: 1), in: text) else { return false }
        var src = String(text[srcRange])
        if src.hasPrefix("./") { src.removeFirst(2) }
        let js = dir.appendingPathComponent(src)
        guard let data = try? Data(contentsOf: js, options: .mappedIfSafe) else { return false }
        return data.range(of: primeMarker) != nil
      }
      if referencesPrime { return html }
    }
    return nil
  }

  func prime(url: URL, key: String, payload: String) {
    guard let literal = Self.jsStringLiteral(payload) else { return }
    prime(
      url: url,
      key: key,
      script: "(function(){try{return !!(window.__yohakuPrime&&window.__yohakuPrime(\(literal)))}catch(e){return false}})()",
      skipping: []
    )
  }

  private func prime(url: URL, key: String, script: String, skipping: Set<ObjectIdentifier>) {
    guard let instance = instances.first(where: {
      $0.acceptsPrime
        && Self.urlsMatch($0.webView.url, url)
        && !skipping.contains(ObjectIdentifier($0.webView))
    }) else {
      log.info("[YohakuPool] prime miss key=\(key) pooled=\(instances.count)")
      return
    }
    let id = ObjectIdentifier(instance.webView)
    instance.claimPrime(key: key)
    instance.webView.evaluateJavaScript(script) { [weak self, weak instance] result, _ in
      if (result as? NSNumber)?.boolValue == true {
        log.info("[YohakuPool] prime hit key=\(key)")
        return
      }
      // A backfilled page loads without expo's `initialProps` script, so its DOM
      // runtime never mounts and it swallows the injection: release it and move
      // on rather than spending the prime on a page that cannot render it.
      instance?.releasePrime()
      self?.prime(url: url, key: key, script: script, skipping: skipping.union([id]))
    }
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    instances.removeAll { $0.webView === webView }
    guard let dom = webView as? DomWKWebView, dom === backfillingWebView else {
      log.info("[YohakuPool] dropped terminated instance pooled=\(instances.count)")
      return
    }
    clearBackfillState()
    log.info("[YohakuPool] backfill terminated pooled=\(instances.count)")
  }

  // `backfillInFlight` is only ever flipped true here, on `take()`'s caller
  // thread, so it can't race a second `take()` into scheduling twice — that
  // keeps concurrent backfills capped at 1, matching (capacity - target).
  // The hop through a background queue before returning to main decouples
  // the boot from `take()`'s call stack; `WKWebView` itself is still only
  // ever touched on main, since WebKit APIs are main-thread only.
  private func scheduleBackfill(sourceURL: URL) {
    guard instances.count < Self.backfillTarget, !backfillInFlight else { return }
    backfillInFlight = true
    log.info("[YohakuPool] backfill scheduled \(sourceURL.absoluteString) pooled=\(instances.count)")
    DispatchQueue.global(qos: .utility).async { [weak self] in
      DispatchQueue.main.async {
        self?.bootBackfill(sourceURL: sourceURL)
      }
    }
  }

  private func bootBackfill(sourceURL: URL) {
    guard instances.count < Self.capacity else {
      clearBackfillState()
      log.info("[YohakuPool] backfill skipped pooled=\(instances.count)")
      return
    }

    let controller = WKUserContentController()
    // Registered before load, not after `didFinish` as this used to: once the
    // bootstrap can actually mount (see `bootScripts` below), the DOM app
    // fires its own `postMessage` calls within a couple of frames of mount,
    // and `window.webkit.messageHandlers.<name>` must already exist for the
    // bridge script's call to find it instead of throwing.
    controller.add(WeakScriptMessageHandler(delegate: self), name: DomWebView.POST_MESSAGE_HANDLER_NAME)
    // Scoped to `useExpoModulesBridge == false` real mounts: that flag's own
    // scripts bake in the *mounting* view's numeric webview id, which would
    // be permanently wrong for whichever different view later adopts this
    // instance. Not a concern for any DOM component pooled today (none use
    // it), but a future one that does would need this reconsidered.
    if let bootScriptsURL, Self.urlsMatch(bootScriptsURL, sourceURL) {
      for script in bootScripts {
        controller.addUserScript(script)
      }
    } else {
      log.info("[YohakuPool] backfill has no bootstrap scripts for \(sourceURL.absoluteString)")
    }

    let config = WKWebViewConfiguration()
    DomAssetSchemeHandler.install(on: config)
    config.enableFileAccessFromFileURLs()
    config.userContentController = controller
    config.allowsInlineMediaPlayback = true
    config.allowsPictureInPictureMediaPlayback = true
    config.allowsAirPlayForMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = .all

    let webView = DomWKWebView(frame: .zero, configuration: config)
    webView.navigationDelegate = self
    backfillingWebView = webView

    if sourceURL.isFileURL {
      webView.loadFileURL(sourceURL, allowingReadAccessTo: URL(fileURLWithPath: "/"))
    } else {
      webView.load(URLRequest(url: sourceURL))
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + Self.backfillTimeout) { [weak self, weak webView] in
      guard let self, let webView, self.backfillingWebView === webView else { return }
      self.clearBackfillState()
      log.info("[YohakuPool] backfill timeout pooled=\(self.instances.count)")
    }
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    guard let dom = webView as? DomWKWebView, dom === backfillingWebView else { return }
    clearBackfillState()
    guard instances.count < Self.capacity else {
      dom.navigationDelegate = nil
      log.info("[YohakuPool] backfill discarded pooled=\(instances.count)")
      return
    }
    // Not primed, so `take()`'s own reset-on-adopt branch never fires for this
    // instance — hide it the same way `give()` does. Hosts may or may not keep
    // their DOM view transparent until the page reports back, and the pool
    // cannot see which, so every pooled instance leaves here already hidden.
    dom.evaluateJavaScript(Self.resetScript, completionHandler: nil)
    instances.append(PooledInstance(dom, origin: "backfill"))
    log.info("[YohakuPool] backfill filled pooled=\(instances.count)")
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    failBackfill(webView, error: error)
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    failBackfill(webView, error: error)
  }

  private func failBackfill(_ webView: WKWebView, error: Error) {
    guard let dom = webView as? DomWKWebView, dom === backfillingWebView else { return }
    clearBackfillState()
    log.info("[YohakuPool] backfill failed \(error.localizedDescription) pooled=\(instances.count)")
  }

  private func clearBackfillState() {
    backfillingWebView = nil
    backfillInFlight = false
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == DomWebView.POST_MESSAGE_HANDLER_NAME,
      let body = message.body as? String,
      let webView = message.webView else {
      return
    }
    guard let instance = instances.first(where: { $0.webView === webView }) else {
      // A message posted just before an adopt is still delivered here, because
      // the handler swap only reaches the web process afterwards. The instance
      // is gone from the pool by then, so hand it to the view that took it
      // rather than dropping the report it was waiting for.
      DomWebViewRegistry.shared.owner(of: webView)?
        .userContentController(userContentController, didReceive: message)
      return
    }
    guard let data = body.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let type = json["type"] as? String else {
      return
    }
    if type == Self.nativeActionMessageType {
      rejectNativeAction(instance.webView, message: json)
      return
    }
    instance.record(type: type, body: body)
  }

  // `expo/src/dom/marshal.tsx` leaves the caller's promise pending until a
  // result carrying its `uid` comes back, so dropping the call would hang the
  // DOM side forever. There is no host to run it against while pooled, and
  // deferring it to whichever view adopts the instance would fire a callback
  // the adopting screen never asked for — so it is answered with an error and
  // the caller settles now, whether or not this instance is ever adopted.
  private func rejectNativeAction(_ webView: DomWKWebView, message: [String: Any]) {
    guard let data = message["data"] as? [String: Any],
      let uid = data["uid"] as? String,
      let actionId = data["actionId"] as? String else {
      return
    }
    let detail: [String: Any] = [
      "type": Self.nativeActionResultMessageType,
      "data": [
        "uid": uid,
        "actionId": actionId,
        "error": ["message": "Native action \"\(actionId)\" was called while the DOM component was pooled, with no view mounted to run it."]
      ]
    ]
    guard let encoded = try? JSONSerialization.data(withJSONObject: ["detail": detail]),
      let literal = String(data: encoded, encoding: .utf8) else {
      return
    }
    log.info("[YohakuPool] rejected pooled native action \(actionId)")
    webView.evaluateJavaScript(
      "(function(){try{window.dispatchEvent(new CustomEvent(\"\(Self.domEventName)\",\(literal)))}catch(e){}})();true;",
      completionHandler: nil
    )
  }

  private static let resetScript = "window.__yohakuReset && window.__yohakuReset(); true;"

  private static func jsStringLiteral(_ value: String) -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: [value]),
      let json = String(data: data, encoding: .utf8) else {
      return nil
    }
    return String(json.dropFirst().dropLast())
  }
}

internal final class DomWebView: ExpoView, UIScrollViewDelegate, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler, RCTAutoInsetsProtocol {
  // Created on first prop sync — `WKWebViewConfiguration` is copied at init,
  // so init-only props need to land before `WKWebView()` is called.
  private(set) var webView: DomWKWebView?
  // swiftlint:disable:next implicitly_unwrapped_optional
  private(set) var id: WebViewId!

  private var source: DomWebViewSource?
  private var injectedJS: WKUserScript?
  private var injectedJSBeforeContentLoaded: WKUserScript?
  private var injectedObjectJsonScript: WKUserScript?
  // Kept alongside `injectedObjectJsonScript` so the pool can rebuild a
  // content-free variant for backfill without re-deriving the raw payload.
  private var injectedObjectJsonSource: String?
  private var needsResetupScripts = false
  private var ownsMessageHandler = false

  // Expo emits `$$props` from a JS mount effect, which can beat both the
  // `WKWebView`'s creation (`OnViewDidUpdateProps` -> `setupWebView()`) and, on
  // a cold instance, its first navigation. Evaluating into either window is a
  // silent no-op, and since `$$props` is emitted once per change, theme, locale
  // and labels would then stay wrong for the life of the page. Held here until
  // there is a document to run them against — which `WKWebView.url` cannot
  // stand in for, since that is set the moment a navigation *starts* and a
  // script run against the outgoing document dies when the new one commits.
  private var hasDocument = false
  private var pendingInjections: [String] = []
  private static let pendingInjectionCapacity = 8

  // MARK: - WKWebViewConfiguration props (init-only)

  var allowsInlineMediaPlayback: Bool = true
  var mediaPlaybackRequiresUserAction: Bool = true
  var allowsPictureInPictureMediaPlayback: Bool = true
  var allowsAirPlayForMediaPlayback: Bool = true

  // MARK: - Bridge props

  var useExpoModulesBridge: Bool = false {
    didSet { needsResetupScripts = true }
  }

  // Read once, by `setupWebView()`, to pick the pooled instance this view's
  // content was primed into; `OnViewDidUpdateProps` guarantees it is set first.
  var primeKey: String?

  // Insights and other non-article DOM surfaces must set this false so they
  // never take, give, or overwrite the article pool's source URL / boot scripts.
  var pooled: Bool = true

  var printTarget: Bool = false {
    didSet { DomPrintDomain.mark(id: id, enabled: printTarget) }
  }

  // MARK: - WKWebView / UIScrollView props (mutable post-creation)

  var webviewDebuggingEnabled: Bool = false {
    didSet {
      if #available(iOS 16.4, *) {
        webView?.isInspectable = webviewDebuggingEnabled
      }
    }
  }

  var decelerationRate: UIScrollView.DecelerationRate = .normal

  var bounces: Bool = true {
    didSet { webView?.scrollView.bounces = bounces }
  }
  var scrollEnabled: Bool = true {
    didSet { webView?.scrollView.isScrollEnabled = scrollEnabled }
  }
  var pagingEnabled: Bool = false {
    didSet { webView?.scrollView.isPagingEnabled = pagingEnabled }
  }
  var directionalLockEnabled: Bool = true {
    didSet { webView?.scrollView.isDirectionalLockEnabled = directionalLockEnabled }
  }
  var showsHorizontalScrollIndicator: Bool = true {
    didSet { webView?.scrollView.showsHorizontalScrollIndicator = showsHorizontalScrollIndicator }
  }
  var showsVerticalScrollIndicator: Bool = true {
    didSet { webView?.scrollView.showsVerticalScrollIndicator = showsVerticalScrollIndicator }
  }
  var automaticallyAdjustsScrollIndicatorInsets: Bool = true {
    didSet {
      webView?.scrollView.automaticallyAdjustsScrollIndicatorInsets = automaticallyAdjustsScrollIndicatorInsets
    }
  }
  var contentInsetAdjustmentBehavior: UIScrollView.ContentInsetAdjustmentBehavior = .automatic {
    didSet {
      // Preserve contentOffset so safe-area re-application doesn't jump the page.
      guard let scrollView = webView?.scrollView else { return }
      let contentOffset = scrollView.contentOffset
      scrollView.contentInsetAdjustmentBehavior = contentInsetAdjustmentBehavior
      scrollView.contentOffset = contentOffset
    }
  }
  var scrollEdgeEffects: ScrollEdgeEffects? {
    didSet { applyScrollEdgeEffects() }
  }
  var headerTitle: String = "" {
    didSet { refreshHeaderContent() }
  }
  var headerMeta: String = "" {
    didSet { refreshHeaderContent() }
  }
  var headerTitleColor: UIColor = .label {
    didSet { titleLabel.textColor = headerTitleColor }
  }
  var headerMetaColor: UIColor = .secondaryLabel {
    didSet { metaLabel.textColor = headerMetaColor }
  }

  private let headerContainer = UIView()
  private let titleLabel = UILabel()
  private let metaLabel = UILabel()
  private var headerEdgeInteraction: (any UIInteraction)?

  // MARK: - Keyboard props

  // Hides the input accessory bar shown above the keyboard while a web text
  // field is focused. Mirrors `react-native-webview`'s `hideKeyboardAccessoryView`.
  var hideKeyboardAccessoryView: Bool = false {
    didSet { webView?.hidesInputAccessoryView = hideKeyboardAccessoryView }
  }

  var selectionMenu: String = "default" {
    didSet { webView?.selectionMenu = selectionMenu }
  }

  var selectionCommentTitle: String = "评论" {
    didSet { webView?.selectionCommentTitle = selectionCommentTitle }
  }

  var selectionBlockTitle: String = "本段" {
    didSet { webView?.selectionBlockTitle = selectionBlockTitle }
  }

  var siteReferer: String? {
    didSet { webView?.siteReferer = siteReferer }
  }

  // MARK: - RCTAutoInsetsProtocol storage

  @objc var contentInset: UIEdgeInsets = .zero {
    didSet { refreshContentInset() }
  }
  @objc var automaticallyAdjustContentInsets: Bool = true {
    didSet { refreshContentInset() }
  }

  internal typealias SyncCompletionHandler = (String?) -> Void

  private static let EVAL_PROMPT_HEADER = "__EXPO_DOM_WEBVIEW_JS_EVAL__"
  static let POST_MESSAGE_HANDLER_NAME = "ReactNativeWebView"
  // One literal for every path that has to define this bridge: an instance
  // booted outside a mount must end up with the same `postMessage` a
  // live-mounted one has, and two copies of it would drift silently.
  static let postMessageBridgeScript = """
  window.ReactNativeWebView ||= {};
  window.ReactNativeWebView.postMessage = function postMessage(data) {
    window.webkit.messageHandlers.\(POST_MESSAGE_HANDLER_NAME).postMessage(String(data));
  };
  true;
  """

  private let onMessage = EventDispatcher()
  private let onContentProcessDidTerminate = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    super.backgroundColor = .clear
    self.id = DomWebViewRegistry.shared.add(webView: self)
    installHeader()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    webView?.frame = bounds
    layoutHeader()
    orderSubviews()
  }

  override var backgroundColor: UIColor? {
    didSet { applyBackgroundColor() }
  }

  private func applyBackgroundColor() {
    let color = backgroundColor
    self.isOpaque = (color ?? UIColor.clear).cgColor.alpha == 1.0
    webView?.isOpaque = self.isOpaque
    webView?.scrollView.backgroundColor = color
    webView?.backgroundColor = color
  }

  deinit {
    DomPrintDomain.mark(id: id, enabled: false)
    let shouldPool = pooled
    if let webView {
      DispatchQueue.main.async {
        if shouldPool {
          DomWebViewPool.shared.give(webView)
        }
      }
    }
    DomWebViewRegistry.shared.remove(webViewId: self.id)
  }

  // MARK: - Public methods

  func reload() {
    if webView == nil {
      setupWebView()
    }

    let scriptsChanged = needsResetupScripts
    if needsResetupScripts {
      resetupScripts()
      needsResetupScripts = false
    }

    if let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)),
      webView?.url?.absoluteURL != request.url {
      load(request: request)
    } else if scriptsChanged, webView?.url != nil {
      // User scripts only run at .atDocumentStart; reload to pick up the new ones.
      hasDocument = false
      webView?.reload()
    }
  }

  func forceReload() {
    if webView?.url != nil {
      hasDocument = false
      webView?.reload()
      return
    }
    guard let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)) else {
      return
    }
    if webView == nil {
      setupWebView()
    }
    load(request: request)
  }

  private func load(request: URLRequest) {
    hasDocument = false
    if let url = request.url, url.isFileURL {
      // Grant read access to the bundle so DOM components can load sibling assets.
      webView?.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: "/"))
    } else {
      webView?.load(request)
    }
  }

  func scrollTo(offset: CGPoint, animated: Bool) {
    webView?.scrollView.setContentOffset(offset, animated: animated)
  }

  func injectJavaScript(_ script: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      guard let webView = self.webView, self.hasDocument else {
        self.enqueueInjection(script)
        return
      }
      webView.evaluateJavaScript(script)
    }
  }

  private func enqueueInjection(_ script: String) {
    if pendingInjections.count >= Self.pendingInjectionCapacity {
      pendingInjections.removeFirst()
      log.info("[YohakuPool] injection queue full, dropped the oldest of \(Self.pendingInjectionCapacity)")
    }
    pendingInjections.append(script)
    log.info("[YohakuPool] injection queued pending=\(pendingInjections.count)")
  }

  private func flushPendingInjections() {
    guard !pendingInjections.isEmpty, hasDocument, let webView else {
      return
    }
    let scripts = pendingInjections
    pendingInjections = []
    log.info("[YohakuPool] injection flush count=\(scripts.count)")
    for script in scripts {
      webView.evaluateJavaScript(script)
    }
  }

  func setSource(_ source: DomWebViewSource) {
    self.source = source
  }

  func setInjectedJS(_ script: String?) {
    if let script, !script.isEmpty {
      injectedJS = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
    } else {
      injectedJS = nil
    }
    needsResetupScripts = true
  }

  func setInjectedJSBeforeContentLoaded(_ script: String?) {
    if let script, !script.isEmpty {
      injectedJSBeforeContentLoaded = WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    } else {
      injectedJSBeforeContentLoaded = nil
    }
    needsResetupScripts = true
  }

  func setInjectedJavaScriptObject(_ source: String?) {
    if let source, !source.isEmpty {
      injectedObjectJsonSource = source
      injectedObjectJsonScript = WKUserScript(
        source: Self.injectedObjectJsonBridgeScript(payload: source),
        injectionTime: .atDocumentStart,
        forMainFrameOnly: true
      )
    } else {
      injectedObjectJsonSource = nil
      injectedObjectJsonScript = nil
    }
    needsResetupScripts = true
  }

  static func injectedObjectJsonBridgeScript(payload: String) -> String {
    """
    window.ReactNativeWebView = window.ReactNativeWebView || {};
    window.ReactNativeWebView.injectedObjectJson = function () {
      return JSON.stringify(\(payload));
    }
    true;
    """
  }

  // Expo's DOM entry point mounts `React.useState` with `window.$$EXPO_INITIAL_PROPS`
  // and never touches it again — real content only ever arrives afterwards
  // through the live `$$props` postMessage channel (see `webview-wrapper.tsx`'s
  // `emit({ type: '$$props', ... })`). That means a backfilled instance's
  // *initial* props only need to be shaped correctly, not populated with the
  // article currently on screen: booting the runtime does not require booting
  // the article. `payload` is `JSON.stringify({ EXPO_DOM_HOST_OS, initialProps:
  // { names, props } })` — plain JSON text used as a JS object-literal (no
  // function values ever appear here; those are marshalled separately into
  // `names`) — so it round-trips through `JSONSerialization` safely. Falls
  // back to the untouched payload if the shape ever doesn't match, since a
  // duplicate render is a smaller problem than a dead page.
  private static func contentFreeInitialPropsPayload(_ payload: String) -> String {
    guard let data = payload.data(using: .utf8),
      var root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      var initialProps = root["initialProps"] as? [String: Any],
      var props = initialProps["props"] as? [String: Any],
      props["content"] is String else {
      log.info("[YohakuPool] boot scripts: initialProps shape not recognized, backfill will replay full content")
      return payload
    }
    props["content"] = ""
    initialProps["props"] = props
    root["initialProps"] = initialProps
    guard let neuteredData = try? JSONSerialization.data(withJSONObject: root),
      let neuteredPayload = String(data: neuteredData, encoding: .utf8) else {
      log.info("[YohakuPool] boot scripts: failed to re-encode content-free initialProps, backfill will replay full content")
      return payload
    }
    return neuteredPayload
  }

  // MARK: - UIScrollViewDelegate implementations

  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    scrollView.decelerationRate = decelerationRate
  }

  // MARK: - WKUIDelegate implementations

  func webView(
    _ webView: WKWebView,
    runJavaScriptTextInputPanelWithPrompt prompt: String,
    defaultText: String?,
    initiatedByFrame frame: WKFrameInfo,
    completionHandler: @escaping SyncCompletionHandler
  ) {
    if !prompt.hasPrefix(Self.EVAL_PROMPT_HEADER) || !useExpoModulesBridge {
      completionHandler(nil)
      return
    }
    let script = String(prompt.dropFirst(Self.EVAL_PROMPT_HEADER.count))
    if let data = script.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
      let deferredId = json["deferredId"] as? Int,
      let source = json["source"] as? String {
      nativeJsiEvalSync(deferredId: deferredId, source: source, completionHandler: completionHandler)
    } else {
      completionHandler("Invalid parameters for nativeJsiEvalSync")
    }
  }

  private func applyScrollEdgeEffects() {
    guard let scrollView = webView?.scrollView else { return }
    applyScrollEdgeEffects(to: scrollView)
  }

  private func applyScrollEdgeEffects(to scrollView: UIScrollView) {
    guard #available(iOS 26.0, *), let effects = scrollEdgeEffects else { return }
    apply(effects.top, to: scrollView.topEdgeEffect)
    apply(effects.bottom, to: scrollView.bottomEdgeEffect)
    apply(effects.left, to: scrollView.leftEdgeEffect)
    apply(effects.right, to: scrollView.rightEdgeEffect)
  }

  private func installHeader() {
    headerContainer.backgroundColor = .clear
    headerContainer.isOpaque = false
    headerContainer.isUserInteractionEnabled = false
    headerContainer.isHidden = true

    titleLabel.font = UIFont(name: "Inter_500Medium", size: 15)
      ?? .systemFont(ofSize: 15, weight: .medium)
    titleLabel.textColor = headerTitleColor
    titleLabel.setContentCompressionResistancePriority(.required, for: .horizontal)

    metaLabel.font = UIFont(name: "Inter_400Regular", size: 12) ?? .systemFont(ofSize: 12)
    metaLabel.textColor = headerMetaColor
    metaLabel.lineBreakMode = .byTruncatingTail

    headerContainer.addSubview(titleLabel)
    headerContainer.addSubview(metaLabel)
    addSubview(headerContainer)
  }

  private func refreshHeaderContent() {
    titleLabel.text = headerTitle
    metaLabel.text = headerMeta
    metaLabel.isHidden = headerMeta.isEmpty
    headerContainer.isHidden = headerTitle.isEmpty && headerMeta.isEmpty
    setNeedsLayout()
    bindHeaderInteraction()
  }

  private func layoutHeader() {
    let width = bounds.width
    let titleSize = titleLabel.sizeThatFits(CGSize(width: width, height: 20))
    titleLabel.frame = CGRect(x: 20, y: 24, width: ceil(titleSize.width), height: 20)
    let metaX = titleLabel.frame.maxX + 10
    metaLabel.frame = CGRect(
      x: metaX,
      y: 26,
      width: max(0, width - 20 - metaX),
      height: 16
    )
    headerContainer.frame = CGRect(x: 0, y: 0, width: width, height: 56)
  }

  private func orderSubviews() {
    if let webView {
      sendSubviewToBack(webView)
    }
    bringSubviewToFront(headerContainer)
  }

  private func bindHeaderInteraction() {
    guard #available(iOS 26.0, *), let scrollView = webView?.scrollView else { return }
    guard !headerContainer.isHidden else { return }
    if let existing = headerEdgeInteraction as? UIScrollEdgeElementContainerInteraction {
      existing.scrollView = scrollView
      existing.edge = .top
      return
    }
    let next = UIScrollEdgeElementContainerInteraction()
    next.scrollView = scrollView
    next.edge = .top
    headerContainer.addInteraction(next)
    headerEdgeInteraction = next
  }

  @available(iOS 26.0, *)
  private func apply(_ kind: ScrollEdgeEffectKind?, to effect: UIScrollEdgeEffect) {
    guard let kind else { return }
    switch kind {
    case .automatic:
      effect.isHidden = false
      effect.style = .automatic
    case .hard:
      effect.isHidden = false
      effect.style = .hard
    case .soft:
      effect.isHidden = false
      effect.style = .soft
    case .hidden:
      effect.isHidden = true
    }
  }

  // MARK: - RCTAutoInsetsProtocol implementations

  @objc func refreshContentInset() {
    guard let webView else { return }
    RCTView.autoAdjustInsets(for: self, with: webView.scrollView, updateOffset: true)
  }

  // MARK: - WKNavigationDelegate implementations

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    log.warn("WebView content process terminated")
    onContentProcessDidTerminate(createBaseEventPayload())
  }

  // A cold instance has a `WKWebView` from `setupWebView()` but no document
  // until here, so this is the second of the two windows `pendingInjections`
  // covers; an adopted instance already has one and drains at setup instead.
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    hasDocument = true
    flushPendingInjections()
    applyScrollEdgeEffects(to: webView.scrollView)
    bindHeaderInteraction()
  }

  // MARK: - WKScriptMessageHandler implementations

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if message.name == Self.POST_MESSAGE_HANDLER_NAME {
      if message.frameInfo.isMainFrame,
        let sourceWebView = message.webView,
        DomImagePreviewDomain.handle(messageBody: message.body, from: sourceWebView)
          || DomFilePreviewDomain.handle(messageBody: message.body, from: sourceWebView)
      {
        return
      }
      var payload = createBaseEventPayload()
      payload["data"] = message.body
      onMessage(payload)
      return
    }
  }

  // MARK: - Internals

  private func setupWebView() {
    // Adopted instances already loaded this source URL, so the caller's
    // url-equality check in `reload()` skips the load for them.
    var adoption: DomWebViewPool.Adoption?
    if pooled, let source, let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)) {
      DomWebViewPool.shared.noteSourceURL(request.url)
      adoption = DomWebViewPool.shared.take(url: request.url, primeKey: primeKey)
    }

    let webView: DomWKWebView
    if let adoption {
      webView = adoption.webView
      webView.frame = bounds
    } else {
      let config = WKWebViewConfiguration()
      DomAssetSchemeHandler.install(on: config)
      config.enableFileAccessFromFileURLs()
      config.userContentController = WKUserContentController()
      config.allowsInlineMediaPlayback = allowsInlineMediaPlayback
      config.allowsPictureInPictureMediaPlayback = allowsPictureInPictureMediaPlayback
      config.allowsAirPlayForMediaPlayback = allowsAirPlayForMediaPlayback
      config.mediaTypesRequiringUserActionForPlayback = mediaPlaybackRequiresUserAction ? .all : []
      webView = DomWKWebView(frame: bounds, configuration: config)
    }
    webView.hidesInputAccessoryView = hideKeyboardAccessoryView
    webView.selectionMenu = selectionMenu
    webView.selectionCommentTitle = selectionCommentTitle
    webView.selectionBlockTitle = selectionBlockTitle
    webView.siteReferer = siteReferer
    webView.uiDelegate = self
    webView.navigationDelegate = self

    let scrollView = webView.scrollView
    scrollView.delegate = self
    scrollView.bounces = bounces
    scrollView.isScrollEnabled = scrollEnabled
    scrollView.isPagingEnabled = pagingEnabled
    scrollView.isDirectionalLockEnabled = directionalLockEnabled
    scrollView.showsHorizontalScrollIndicator = showsHorizontalScrollIndicator
    scrollView.showsVerticalScrollIndicator = showsVerticalScrollIndicator
    scrollView.automaticallyAdjustsScrollIndicatorInsets = automaticallyAdjustsScrollIndicatorInsets
    scrollView.contentInsetAdjustmentBehavior = contentInsetAdjustmentBehavior
    applyScrollEdgeEffects(to: scrollView)

    if #available(iOS 16.4, *) {
      webView.isInspectable = webviewDebuggingEnabled
    }

    self.webView = webView
    hasDocument = adoption != nil
    ownsMessageHandler = false
    insertSubview(webView, at: 0)

    applyBackgroundColor()
    refreshContentInset()
    orderSubviews()
    bindHeaderInteraction()
    resetupScripts()
    needsResetupScripts = false
    flushPendingInjections()

    guard let replay = adoption?.replay, !replay.isEmpty else { return }
    // Emitting inside this prop transaction would fire before the view's
    // `onMessage` listener is installed and the events would be dropped.
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      for body in replay {
        var payload = self.createBaseEventPayload()
        payload["data"] = body
        self.onMessage(payload)
      }
    }
  }

  private func createBaseEventPayload() -> [String: Any] {
    return [
      "url": webView?.url?.absoluteString ?? "",
      "title": webView?.title ?? ""
    ]
  }

  private func resetupScripts() {
    guard let userContentController = webView?.configuration.userContentController else {
      return
    }
    userContentController.removeAllUserScripts()

    // Every prop update re-runs this, and between the remove and the add the
    // page has no `webkit.messageHandlers.ReactNativeWebView` — a body report
    // landing in that window throws and is lost for good. Take the handler over
    // from the pool once per webview and leave it alone afterwards.
    if !ownsMessageHandler {
      userContentController.removeAllScriptMessageHandlers()
      userContentController.add(WeakScriptMessageHandler(delegate: self), name: Self.POST_MESSAGE_HANDLER_NAME)
      ownsMessageHandler = true
    }

    if let injectedJS {
      userContentController.addUserScript(injectedJS)
    }
    if let injectedJSBeforeContentLoaded {
      userContentController.addUserScript(injectedJSBeforeContentLoaded)
    }
    if let injectedObjectJsonScript {
      userContentController.addUserScript(injectedObjectJsonScript)
    }

    userContentController.addUserScript(WKUserScript(source: Self.postMessageBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

    // Hand this mount's document-start scripts to the pool so a future
    // backfill for this same URL can replay them before its one real
    // navigation — see `DomWebViewPool.bootScripts`. Built explicitly rather
    // than read back off `userContentController.userScripts`, so the
    // `injectedObjectJsonScript` copy handed to the pool can have its
    // `content` emptied without touching what this live view actually loads.
    // Deliberately excludes the `useExpoModulesBridge` scripts below: those
    // bake in this specific view's webview id and would be wrong for
    // whichever view later adopts a backfilled instance.
    if pooled,
      let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)),
      let requestURL = request.url {
      var pooledScripts: [WKUserScript] = [
        WKUserScript(source: Self.postMessageBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false)
      ]
      if let injectedJS {
        pooledScripts.append(injectedJS)
      }
      if let injectedJSBeforeContentLoaded {
        pooledScripts.append(injectedJSBeforeContentLoaded)
      }
      if let injectedObjectJsonSource {
        let contentFreeSource = Self.contentFreeInitialPropsPayload(injectedObjectJsonSource)
        pooledScripts.append(WKUserScript(
          source: Self.injectedObjectJsonBridgeScript(payload: contentFreeSource),
          injectionTime: .atDocumentStart,
          forMainFrameOnly: true
        ))
      }
      DomWebViewPool.shared.noteBootScripts(pooledScripts, for: requestURL)
    }

    if useExpoModulesBridge {
      let addDomWebViewBridgeScript = """
      window.ExpoDomWebViewBridge = {
        eval: function eval(params) {
          return window.prompt('\(Self.EVAL_PROMPT_HEADER)' + params);
        },
      };
      true;
      """
      userContentController.addUserScript(WKUserScript(source: addDomWebViewBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

      guard let webViewId = self.id else {
        return
      }

      let addExpoDomWebViewObjectScript = "\(INSTALL_GLOBALS_SCRIPT);true;"
        .replacingOccurrences(of: "\"%%WEBVIEW_ID%%\"", with: String(webViewId))
      userContentController.addUserScript(WKUserScript(source: addExpoDomWebViewObjectScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))
    }
  }

  private func nativeJsiEvalSync(deferredId: Int, source: String, completionHandler: @escaping SyncCompletionHandler) {
    guard let appContext else {
      completionHandler("Missing AppContext")
      return
    }
    guard let webViewId = self.id else {
      completionHandler("Missing webViewId")
      return
    }
    guard let runtime = try? appContext.runtime else {
      completionHandler("Missing JS Runtime")
      return
    }
    try? appContext.runtime.schedule {
      let wrappedSource = NATIVE_EVAL_WRAPPER_SCRIPT
        .replacingOccurrences(of: "\"%%DEFERRED_ID%%\"", with: String(deferredId))
        .replacingOccurrences(of: "\"%%WEBVIEW_ID%%\"", with: String(webViewId))
        .replacingOccurrences(of: "\"%%SOURCE%%\"", with: source)
      do {
        let result = try runtime.eval(wrappedSource)
        completionHandler(result.getString())
      } catch {
        completionHandler("\(error)")
      }
    }
  }
}
