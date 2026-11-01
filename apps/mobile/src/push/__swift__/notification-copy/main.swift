import Foundation

let strings = [
  "PUSH_REPLY_SUBTITLE": "回复了你 · 《%@》",
  "PUSH_POST_PUBLISHED_TITLE": "%@ 发布了新文章",
  "PUSH_NOTE_PUBLISHED_TITLE": "%@ 发布了新手记",
  "PUSH_TOKEN_IMAGE": "[图片]",
  "PUSH_TOKEN_CODE": "[代码]",
]
let localize: (String) -> String = { strings[$0] ?? $0 }
let unlocalized: (String) -> String = { $0 }

func encode(_ copy: NotificationCopy?) -> Any {
  guard let copy else { return NSNull() }
  return [
    "title": copy.title as Any? ?? NSNull(),
    "subtitle": copy.subtitle,
    "body": copy.body,
  ]
}

func content(_ type: String, _ extra: [String: Any]) -> [AnyHashable: Any] {
  var info: [AnyHashable: Any] = [
    "aps": ["alert": ["title-loc-key": "PUSH_CONTENT_TITLE", "title-loc-args": ["十月未央"]]],
    "resource_type": type,
  ]
  for (key, value) in extra { info[key] = value }
  return info
}

let reply: [AnyHashable: Any] = [
  "sender_name": "Innei",
  "target_title": "十月未央",
  "reply_excerpt": "暂时还不行 \u{E000} 看 \u{E001}",
]

let results: [String: Any] = [
  "reply": encode(NotificationCopyBuilder.reply(userInfo: reply, localize: localize)),
  "replyWithoutExcerpt": encode(
    NotificationCopyBuilder.reply(userInfo: ["target_title": "十月未央"], localize: localize)
  ),
  "replyWithoutLocalization": encode(
    NotificationCopyBuilder.reply(userInfo: reply, localize: unlocalized)
  ),
  "post": encode(
    NotificationCopyBuilder.content(
      userInfo: content("post", ["owner_name": "Innei", "weather": "晴"]), localize: localize)
  ),
  "note": encode(
    NotificationCopyBuilder.content(
      userInfo: content("note", ["owner_name": "Innei", "weather": "秋", "mood": "五味杂陈"]),
      localize: localize)
  ),
  "noteMoodOnly": encode(
    NotificationCopyBuilder.content(
      userInfo: content("note", ["owner_name": "Innei", "mood": "五味杂陈"]), localize: localize)
  ),
  "postWithoutOwner": encode(
    NotificationCopyBuilder.content(userInfo: content("post", [:]), localize: localize)
  ),
  "recently": encode(
    NotificationCopyBuilder.content(
      userInfo: content("recently", ["owner_name": "Innei"]), localize: localize)
  ),
  "postWithoutLocalization": encode(
    NotificationCopyBuilder.content(
      userInfo: content("post", ["owner_name": "Innei"]), localize: unlocalized)
  ),
  "coverPng": NotificationCopyBuilder.attachmentExtension(
    mimeType: "image/png", url: URL(string: "https://a.b/c")!) as Any? ?? NSNull(),
  "coverJpeg": NotificationCopyBuilder.attachmentExtension(
    mimeType: "image/jpeg", url: URL(string: "https://a.b/c.png")!) as Any? ?? NSNull(),
  "coverFromPath": NotificationCopyBuilder.attachmentExtension(
    mimeType: nil, url: URL(string: "https://a.b/c.GIF")!) as Any? ?? NSNull(),
  "coverUnsupported": NotificationCopyBuilder.attachmentExtension(
    mimeType: "image/webp", url: URL(string: "https://a.b/c.webp")!) as Any? ?? NSNull(),
]

let data = try JSONSerialization.data(withJSONObject: results, options: [.sortedKeys])
print(String(decoding: data, as: UTF8.self))
