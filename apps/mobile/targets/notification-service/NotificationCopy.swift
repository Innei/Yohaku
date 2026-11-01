import Foundation

struct NotificationCopy: Equatable {
  var title: String?
  var subtitle: String
  var body: String
}

enum NotificationCopyBuilder {
  static let imageSentinel = "\u{E000}"
  static let codeSentinel = "\u{E001}"

  static func reply(
    userInfo: [AnyHashable: Any],
    localize: (String) -> String
  ) -> NotificationCopy? {
    guard
      let targetTitle = nonEmpty(userInfo["target_title"]),
      let excerpt = nonEmpty(userInfo["reply_excerpt"]),
      let subtitle = format(localize, "PUSH_REPLY_SUBTITLE", targetTitle),
      let imageToken = localized(localize, "PUSH_TOKEN_IMAGE"),
      let codeToken = localized(localize, "PUSH_TOKEN_CODE")
    else {
      return nil
    }
    let body =
      excerpt
      .replacingOccurrences(of: imageSentinel, with: imageToken)
      .replacingOccurrences(of: codeSentinel, with: codeToken)
    return NotificationCopy(
      title: nonEmpty(userInfo["sender_name"]),
      subtitle: subtitle,
      body: body
    )
  }

  static func content(
    userInfo: [AnyHashable: Any],
    localize: (String) -> String
  ) -> NotificationCopy? {
    let titleKey: String
    switch userInfo["resource_type"] as? String {
    case "post": titleKey = "PUSH_POST_PUBLISHED_TITLE"
    case "note": titleKey = "PUSH_NOTE_PUBLISHED_TITLE"
    default: return nil
    }
    guard
      let ownerName = nonEmpty(userInfo["owner_name"]),
      let displayTitle = alertTitleArgument(userInfo),
      let title = format(localize, titleKey, ownerName)
    else {
      return nil
    }
    let body =
      titleKey == "PUSH_NOTE_PUBLISHED_TITLE"
      ? [userInfo["weather"], userInfo["mood"]].compactMap(nonEmpty).joined(separator: " · ")
      : ""
    return NotificationCopy(title: title, subtitle: displayTitle, body: body)
  }

  static func attachmentExtension(mimeType: String?, url: URL) -> String? {
    switch mimeType?.lowercased() {
    case "image/png": return "png"
    case "image/jpeg", "image/jpg": return "jpg"
    case "image/gif": return "gif"
    case nil:
      let pathExtension = url.pathExtension.lowercased()
      if pathExtension == "jpeg" { return "jpg" }
      return ["png", "jpg", "gif"].contains(pathExtension) ? pathExtension : nil
    default: return nil
    }
  }

  private static func alertTitleArgument(_ userInfo: [AnyHashable: Any]) -> String? {
    guard
      let aps = userInfo["aps"] as? [AnyHashable: Any],
      let alert = aps["alert"] as? [AnyHashable: Any],
      let args = alert["title-loc-args"] as? [Any]
    else {
      return nil
    }
    return args.first.flatMap(nonEmpty)
  }

  private static func nonEmpty(_ value: Any?) -> String? {
    guard let string = value as? String else { return nil }
    let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }

  private static func localized(_ localize: (String) -> String, _ key: String) -> String? {
    let value = localize(key)
    return value == key ? nil : value
  }

  private static func format(
    _ localize: (String) -> String,
    _ key: String,
    _ argument: String
  ) -> String? {
    guard let template = localized(localize, key) else { return nil }
    return template.replacingOccurrences(of: "%@", with: argument)
  }
}
