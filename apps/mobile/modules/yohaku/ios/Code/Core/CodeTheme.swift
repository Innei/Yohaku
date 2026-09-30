import Foundation

struct CodeStyle: Equatable {
  var color: UInt32?
  var bold = false
  var italic = false
}

// Yohaku ink: design-system accent/info/success/warning/error hues on paper;
// captures left unmapped fall back to the view's neutral text color.
enum CodeTheme {
  private typealias Pair = (light: UInt32, dark: UInt32)

  private static let keyword: Pair = (0xA8505F, 0xD98A98)
  private static let type: Pair = (0x3D6896, 0x7090B3)
  private static let string: Pair = (0x4D8468, 0x8CBEA3)
  private static let constant: Pair = (0xA87A3D, 0xC8A06B)
  private static let deleted: Pair = (0xA64953, 0xC8767F)
  private static let comment: Pair = (0xA8A69F, 0x787878)

  private static let colors: [String: Pair] = [
    "keyword": keyword, "storage": keyword, "repeat": keyword, "conditional": keyword,
    "include": keyword, "import": keyword, "preproc": keyword, "charset": keyword,
    "media": keyword, "keyframes": keyword, "supports": keyword, "tag": keyword,
    "markup.heading": keyword, "text.title": keyword,
    "type": type, "constructor": type, "module": type, "namespace": type, "diff.delta": type,
    "string": string, "character": string, "text.uri": string, "markup.raw": string,
    "text.literal": string, "diff.plus": string,
    "number": constant, "boolean": constant, "constant": constant, "escape": constant,
    "string.escape": constant, "attribute": constant, "tag.attribute": constant,
    "diff.minus": deleted,
  ]

  private static let emphasis: [String: CodeStyle] = [
    "markup.strong": CodeStyle(bold: true), "text.strong": CodeStyle(bold: true),
    "markup.italic": CodeStyle(italic: true), "text.emphasis": CodeStyle(italic: true),
  ]

  static func style(for capture: String, dark: Bool) -> CodeStyle? {
    var name = Substring(capture)
    while true {
      if let style = emphasis[String(name)] { return style }
      if name == "comment" { return CodeStyle(color: dark ? comment.dark : comment.light, italic: true) }
      if let pair = colors[String(name)] { return CodeStyle(color: dark ? pair.dark : pair.light) }
      guard let dot = name.lastIndex(of: ".") else { return nil }
      name = name[..<dot]
    }
  }
}
