import Foundation
import QuickLook
import UIKit
import WebKit

enum DomFilePreviewDomain {
  static let previewMessageType = "yohaku:file-preview"

  private static var session: DomFilePreviewSession?

  private struct Message: Decodable {
    let type: String
    let url: String?
    let name: String?
    let mimeType: String?
    let siteReferer: String?
  }

  static func handle(messageBody: Any, from webView: WKWebView) -> Bool {
    dispatchPrecondition(condition: .onQueue(.main))
    guard
      let body = messageBody as? String,
      body.contains(previewMessageType),
      let data = body.data(using: .utf8),
      let message = try? JSONDecoder().decode(Message.self, from: data),
      message.type == previewMessageType,
      let url = message.url,
      !url.isEmpty
    else {
      return false
    }

    present(
      url: url,
      name: message.name ?? URL(string: url)?.lastPathComponent ?? "file",
      mimeType: message.mimeType,
      siteReferer: message.siteReferer ?? (webView as? DomWKWebView)?.siteReferer
    )
    return true
  }

  static func present(
    url: String,
    name: String,
    mimeType: String?,
    siteReferer: String?
  ) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard session == nil else { return }
    let next = DomFilePreviewSession(
      url: url,
      name: name,
      mimeType: mimeType,
      siteReferer: siteReferer
    ) {
      session = nil
    }
    session = next
    next.start()
  }
}

private final class DomFilePreviewSession: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private let url: String
  private let name: String
  private let mimeType: String?
  private let siteReferer: String?
  private let onFinish: () -> Void
  private var localURL: URL?
  private var directoryURL: URL?
  private var task: URLSessionDownloadTask?

  init(
    url: String,
    name: String,
    mimeType: String?,
    siteReferer: String?,
    onFinish: @escaping () -> Void
  ) {
    self.url = url
    self.name = name
    self.mimeType = mimeType
    self.siteReferer = siteReferer
    self.onFinish = onFinish
  }

  func start() {
    guard
      let remote = URL(string: url),
      remote.scheme?.lowercased() == "https"
    else {
      finish()
      return
    }

    var request = URLRequest(url: remote)
    if let referer = SiteReferer.normalized(siteReferer) {
      request.setValue(referer, forHTTPHeaderField: "Referer")
    }

    task = URLSession.shared.downloadTask(with: request) { [weak self] temp, _, error in
      let persisted = temp.flatMap { self?.persistDownload($0, remote: remote) }
      DispatchQueue.main.async {
        self?.finishDownload(localURL: persisted, error: error, remote: remote)
      }
    }
    task?.resume()
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    localURL == nil ? 0 : 1
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    (localURL ?? URL(fileURLWithPath: "/dev/null")) as QLPreviewItem
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    finish()
  }

  private func persistDownload(_ tempURL: URL, remote: URL) -> URL? {
    let directory = FileManager.default.temporaryDirectory
      .appendingPathComponent("DomFilePreviews", isDirectory: true)
      .appendingPathComponent(UUID().uuidString, isDirectory: true)
    let destination = directory.appendingPathComponent(resolvedFileName(remote: remote))
    do {
      try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      if FileManager.default.fileExists(atPath: destination.path) {
        try FileManager.default.removeItem(at: destination)
      }
      try FileManager.default.moveItem(at: tempURL, to: destination)
      return destination
    } catch {
      try? FileManager.default.removeItem(at: directory)
      return nil
    }
  }

  private func finishDownload(localURL: URL?, error: Error?, remote: URL) {
    guard error == nil, let localURL else {
      openInSafari(remote)
      finish()
      return
    }
    directoryURL = localURL.deletingLastPathComponent()
    self.localURL = localURL
    presentPreview()
  }

  private func presentPreview() {
    guard
      let presenter = topViewController(),
      localURL != nil
    else {
      finish()
      return
    }
    let controller = QLPreviewController()
    controller.dataSource = self
    controller.delegate = self
    presenter.present(controller, animated: true)
  }

  private func resolvedFileName(remote: URL) -> String {
    let raw = name.trimmingCharacters(in: .whitespacesAndNewlines)
    let base = raw.isEmpty ? remote.lastPathComponent : raw
    let trimmed = (base as NSString).lastPathComponent
      .replacingOccurrences(of: ":", with: "_")
    if trimmed.isEmpty { return "file" }
    if (trimmed as NSString).pathExtension.isEmpty,
      let ext = remote.pathExtension.nonEmpty ?? mimeExtension()
    {
      return "\(trimmed).\(ext)"
    }
    return trimmed
  }

  private func mimeExtension() -> String? {
    switch mimeType?.lowercased() {
    case "application/pdf": return "pdf"
    case "application/msword": return "doc"
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx"
    case "application/vnd.ms-excel": return "xls"
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx"
    case "application/vnd.ms-powerpoint": return "ppt"
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx"
    case "application/rtf", "text/rtf": return "rtf"
    default: return nil
    }
  }

  private func openInSafari(_ remote: URL) {
    UIApplication.shared.open(remote)
  }

  private func topViewController() -> UIViewController? {
    guard let window = DomImagePreviewDomain.keyWindow() else { return nil }
    var current = window.rootViewController
    while let presented = current?.presentedViewController {
      current = presented
    }
    if let navigation = current as? UINavigationController {
      current = navigation.visibleViewController ?? navigation
    }
    if let tabs = current as? UITabBarController {
      current = tabs.selectedViewController ?? tabs
    }
    return current
  }

  private func finish() {
    task?.cancel()
    task = nil
    if let directoryURL {
      try? FileManager.default.removeItem(at: directoryURL)
    }
    directoryURL = nil
    localURL = nil
    onFinish()
  }
}

private extension String {
  var nonEmpty: String? {
    isEmpty ? nil : self
  }
}
