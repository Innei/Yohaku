// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class DomWebViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDomWebViewModule")

    Constants([
      "vendor": "yohaku"
    ])

    OnDestroy {
      DomWebViewRegistry.shared.reset()
      DispatchQueue.main.async {
        SharedReaderWebView.shared.reset()
      }
    }

    AsyncFunction("evalJsForWebViewAsync") { (webViewId: Int, source: String) in
      if let webView = DomWebViewRegistry.shared.get(webViewId: webViewId) {
        webView.injectJavaScript(source)
      }
    }

    AsyncFunction("setReaderContent") { (payload: String) -> Bool in
      await SharedReaderWebView.shared.setContentAndWait(payload)
    }

    AsyncFunction("presentImagePreview") { (payload: ImagePreviewPayload) in
      DomImagePreviewDomain.present(
        urls: payload.urls,
        index: payload.index,
        sourceRectInWindow: nil,
        objectFit: payload.objectFit,
        cornerRadius: CGFloat(payload.cornerRadius ?? 0),
        window: nil,
        siteReferer: payload.siteReferer
      )
    }.runOnQueue(.main)

    AsyncFunction("presentFilePreview") { (payload: FilePreviewPayload) in
      DomFilePreviewDomain.present(
        url: payload.url,
        name: payload.name,
        mimeType: payload.mimeType,
        siteReferer: payload.siteReferer
      )
    }.runOnQueue(.main)

    AsyncFunction("prefetchImages") { (urls: [String], siteReferer: String?) in
      DomImageAssetStore.shared.prefetch(urls, siteReferer: siteReferer)
    }

    AsyncFunction("clearImageCache") {
      DomImageAssetStore.shared.clear()
    }.runOnQueue(.main)

    Function("imageCacheBytes") { () -> Double in
      Double(DomImageAssetStore.shared.diskBytes())
    }

    AsyncFunction("printTargetWebView") { (siteName: String, jobName: String) -> Bool in
      await DomPrintDomain.printTarget(siteName: siteName, jobName: jobName)
      return true
    }

    AsyncFunction("exportTargetWebViewToPDF") { (siteName: String, jobName: String) -> String in
      await DomPrintDomain.exportPDF(siteName: siteName, jobName: jobName) ?? ""
    }

    // swiftlint:disable closure_body_length
    View(DomWebView.self) {
      Events("onMessage", "onContentProcessDidTerminate")

      Prop("source") { (view: DomWebView, source: DomWebViewSource) in
        view.setSource(source)
      }

      Prop("injectedJavaScript") { (view: DomWebView, script: String) in
        view.setInjectedJS(script)
      }

      Prop("injectedJavaScriptBeforeContentLoaded") { (view: DomWebView, script: String) in
        view.setInjectedJSBeforeContentLoaded(script)
      }

      Prop("injectedJavaScriptObject") { (view: DomWebView, source: String) in
        view.setInjectedJavaScriptObject(source)
      }

      Prop("webviewDebuggingEnabled") { (view: DomWebView, enabled: Bool) in
        view.webviewDebuggingEnabled = enabled
      }

      Prop("useExpoModulesBridge") { (view: DomWebView, enabled: Bool) in
        view.useExpoModulesBridge = enabled
      }

      Prop("hideKeyboardAccessoryView") { (view: DomWebView, hidden: Bool) in
        view.hideKeyboardAccessoryView = hidden
      }

      Prop("selectionMenu") { (view: DomWebView, value: String) in
        view.selectionMenu = value
      }

      Prop("selectionCommentTitle") { (view: DomWebView, value: String) in
        view.selectionCommentTitle = value
      }

      Prop("selectionBlockTitle") { (view: DomWebView, value: String) in
        view.selectionBlockTitle = value
      }

      Prop("shared") { (view: DomWebView, value: Bool) in
        view.shared = value
      }

      Prop("printTarget") { (view: DomWebView, value: Bool) in
        view.printTarget = value
      }

      Prop("siteReferer") { (view: DomWebView, value: String?) in
        view.siteReferer = value
      }

      // MARK: - WKWebViewConfiguration props (init-only)

      Prop("allowsInlineMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsInlineMediaPlayback = enabled
      }

      Prop("mediaPlaybackRequiresUserAction") { (view: DomWebView, enabled: Bool) in
        view.mediaPlaybackRequiresUserAction = enabled
      }

      Prop("allowsPictureInPictureMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsPictureInPictureMediaPlayback = enabled
      }

      Prop("allowsAirPlayForMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsAirPlayForMediaPlayback = enabled
      }

      // MARK: - IosScrollViewProps

      Prop("bounces") { (view: DomWebView, enabled: Bool) in
        view.bounces = enabled
      }

      Prop("decelerationRate") { (view: DomWebView, decelerationRate: Either<String, Double>) in
        var newDecelerationRate: UIScrollView.DecelerationRate?
        if let rateString: String = decelerationRate.get() {
          if rateString == "normal" {
            newDecelerationRate = .normal
          } else if rateString == "fast" {
            newDecelerationRate = .fast
          }
        } else if let rate: Double = decelerationRate.get() {
          newDecelerationRate = UIScrollView.DecelerationRate(rawValue: rate)
        }
        if let newDecelerationRate {
          view.decelerationRate = newDecelerationRate
        }
      }

      Prop("scrollEnabled") { (view: DomWebView, enabled: Bool) in
        view.scrollEnabled = enabled
      }

      Prop("pagingEnabled") { (view: DomWebView, enabled: Bool) in
        view.pagingEnabled = enabled
      }

      Prop("automaticallyAdjustContentInsets") { (view: DomWebView, enabled: Bool) in
        view.automaticallyAdjustContentInsets = enabled
      }

      Prop("automaticallyAdjustsScrollIndicatorInsets") { (view: DomWebView, enabled: Bool) in
        view.automaticallyAdjustsScrollIndicatorInsets = enabled
      }

      Prop("contentInset") { (view: DomWebView, inset: ContentInset) in
        view.contentInset = inset.toEdgeInsets()
      }

      Prop("contentInsetAdjustmentBehavior") { (view: DomWebView, value: ContentInsetAdjustmentBehavior) in
        view.contentInsetAdjustmentBehavior = value.toContentInsetAdjustmentBehavior()
      }

      Prop("directionalLockEnabled") { (view: DomWebView, enabled: Bool) in
        view.directionalLockEnabled = enabled
      }

      Prop("showsHorizontalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.showsHorizontalScrollIndicator = enabled
      }

      Prop("showsVerticalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.showsVerticalScrollIndicator = enabled
      }

      Prop("scrollEdgeEffects") { (view: DomWebView, value: ScrollEdgeEffects) in
        view.scrollEdgeEffects = value
      }

      Prop("headerTitle") { (view: DomWebView, value: String) in
        view.headerTitle = value
      }

      Prop("headerMeta") { (view: DomWebView, value: String) in
        view.headerMeta = value
      }

      Prop("headerTitleColor") { (view: DomWebView, value: String) in
        if let color = UIColor(yohakuHex: value) {
          view.headerTitleColor = color
        }
      }

      Prop("headerMetaColor") { (view: DomWebView, value: String) in
        if let color = UIColor(yohakuHex: value) {
          view.headerMetaColor = color
        }
      }

      // MARK: - Imperative methods

      AsyncFunction("scrollTo") { (view: DomWebView, param: ScrollToParam) in
        view.scrollTo(offset: CGPoint(x: param.x, y: param.y), animated: param.animated)
      }

      AsyncFunction("injectJavaScript") { (view: DomWebView, script: String) in
        view.injectJavaScript(script)
      }

      AsyncFunction("reload") { (view: DomWebView) in
        view.forceReload()
      }

      OnViewDidUpdateProps { view in
        view.reload()
      }
    }
    // swiftlint:enable closure_body_length

    View(DomRemoteImageView.self) {
      ViewName("RemoteImage")

      Prop("uri") { (view: DomRemoteImageView, uri: String) in
        view.setUri(uri)
      }

      Prop("contentFit") { (view: DomRemoteImageView, fit: String) in
        view.setContentFit(fit)
      }

      Prop("images") { (view: DomRemoteImageView, images: [String]) in
        view.setImages(images)
      }

      Prop("index") { (view: DomRemoteImageView, index: Int) in
        view.setIndex(index)
      }

      Prop("label") { (view: DomRemoteImageView, label: String?) in
        view.setAccessibilityLabelValue(label)
      }
    }
  }
}
