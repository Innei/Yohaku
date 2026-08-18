import Foundation
import Intents
import UserNotifications

private final class AvatarLoader: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
  private static let maximumBytes = 1_500_000

  private var completion: ((Data?) -> Void)?
  private var received = Data()
  private var session: URLSession?

  func load(_ url: URL, completion: @escaping (Data?) -> Void) {
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
      response.expectedContentLength <= Int64(Self.maximumBytes)
    else {
      completionHandler(.cancel)
      finish(nil)
      return
    }
    completionHandler(.allow)
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive data: Data
  ) {
    guard received.count + data.count <= Self.maximumBytes else {
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
    completion(data)
  }
}

final class NotificationService: UNNotificationServiceExtension {
  private let completionLock = NSLock()
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?
  private var avatarLoader: AvatarLoader?
  private var didFinish = false

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

    guard
      request.content.categoryIdentifier == "YOHAKU_COMMENT_REPLIED",
      let content = bestAttemptContent,
      let senderID = content.userInfo["sender_id"] as? String,
      let senderName = content.userInfo["sender_name"] as? String,
      let targetPath = content.userInfo["target_path"] as? String
    else {
      finish(with: request.content)
      return
    }

    guard
      let rawAvatarURL = content.userInfo["sender_avatar_url"] as? String,
      let avatarURL = URL(string: rawAvatarURL),
      isSafeAvatarURL(avatarURL)
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

    let loader = AvatarLoader()
    avatarLoader = loader
    loader.load(avatarURL) { [weak self] imageData in
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

  override func serviceExtensionTimeWillExpire() {
    if let bestAttemptContent {
      finish(with: bestAttemptContent)
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
    let intent = INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: content.body,
      speakableGroupName: nil,
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
    avatarLoader = nil
    contentHandler(content)
  }

  private func isSafeAvatarURL(_ url: URL) -> Bool {
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
