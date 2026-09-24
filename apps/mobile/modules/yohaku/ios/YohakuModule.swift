import ExpoModulesCore
import Foundation

public class YohakuModule: Module {
  private let tts = TtsPlayer()

  public func definition() -> ModuleDefinition {
    Name("Yohaku")

    Events(
      "onTtsTime",
      "onTtsEnded",
      "onTtsError",
      "onTtsRemote",
      "onTtsInterrupted",
      "onMeTabLongPress"
    )

    Constants([
      "liquidGlassAvailable": TabBarDomain.liquidGlassAvailable
    ])

    OnCreate {
      self.tts.emit = { [weak self] name, body in
        self?.sendEvent(name, body)
      }
      TabBarDomain.onMeTabLongPress = { [weak self] in
        self?.sendEvent("onMeTabLongPress", [:])
      }
    }

    AsyncFunction("presentSafari") { (url: String) in
      try await BrowserPresenter.presentSafari(url)
    }

    AsyncFunction("openAuthSession") { (url: String, scheme: String) -> [String: Any] in
      try await BrowserPresenter.authSession(url, scheme: scheme)
    }

    AsyncFunction("dismissAuthSession") {
      await BrowserPresenter.dismissAuthSession()
    }

    AsyncFunction("configureCompactNativeTabBar") {
      TabBarDomain.configureCompactNativeTabBar()
    }.runOnQueue(.main)

    AsyncFunction("setRestorableRoute") { (routeURL: String) in
      NotificationCenter.default.post(
        name: Notification.Name("YohakuRestorableRouteDidChange"),
        object: nil,
        userInfo: ["routeURL": routeURL]
      )
    }.runOnQueue(.main)

    AsyncFunction("circularImageUri") { (urlString: String) -> [String: Any] in
      let source = try await TabBarDomain.circularImageUri(urlString: urlString)
      return [
        "height": source.height,
        "scale": source.scale,
        "uri": source.uri,
        "width": source.width,
      ]
    }

    AsyncFunction("rasterizeSvg") { (payload: SvgRasterPayload) -> [String: Any] in
      let rendered = try await SvgRasterDomain.render(
        svg: payload.svg,
        width: payload.width,
        height: payload.height,
        bg: payload.bg
      )
      return [
        "height": rendered.height,
        "uri": rendered.uri,
        "width": rendered.width,
      ]
    }

    AsyncFunction("renderMermaid") { (payload: MermaidRenderPayload) -> [String: Any] in
      let rendered = try await MermaidDomain.render(
        source: payload.source,
        bg: payload.bg,
        fg: payload.fg
      )
      return [
        "height": rendered.height,
        "uri": rendered.uri,
        "width": rendered.width,
      ]
    }

    AsyncFunction("printRichDocument") { (payload: [String: Any]) -> String in
      await RichPrintDomain.run(payload)
    }

    Function("databaseBytes") { () -> Double in
      Double(sqliteDatabaseBytes())
    }

    Function("prepareNoteHeroTransition") { (noteID: String) in
      if Thread.isMainThread {
        YohakuSharedNoteHeroCoordinator.shared.prepareTransition(noteID: noteID)
      } else {
        DispatchQueue.main.sync {
          YohakuSharedNoteHeroCoordinator.shared.prepareTransition(noteID: noteID)
        }
      }
    }

    Function("secretGet") { (key: String) -> String? in
      try SecretStore.get(key)
    }

    Function("secretSet") { (key: String, value: String) in
      try SecretStore.set(key, value)
    }

    Function("secretDelete") { (key: String) in
      SecretStore.delete(key)
    }

    Function("showToast") { (message: String) in
      if Thread.isMainThread {
        YohakuToastOverlay.shared.show(message: message)
      } else {
        DispatchQueue.main.sync {
          YohakuToastOverlay.shared.show(message: message)
        }
      }
    }

    AsyncFunction("downloadSystemFont") { (postScriptName: String) -> Bool in
      await SystemFontDomain.ensureInstalled(postScriptName: postScriptName)
    }

    AsyncFunction("loadTts") { (payload: TtsLoadPayload) in
      self.tts.load(payload: payload)
    }.runOnQueue(.main)

    AsyncFunction("playTts") {
      self.tts.play()
    }.runOnQueue(.main)

    AsyncFunction("pauseTts") {
      self.tts.pause()
    }.runOnQueue(.main)

    AsyncFunction("stopTts") {
      self.tts.stop()
    }.runOnQueue(.main)

    AsyncFunction("setTtsRate") { (rate: Double) in
      self.tts.setRate(rate)
    }.runOnQueue(.main)

    AsyncFunction("preloadTts") { (url: String) in
      self.tts.preload(urlString: url)
    }.runOnQueue(.main)

    View(ScrollEdgeContainerView.self) {
      Prop("edge") { (view: ScrollEdgeContainerView, edge: String) in
        view.setEdgeName(edge)
      }
    }

    View(VariableBlurEdgeView.self) {
      ViewName("VariableBlurEdge")

      Prop("progress") { (view: VariableBlurEdgeView, progress: Double) in
        view.setProgress(progress)
      }

      Prop("readabilityColor") { (view: VariableBlurEdgeView, color: UIColor?) in
        view.setReadabilityColor(color)
      }

      Prop("navigationForegroundColor") { (view: VariableBlurEdgeView, color: UIColor?) in
        view.setNavigationForegroundColor(color)
      }
    }

    View(LegacyScrollEdgeMaskView.self) {
      ViewName("LegacyScrollEdgeMask")

      Prop("bottomEdgeHeight") { (view: LegacyScrollEdgeMaskView, height: Double) in
        view.setBottomEdgeHeight(height)
      }

      Prop("bottomProgress") { (view: LegacyScrollEdgeMaskView, progress: Double) in
        view.setBottomProgress(progress)
      }

      Prop("topEdgeHeight") { (view: LegacyScrollEdgeMaskView, height: Double) in
        view.setTopEdgeHeight(height)
      }

      Prop("topProgress") { (view: LegacyScrollEdgeMaskView, progress: Double) in
        view.setTopProgress(progress)
      }
    }

    View(NavigationHeaderTitleView.self) {
      ViewName("NavigationHeaderTitle")

      Prop("scrollVelocity") { (view: NavigationHeaderTitleView, velocity: Double) in
        view.setScrollVelocity(velocity)
      }

      Prop("titleVisible") { (view: NavigationHeaderTitleView, visible: Double) in
        view.setTitleVisible(visible > 0.5)
      }

      Prop("title") { (view: NavigationHeaderTitleView, title: String) in
        view.setTitle(title)
      }

      Prop("subtitle") { (view: NavigationHeaderTitleView, subtitle: String) in
        view.setSubtitle(subtitle)
      }

      Prop("titleColor") { (view: NavigationHeaderTitleView, color: UIColor?) in
        view.setTitleColor(color)
      }

      Prop("subtitleColor") { (view: NavigationHeaderTitleView, color: UIColor?) in
        view.setSubtitleColor(color)
      }

      Prop("titleFontSize") { (view: NavigationHeaderTitleView, size: Double) in
        view.setTitleFontSize(size)
      }

      Prop("titleFontWeight") { (view: NavigationHeaderTitleView, name: String) in
        view.setTitleFontWeight(name)
      }

      Prop("subtitleFontSize") { (view: NavigationHeaderTitleView, size: Double) in
        view.setSubtitleFontSize(size)
      }
    }

    View(SettingsAvatarView.self) {
      ViewName("SettingsAvatar")

      Prop("active") { (view: SettingsAvatarView, value: Bool) in
        view.setActive(value)
      }

      Prop("collapseDistance") { (view: SettingsAvatarView, value: Double) in
        view.setCollapseDistance(value)
      }

      Prop("imageUri") { (view: SettingsAvatarView, value: String) in
        view.setImageUri(value)
      }

      Prop("ringColor") { (view: SettingsAvatarView, color: UIColor?) in
        view.setRingColor(color)
      }
    }

    View(YohakuPagerView.self) {
      ViewName("YohakuPager")

      Events("onPageScroll", "onPageSelected")

      Prop("page") { (view: YohakuPagerView, value: Double) in
        view.setPage(value)
      }
    }

    View(YohakuVideoView.self) {
      ViewName("YohakuVideo")

      Events("onNaturalSize")

      Prop("src") { (view: YohakuVideoView, value: String) in
        view.setSrc(value)
      }

      Prop("backdropColor") { (view: YohakuVideoView, color: UIColor?) in
        view.setBackdropColor(color)
      }

      Prop("poster") { (view: YohakuVideoView, value: String?) in
        view.setPoster(value)
      }

      Prop("loop") { (view: YohakuVideoView, value: Bool?) in
        view.setLoop(value ?? false)
      }
    }

    View(YohakuTrackMapView.self) {
      ViewName("YohakuTrackMap")

      Events("onNativePress")

      Prop("polylines") { (view: YohakuTrackMapView, value: [[[Double]]]) in
        view.setPolylines(value)
      }

      Prop("accentColor") { (view: YohakuTrackMapView, color: UIColor?) in
        view.setAccentColor(color)
      }

      Prop("paperColor") { (view: YohakuTrackMapView, color: UIColor?) in
        view.setPaperColor(color)
      }

      Prop("interactive") { (view: YohakuTrackMapView, value: Bool) in
        view.setInteractive(value)
      }
    }

    View(YohakuWebEmbedView.self) {
      ViewName("YohakuWebEmbed")
      Events("onContentHeight", "onEmbedError", "onEmbedLink")

      Prop("url") { (view: YohakuWebEmbedView, value: String) in
        view.url = value
      }

      Prop("props") { (view: YohakuWebEmbedView, value: [String: Any]) in
        view.props = value
      }

      Prop("theme") { (view: YohakuWebEmbedView, value: String) in
        view.theme = value
      }

      Prop("initialHeight") { (view: YohakuWebEmbedView, value: Double) in
        view.initialHeight = value
      }

      Prop("baseUrl") { (view: YohakuWebEmbedView, value: String) in
        view.baseUrl = value
      }

      OnViewDidUpdateProps { view in
        view.update()
      }
    }

    View(YohakuMathView.self) {
      ViewName("YohakuMath")
      Events("onContentSize", "onMathError")

      Prop("latex") { (view: YohakuMathView, value: String) in
        view.latex = value
      }

      Prop("fontSize") { (view: YohakuMathView, value: Double) in
        view.fontSize = CGFloat(value)
      }

      Prop("color") { (view: YohakuMathView, value: UIColor?) in
        view.color = value ?? .label
      }

      OnViewDidUpdateProps { view in
        view.update()
      }
    }

    View(YohakuKlineView.self) {
      ViewName("YohakuKline")

      Prop("bars") { (view: YohakuKlineView, value: [KlineBar]) in
        view.setBars(value)
      }

      Prop("ema") { (view: YohakuKlineView, value: [KlineEma]) in
        view.setEma(value)
      }

      Prop("upColor") { (view: YohakuKlineView, color: UIColor?) in
        view.setUpColor(color)
      }

      Prop("downColor") { (view: YohakuKlineView, color: UIColor?) in
        view.setDownColor(color)
      }

      Prop("gridColor") { (view: YohakuKlineView, color: UIColor?) in
        view.setGridColor(color)
      }

      Prop("labelColor") { (view: YohakuKlineView, color: UIColor?) in
        view.setLabelColor(color)
      }

      Prop("volumeColor") { (view: YohakuKlineView, color: UIColor?) in
        view.setVolumeColor(color)
      }
    }

    View(YohakuStudyShellView.self) {
      ViewName("YohakuStudyShell")

      Events("onPageScroll", "onPageSelected")

      Prop("page") { (view: YohakuStudyShellView, value: Double) in
        view.setPage(value)
      }

      Prop("ownerImageUri") { (view: YohakuStudyShellView, value: String) in
        view.setOwnerImageUri(value)
      }

      Prop("accountImageUri") { (view: YohakuStudyShellView, value: String) in
        view.setAccountImageUri(value)
      }

      Prop("ringColor") { (view: YohakuStudyShellView, color: UIColor?) in
        view.setRingColor(color)
      }

      Prop("collapseDistance") { (view: YohakuStudyShellView, value: Double) in
        view.setCollapseDistance(value)
      }
    }

    View(NavigationHeaderControlView.self) {
      ViewName("NavigationHeaderControl")

      Events("onMenuAction", "onNativePress")

      Prop("controlIdentifier") { (view: NavigationHeaderControlView, identifier: String) in
        view.setAccessibilityIdentifier(identifier)
      }

      Prop("controlKind") { (view: NavigationHeaderControlView, kind: String) in
        view.setControlKind(kind)
      }

      Prop("controlLabel") { (view: NavigationHeaderControlView, label: String) in
        view.setControlLabel(label)
      }

      Prop("cornerRadius") { (view: NavigationHeaderControlView, radius: Double) in
        view.setCornerRadius(radius)
      }

      Prop("haptic") { (view: NavigationHeaderControlView, enabled: Bool) in
        view.setHapticEnabled(enabled)
      }

      Prop("iconColor") { (view: NavigationHeaderControlView, color: UIColor?) in
        view.setIconColor(color)
      }

      Prop("iconName") { (view: NavigationHeaderControlView, name: String) in
        view.setIconName(name)
      }

      Prop("menuItems") {
        (view: NavigationHeaderControlView, items: [NavigationHeaderMenuItemSpec]) in
        view.setMenuItems(items)
      }

      Prop("paperColor") { (view: NavigationHeaderControlView, color: UIColor?) in
        view.setPaperColor(color)
      }

      Prop("ringColor") { (view: NavigationHeaderControlView, color: UIColor?) in
        view.setRingColor(color)
      }

      Prop("shadowOpacity") { (view: NavigationHeaderControlView, opacity: Double) in
        view.setShadowOpacity(opacity)
      }
    }

    View(TextMenuButtonView.self) {
      ViewName("TextMenuButton")

      Events("onMenuAction")

      Prop("controlLabel") { (view: TextMenuButtonView, label: String) in
        view.setAccessibilityLabel(label)
      }

      Prop("disabled") { (view: TextMenuButtonView, disabled: Bool) in
        view.setDisabled(disabled)
      }

      Prop("menuItems") { (view: TextMenuButtonView, items: [NavigationHeaderMenuItemSpec]) in
        view.setMenuItems(items)
      }

      Prop("title") { (view: TextMenuButtonView, title: String) in
        view.setTitle(title)
      }

      Prop("titleColor") { (view: TextMenuButtonView, color: UIColor?) in
        view.setTitleColor(color)
      }

      Prop("titleSize") { (view: TextMenuButtonView, size: Double) in
        view.setTitleSize(size)
      }
    }

    View(RichTextView.self) {
      ViewName("RichText")

      Events("onMenuAction", "onLinkPress", "onHighlightPress", "onContentHeight", "onBlockRects", "onSelectionActive")

      Prop("blocks") { (view: RichTextView, blocks: [[String: Any]]) in
        view.setBlocks(blocks)
      }

      Prop("highlights") { (view: RichTextView, highlights: [[String: Any]]) in
        view.setHighlights(highlights)
      }

      Prop("menuItems") { (view: RichTextView, items: [[String: Any]]) in
        view.setMenuItems(items)
      }

      Prop("typography") { (view: RichTextView, typography: [String: Any]) in
        view.setTypography(typography)
      }
    }

    View(GroupedListView.self) {
      ViewName("GroupedList")

      Events("onRowPress", "onRowMenuAction", "onNativeMetrics")

      Prop("rows") { (view: GroupedListView, rows: [GroupedListRowSpec]) in
        view.setRows(rows)
      }

      Prop("dangerColor") { (view: GroupedListView, hex: String) in
        view.setDangerColor(hex)
      }
    }

    View(YohakuScrollAttachmentView.self) {
      ViewName("YohakuScrollAttachment")
    }

    View(YohakuNoteHeroHostView.self) {
      ViewName("YohakuNoteHeroHost")

      Prop("nativeTopBlurHeight") { (view: YohakuNoteHeroHostView, value: Double) in
        view.setNativeTopBlurHeight(value)
      }
      Prop("nativeTopBlurReadabilityColor") { (view: YohakuNoteHeroHostView, value: UIColor?) in
        view.setNativeTopBlurReadabilityColor(value)
      }
      Prop("nativeTopBlurForegroundColor") { (view: YohakuNoteHeroHostView, value: UIColor?) in
        view.setNativeTopBlurForegroundColor(value)
      }

      Prop("noteHeroRole") { (view: YohakuNoteHeroHostView, value: String) in
        view.setNoteHeroRole(value)
      }

      Prop("noteHeroContentInsetTop") { (view: YohakuNoteHeroHostView, value: Double) in
        view.setNoteHeroContentInsetTop(value)
      }

      Prop("noteHeroCoverPlaceholderUri") { (view: YohakuNoteHeroHostView, value: String?) in
        view.setNoteHeroCoverPlaceholderUri(value)
      }

      Prop("noteHeroCoverUri") { (view: YohakuNoteHeroHostView, value: String?) in
        view.setNoteHeroCoverUri(value)
      }

      Prop("noteHeroHeight") { (view: YohakuNoteHeroHostView, value: Double) in
        view.setNoteHeroHeight(value)
      }

      Prop("noteHeroId") { (view: YohakuNoteHeroHostView, value: String?) in
        view.setNoteHeroID(value)
      }

      Prop("noteHeroMeta") { (view: YohakuNoteHeroHostView, value: String?) in
        view.setNoteHeroMeta(value)
      }

      Prop("noteHeroMetaColor") { (view: YohakuNoteHeroHostView, value: UIColor?) in
        view.setNoteHeroMetaColor(value)
      }

      Prop("noteHeroTitle") { (view: YohakuNoteHeroHostView, value: String?) in
        view.setNoteHeroTitle(value)
      }

      Prop("noteHeroTitleColor") { (view: YohakuNoteHeroHostView, value: UIColor?) in
        view.setNoteHeroTitleColor(value)
      }
    }

    View(YohakuStretchCoverHostView.self) {
      ViewName("YohakuStretchCoverHost")

      Prop("stretchCoverAnchorY") { (view: YohakuStretchCoverHostView, value: Double) in
        view.setStretchCoverAnchorY(value)
      }

      Prop("stretchCoverHeight") { (view: YohakuStretchCoverHostView, value: Double) in
        view.setStretchCoverHeight(value)
      }

      Prop("stretchCoverPlaceholderUri") { (view: YohakuStretchCoverHostView, value: String?) in
        view.setStretchCoverPlaceholderUri(value)
      }

      Prop("stretchCoverUri") { (view: YohakuStretchCoverHostView, value: String?) in
        view.setStretchCoverUri(value)
      }
    }

    View(NativePressView.self) {
      ViewName("NativePress")

      Events("onNativePress", "onNativeLongPress")

      Prop("disabled") { (view: NativePressView, disabled: Bool) in
        view.setDisabled(disabled)
      }

      Prop("haptic") { (view: NativePressView, enabled: Bool) in
        view.setHapticEnabled(enabled)
      }

      Prop("longPressEnabled") { (view: NativePressView, enabled: Bool) in
        view.setLongPressEnabled(enabled)
      }

      Prop("pressScale") { (view: NativePressView, scale: Double) in
        view.setPressScale(scale)
      }

      Prop("pressTranslateY") { (view: NativePressView, translateY: Double) in
        view.setPressTranslateY(translateY)
      }
    }

    View(TicketStubView.self) {
      ViewName("TicketStub")

      Prop("cornerRadius") { (view: TicketStubView, radius: Double) in
        view.setCornerRadius(radius)
      }

      Prop("divisions") { (view: TicketStubView, count: Double) in
        view.setDivisions(Int(count.rounded()))
      }

      Prop("fillColor") { (view: TicketStubView, color: UIColor?) in
        view.setFillColor(color)
      }

      Prop("notchRadius") { (view: TicketStubView, radius: Double) in
        view.setNotchRadius(radius)
      }

      Prop("shadowColor") { (view: TicketStubView, color: UIColor?) in
        view.setShadowColor(color)
      }

      Prop("shadowOffsetY") { (view: TicketStubView, offset: Double) in
        view.setShadowOffsetY(offset)
      }

      Prop("shadowOpacity") { (view: TicketStubView, opacity: Double) in
        view.setShadowOpacity(opacity)
      }

      Prop("shadowRadius") { (view: TicketStubView, radius: Double) in
        view.setShadowRadius(radius)
      }
    }
  }
}

private func sqliteDatabaseBytes() -> Int64 {
  let fileManager = FileManager.default
  let roots = [
    fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first,
    fileManager.urls(for: .documentDirectory, in: .userDomainMask).first,
    fileManager.urls(for: .libraryDirectory, in: .userDomainMask).first,
  ].compactMap { $0 }
  let suffixes = [
    "SQLite/yohaku.db",
    "LocalDatabase/yohaku.db",
    "yohaku.db",
  ]
  for root in roots {
    for suffix in suffixes {
      let url = root.appendingPathComponent(suffix)
      if let size = try? fileManager.attributesOfItem(atPath: url.path)[.size] as? NSNumber {
        return size.int64Value
      }
    }
  }
  return 0
}
