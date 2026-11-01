import Foundation
import Intents
import UserNotifications

private final class RemoteImageLoader: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
  private let maximumBytes: Int
  private var completion: ((Data?, String?) -> Void)?
  private var received = Data()
  private var mimeType: String?
  private var session: URLSession?

  init(maximumBytes: Int) {
    self.maximumBytes = maximumBytes
  }

  func load(_ url: URL, completion: @escaping (Data?, String?) -> Void) {
    self.completion = completion
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = 5
    configuration.timeoutIntervalForResource = 8
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    let session = URLSession(
      configuration: configuration,
      delegate: self,
      delegateQueue: nil
    )
    self.session = session
    session.dataTask(with: url).resume()
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard
      let response = response as? HTTPURLResponse,
      (200...299).contains(response.statusCode),
      response.mimeType?.hasPrefix("image/") == true,
      response.expectedContentLength <= Int64(maximumBytes)
    else {
      completionHandler(.cancel)
      finish(nil)
      return
    }
    mimeType = response.mimeType
    completionHandler(.allow)
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive data: Data
  ) {
    guard received.count + data.count <= maximumBytes else {
      dataTask.cancel()
      finish(nil)
      return
    }
    received.append(data)
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    completionHandler(nil)
    finish(nil)
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didCompleteWithError error: Error?
  ) {
    finish(error == nil && !received.isEmpty ? received : nil)
  }

  private func finish(_ data: Data?) {
    guard let completion else { return }
    self.completion = nil
    session?.invalidateAndCancel()
    session = nil
    completion(data, data == nil ? nil : mimeType)
  }
}

final class NotificationService: UNNotificationServiceExtension {
  private static let avatarMaximumBytes = 1_500_000
  private static let coverMaximumBytes = 5_000_000

  // Extensions do not ship the notification string catalog; it lives in the containing app bundle.
  private static let appBundle: Bundle = {
    let appURL = Bundle.main.bundleURL
      .deletingLastPathComponent()
      .deletingLastPathComponent()
    return Bundle(url: appURL) ?? Bundle.main
  }()

  private static let currentReader = INPerson(
    personHandle: INPersonHandle(value: "me", type: .unknown),
    nameComponents: nil,
    displayName: nil,
    image: nil,
    contactIdentifier: nil,
    customIdentifier: nil,
    isMe: true,
    suggestionType: .none
  )

  private let completionLock = NSLock()
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?
  private var imageLoader: RemoteImageLoader?
  private var didFinish = false

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

    guard let content = bestAttemptContent else {
      finish(with: request.content)
      return
    }

    switch request.content.categoryIdentifier {
    case "YOHAKU_COMMENT_REPLIED":
      handleReply(content)
    case "YOHAKU_CONTENT":
      handleContent(content)
    default:
      finish(with: request.content)
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let bestAttemptContent {
      finish(with: bestAttemptContent)
    }
  }

  private static func localize(_ key: String) -> String {
    appBundle.localizedString(forKey: key, value: key, table: nil)
  }

  private func handleReply(_ content: UNMutableNotificationContent) {
    guard
      let senderID = content.userInfo["sender_id"] as? String,
      let senderName = content.userInfo["sender_name"] as? String,
      let targetPath = content.userInfo["target_path"] as? String
    else {
      finish(with: content)
      return
    }

    if let copy = NotificationCopyBuilder.reply(
      userInfo: content.userInfo,
      localize: Self.localize
    ) {
      if let title = copy.title {
        content.title = title
      }
      content.subtitle = copy.subtitle
      content.body = copy.body
    }

    guard
      let rawAvatarURL = content.userInfo["sender_avatar_url"] as? String,
      let avatarURL = URL(string: rawAvatarURL),
      isSafeRemoteImageURL(avatarURL)
    else {
      donateIntent(
        content: content,
        senderID: senderID,
        senderName: senderName,
        targetPath: targetPath,
        imageData: nil
      )
      return
    }

    let loader = RemoteImageLoader(maximumBytes: Self.avatarMaximumBytes)
    imageLoader = loader
    loader.load(avatarURL) { [weak self] imageData, _ in
      guard let self else { return }
      self.donateIntent(
        content: content,
        senderID: senderID,
        senderName: senderName,
        targetPath: targetPath,
        imageData: imageData
      )
    }
  }

  private func handleContent(_ content: UNMutableNotificationContent) {
    if let copy = NotificationCopyBuilder.content(
      userInfo: content.userInfo,
      localize: Self.localize
    ) {
      if let title = copy.title {
        content.title = title
      }
      content.subtitle = copy.subtitle
      content.body = copy.body
    }

    guard
      let rawCoverURL = content.userInfo["cover_url"] as? String,
      let coverURL = URL(string: rawCoverURL),
      isSafeRemoteImageURL(coverURL)
    else {
      finish(with: content)
      return
    }

    let loader = RemoteImageLoader(maximumBytes: Self.coverMaximumBytes)
    imageLoader = loader
    loader.load(coverURL) { [weak self] imageData, mimeType in
      guard let self else { return }
      if let imageData,
        let attachment = self.coverAttachment(
          data: imageData,
          mimeType: mimeType,
          url: coverURL
        )
      {
        content.attachments = [attachment]
      }
      self.finish(with: content)
    }
  }

  private func coverAttachment(data: Data, mimeType: String?, url: URL) -> UNNotificationAttachment? {
    guard
      let pathExtension = NotificationCopyBuilder.attachmentExtension(
        mimeType: mimeType,
        url: url
      )
    else {
      return nil
    }
    let fileURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(pathExtension)
    do {
      try data.write(to: fileURL)
      return try UNNotificationAttachment(identifier: "cover", url: fileURL)
    } catch {
      try? FileManager.default.removeItem(at: fileURL)
      return nil
    }
  }

  private func donateIntent(
    content: UNMutableNotificationContent,
    senderID: String,
    senderName: String,
    targetPath: String,
    imageData: Data?
  ) {
    let handle = INPersonHandle(value: senderID, type: .unknown)
    let sender = INPerson(
      personHandle: handle,
      nameComponents: nil,
      displayName: senderName,
      image: imageData.map(INImage.init(imageData:)),
      contactIdentifier: nil,
      customIdentifier: senderID,
      isMe: false,
      suggestionType: .none
    )
    let conversationName = (content.userInfo["target_title"] as? String)
      .flatMap { $0.isEmpty ? nil : INSpeakableString(spokenPhrase: $0) }
    // iOS only renders speakableGroupName for conversations with more than one recipient.
    let recipients = conversationName.map { _ in [Self.currentReader, sender] }
    let intent = INSendMessageIntent(
      recipients: recipients,
      outgoingMessageType: .outgoingMessageText,
      content: content.body,
      speakableGroupName: conversationName,
      conversationIdentifier: targetPath,
      serviceName: "Yohaku",
      sender: sender,
      attachments: nil
    )
    let interaction = INInteraction(intent: intent, response: nil)
    interaction.direction = .incoming
    interaction.donate { [weak self] error in
      guard let self else { return }
      guard error == nil else {
        self.finish(with: content)
        return
      }
      do {
        self.finish(with: try content.updating(from: intent))
      } catch {
        self.finish(with: content)
      }
    }
  }

  private func finish(with content: UNNotificationContent) {
    completionLock.lock()
    defer { completionLock.unlock() }
    guard !didFinish, let contentHandler else { return }
    didFinish = true
    self.contentHandler = nil
    imageLoader = nil
    contentHandler(content)
  }

  private func isSafeRemoteImageURL(_ url: URL) -> Bool {
    guard
      url.scheme == "https",
      url.user == nil,
      url.password == nil,
      url.port == nil || url.port == 443,
      let host = url.host?.lowercased(),
      host != "localhost",
      !host.hasSuffix(".local"),
      !host.hasSuffix(".localhost")
    else {
      return false
    }

    let blockedIPv4Prefixes = [
      "0.", "10.", "127.", "169.254.", "192.168.",
    ]
    if blockedIPv4Prefixes.contains(where: host.hasPrefix) {
      return false
    }
    if host.hasPrefix("172."),
      let second = Int(host.split(separator: ".").dropFirst().first ?? ""),
      (16...31).contains(second)
    {
      return false
    }
    return host != "::1" && host != "[::1]"
  }
}
