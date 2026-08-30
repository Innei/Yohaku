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

// One article renderer stays alive and moves between detail-screen hosts. This
// is deliberately not a pool: the reader has one owner, one document and only
// the newest content waiting to be delivered.
final class SharedReaderWebView: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
  static let shared = SharedReaderWebView()

  private weak var owner: DomWebView?
  private var webView: DomWKWebView?
  private var sourceURL: URL?
  // Navigation completion is earlier than the React bridge; only
  // `$$dom_ready` makes JavaScript injection safe.
  private var ready = false
  private var pendingContent: String?
  private var renderedReaderId: String?
  private var waitReaderId: String?
  private var contentWaiter: CheckedContinuation<Bool, Never>?
  private var waitTimeout: DispatchWorkItem?
  private let parkingHost = UIView()
  private var parkingHandler: WeakScriptMessageHandler?

  var hasInstance: Bool {
    dispatchPrecondition(condition: .onQueue(.main))
    return webView != nil
  }

  func take(for owner: DomWebView, sourceURL: URL) -> (webView: DomWKWebView, ready: Bool)? {
    dispatchPrecondition(condition: .onQueue(.main))
    guard let webView else { return nil }
    guard Self.urlsMatch(self.sourceURL, sourceURL) else {
      discard()
      return nil
    }

    if let previousOwner = self.owner, previousOwner !== owner {
      if Self.isForegroundHost(previousOwner), !Self.isForegroundHost(owner) {
        return nil
      }
      previousOwner.releaseSharedWebView(webView)
    }
    self.owner = owner
    webView.removeFromSuperview()
    parkingHost.removeFromSuperview()
    webView.navigationDelegate = owner
    return (webView, ready)
  }

  func keep(_ webView: DomWKWebView, for owner: DomWebView, sourceURL: URL) {
    dispatchPrecondition(condition: .onQueue(.main))
    discard()
    self.webView = webView
    self.owner = owner
    self.sourceURL = sourceURL
    ready = false
  }

  func detach(_ webView: DomWKWebView, from owner: DomWebView) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard self.webView === webView, self.owner === owner else { return }
    self.owner = nil
    park(webView)
  }

  func detachOrphaned(_ webView: DomWKWebView) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard self.webView === webView, owner == nil else { return }
    park(webView)
  }

  func matches(_ webView: DomWKWebView, sourceURL: URL) -> Bool {
    self.webView === webView && Self.urlsMatch(self.sourceURL, sourceURL)
  }

  func didStartLoading(_ webView: DomWKWebView, sourceURL: URL) {
    guard self.webView === webView else { return }
    self.sourceURL = sourceURL
    ready = false
    renderedReaderId = nil
  }

  func willReload(_ webView: WKWebView) {
    guard self.webView === webView else { return }
    ready = false
    renderedReaderId = nil
  }

  func didBecomeReady(_ webView: WKWebView) {
    guard self.webView === webView else { return }
    ready = true
    flushContent()
  }

  func didRender(_ readerId: String?) {
    renderedReaderId = readerId
    if let waitReaderId, waitReaderId == readerId {
      finishWait(true)
    }
  }

  func didTerminate(_ webView: WKWebView) {
    guard self.webView === webView else { return }
    ready = false
    renderedReaderId = nil
    if owner == nil {
      discard()
    }
  }

  func setContent(_ payload: String) {
    dispatchPrecondition(condition: .onQueue(.main))
    pendingContent = payload
    layoutParked()
    flushContent()
  }

  func setContentAndWait(_ payload: String) async -> Bool {
    await withCheckedContinuation { continuation in
      let begin = {
        self.beginContentWait(payload, continuation: continuation)
      }
      if Thread.isMainThread {
        begin()
      } else {
        DispatchQueue.main.async(execute: begin)
      }
    }
  }

  func reset() {
    dispatchPrecondition(condition: .onQueue(.main))
    pendingContent = nil
    discard()
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    didTerminate(webView)
  }

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard message.name == DomWebView.POST_MESSAGE_HANDLER_NAME,
      let body = message.body as? String else {
      return
    }
    Self.dispatchBridgeMessage(body, from: message.webView)
  }

  static func dispatchBridgeMessage(_ body: String, from webView: WKWebView?) {
    guard let data = body.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let type = json["type"] as? String else {
      return
    }
    if type == "$$dom_ready", let webView {
      shared.didBecomeReady(webView)
    }
    if type == "yohaku:reader-ready" {
      shared.didRender(json["data"] as? String)
    }
  }

  static func urlsMatch(_ lhs: URL?, _ rhs: URL) -> Bool {
    guard let lhs else { return false }
    if lhs.absoluteURL == rhs.absoluteURL { return true }
    guard lhs.isFileURL, rhs.isFileURL else { return false }
    return lhs.standardizedFileURL.resolvingSymlinksInPath().path
      == rhs.standardizedFileURL.resolvingSymlinksInPath().path
  }

  private func beginContentWait(
    _ payload: String,
    continuation: CheckedContinuation<Bool, Never>
  ) {
    dispatchPrecondition(condition: .onQueue(.main))
    finishWait(false)
    pendingContent = payload
    waitReaderId = Self.readerId(from: payload)
    contentWaiter = continuation
    layoutParked()
    if ready, let waitReaderId, renderedReaderId == waitReaderId {
      finishWait(true)
      flushContent()
      return
    }
    flushContent()
    let timeout = DispatchWorkItem { [weak self] in
      self?.finishWait(false)
    }
    waitTimeout = timeout
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: timeout)
  }

  private func finishWait(_ value: Bool) {
    waitTimeout?.cancel()
    waitTimeout = nil
    waitReaderId = nil
    guard let waiter = contentWaiter else { return }
    contentWaiter = nil
    waiter.resume(returning: value)
  }

  private func flushContent() {
    guard ready,
      let webView,
      let payload = pendingContent,
      let literal = Self.jsStringLiteral(payload) else {
      return
    }
    webView.evaluateJavaScript("window.__yohakuSetReaderContent?.(\(literal)) === true") { [weak self, weak webView] result, _ in
      guard let self, let webView, self.webView === webView else { return }
      if (result as? NSNumber)?.boolValue == true, self.pendingContent == payload {
        self.pendingContent = nil
      }
    }
  }

  private func park(_ webView: DomWKWebView) {
    webView.uiDelegate = nil
    webView.navigationDelegate = self
    webView.scrollView.delegate = nil
    webView.scrollView.isScrollEnabled = false
    bindParkingHandler(webView)
    layoutParked(webView)
  }

  private func layoutParked(_ parked: DomWKWebView? = nil) {
    guard let webView = parked ?? (owner == nil ? webView : nil) else { return }
    let size = Self.viewportSize()
    parkingHost.frame = CGRect(x: -size.width, y: 0, width: size.width, height: size.height)
    parkingHost.isUserInteractionEnabled = false
    webView.frame = parkingHost.bounds
    if webView.superview !== parkingHost {
      parkingHost.addSubview(webView)
    }
    if parkingHost.superview == nil, let window = Self.keyWindow() {
      window.insertSubview(parkingHost, at: 0)
    }
    parkingHost.layoutIfNeeded()
  }

  private func bindParkingHandler(_ webView: DomWKWebView) {
    let userContentController = webView.configuration.userContentController
    userContentController.removeAllScriptMessageHandlers()
    let handler = WeakScriptMessageHandler(delegate: self)
    parkingHandler = handler
    userContentController.add(handler, name: DomWebView.POST_MESSAGE_HANDLER_NAME)
  }

  private func discard() {
    finishWait(false)
    if let webView {
      owner?.releaseSharedWebView(webView)
      webView.stopLoading()
      webView.removeFromSuperview()
      webView.uiDelegate = nil
      webView.navigationDelegate = nil
      webView.scrollView.delegate = nil
      webView.configuration.userContentController.removeAllScriptMessageHandlers()
    }
    parkingHost.removeFromSuperview()
    parkingHandler = nil
    owner = nil
    webView = nil
    sourceURL = nil
    ready = false
    renderedReaderId = nil
  }

  private static func readerId(from payload: String) -> String? {
    guard let data = payload.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return nil
    }
    return json["id"] as? String
  }

  private static func viewportSize() -> CGSize {
    let window = keyWindow()
    let size = window?.bounds.size ?? UIScreen.main.bounds.size
    return CGSize(width: max(size.width, 1), height: max(size.height, 1))
  }

  private static func isForegroundHost(_ view: DomWebView) -> Bool {
    guard view.window != nil, view.bounds.width > 1 else { return false }
    return view.convert(view.bounds, to: nil).minX >= -0.5
  }

  private static func keyWindow() -> UIWindow? {
    let windows = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
    return windows.first(where: \.isKeyWindow) ?? windows.first
  }

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
  private var needsResetupScripts = false
  private var ownsMessageHandler = false
  private var sharedSourceLoaded = false

  // MARK: - WKWebViewConfiguration props (init-only)

  var allowsInlineMediaPlayback: Bool = true
  var mediaPlaybackRequiresUserAction: Bool = true
  var allowsPictureInPictureMediaPlayback: Bool = true
  var allowsAirPlayForMediaPlayback: Bool = true

  // MARK: - Bridge props

  var useExpoModulesBridge: Bool = false {
    didSet { needsResetupScripts = true }
  }

  // Only the main article body opts in. Print, nested documents and other DOM
  // surfaces keep their own WebView by default.
  var shared: Bool = false

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

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard shared else { return }
    if window != nil, webView == nil {
      reload()
    } else if window == nil, let webView {
      SharedReaderWebView.shared.detach(webView, from: self)
      releaseSharedWebView(webView)
    }
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
    if shared, let webView {
      if Thread.isMainThread {
        SharedReaderWebView.shared.detach(webView, from: self)
      } else {
        DispatchQueue.main.async { [weak webView] in
          guard let webView else { return }
          SharedReaderWebView.shared.detachOrphaned(webView)
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
      let requestURL = request.url,
      let webView,
      !SharedReaderWebView.urlsMatch(webView.url, requestURL)
        && !(shared && sharedSourceLoaded
          && SharedReaderWebView.shared.matches(webView, sourceURL: requestURL)) {
      load(request: request)
    } else if scriptsChanged, webView?.url != nil {
      // User scripts only run at .atDocumentStart; reload to pick up the new ones.
      if shared, let webView {
        SharedReaderWebView.shared.willReload(webView)
      }
      webView?.reload()
    }
  }

  func forceReload() {
    if webView?.url != nil {
      if shared, let webView {
        SharedReaderWebView.shared.willReload(webView)
      }
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
    if shared, let webView, let url = request.url {
      sharedSourceLoaded = true
      SharedReaderWebView.shared.didStartLoading(webView, sourceURL: url)
    }
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
      self?.webView?.evaluateJavaScript(script)
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
      injectedObjectJsonScript = WKUserScript(
        source: Self.injectedObjectJsonBridgeScript(payload: source),
        injectionTime: .atDocumentStart,
        forMainFrameOnly: true
      )
    } else {
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
    if shared {
      SharedReaderWebView.shared.didTerminate(webView)
    }
    onContentProcessDidTerminate(createBaseEventPayload())
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    applyScrollEdgeEffects(to: webView.scrollView)
    bindHeaderInteraction()
  }

  // MARK: - WKScriptMessageHandler implementations

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if message.name == Self.POST_MESSAGE_HANDLER_NAME {
      if shared, message.frameInfo.isMainFrame, let body = message.body as? String {
        SharedReaderWebView.dispatchBridgeMessage(body, from: message.webView)
      }
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

  func releaseSharedWebView(_ sharedWebView: DomWKWebView) {
    guard webView === sharedWebView else { return }
    webView = nil
    sharedSourceLoaded = false
    ownsMessageHandler = false
  }

  private func setupWebView() {
    let sharedSourceURL = shared
      ? source.flatMap { RCTConvert.nsurlRequest($0.toDictionary(appContext: appContext))?.url }
      : nil
    let retained = sharedSourceURL.flatMap {
      SharedReaderWebView.shared.take(for: self, sourceURL: $0)
    }
    if retained == nil, shared, SharedReaderWebView.shared.hasInstance {
      return
    }

    let webView: DomWKWebView
    if let retained {
      webView = retained.webView
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
      if let sharedSourceURL {
        SharedReaderWebView.shared.keep(webView, for: self, sourceURL: sharedSourceURL)
      }
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
    sharedSourceLoaded = retained != nil
    ownsMessageHandler = false
    insertSubview(webView, at: 0)

    applyBackgroundColor()
    refreshContentInset()
    orderSubviews()
    bindHeaderInteraction()
    resetupScripts()
    needsResetupScripts = false

    guard retained?.ready == true else { return }
    // A live document does not navigate when it moves to a new native host.
    // Ask Expo's wrapper for the current props and re-report its layout.
    DispatchQueue.main.async { [weak self, weak webView] in
      guard let self, let webView, self.webView === webView else { return }
      webView.evaluateJavaScript("window.__yohakuAttachReader?.(); true;")
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

    // Rebind once when a persistent reader moves to a new native owner.
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
