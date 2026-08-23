import ExpoModulesCore
import Foundation

private func simulatedLoginEnabled() -> Bool {
  #if DEBUG
    #if targetEnvironment(simulator)
      let processInfo = ProcessInfo.processInfo
      return processInfo.arguments.contains("-YohakuSimulateLogin")
        || processInfo.environment["YOHAKU_SIMULATE_LOGIN"] == "1"
    #else
      return false
    #endif
  #else
    return false
  #endif
}

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
      "liquidGlassAvailable": TabBarDomain.liquidGlassAvailable,
      "simulatedLoginEnabled": simulatedLoginEnabled(),
    ])

    OnCreate {
      self.tts.emit = { [weak self] name, body in
        self?.sendEvent(name, body)
      }
      TabBarDomain.onMeTabLongPress = { [weak self] in
        self?.sendEvent("onMeTabLongPress", [:])
      }
    }

    AsyncFunction("configureCompactNativeTabBar") {
      TabBarDomain.configureCompactNativeTabBar()
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

    Function("databaseBytes") { () -> Double in
      Double(sqliteDatabaseBytes())
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

      Prop("label") { (view: SettingsAvatarView, label: String) in
        view.setAccessibilityLabel(label)
      }

      Prop("imageUrl") { (view: SettingsAvatarView, imageUrl: String) in
        view.setImageUrl(imageUrl)
      }

      Prop("peerId") { (view: SettingsAvatarView, peerId: String) in
        view.setPeerId(peerId)
      }

      Prop("peerName") { (view: SettingsAvatarView, peerName: String) in
        view.setPeerName(peerName)
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

      Prop("menuItems") { (view: NavigationHeaderControlView, items: [NavigationHeaderMenuItemSpec]) in
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

    View(GroupedListView.self) {
      ViewName("GroupedList")

      Events("onRowPress", "onNativeHeight")

      Prop("rows") { (view: GroupedListView, rows: [GroupedListRowSpec]) in
        view.setRows(rows)
      }

      Prop("dangerColor") { (view: GroupedListView, hex: String) in
        view.setDangerColor(hex)
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
