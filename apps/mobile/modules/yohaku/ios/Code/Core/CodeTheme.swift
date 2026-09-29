import Foundation

struct CodeStyle: Equatable {
  var color: UInt32?
  var bold = false
  var italic = false
}

// Colors are shiki's github-light / github-dark token colors (@shikijs/themes).
enum CodeTheme {
  private typealias Pair = (light: UInt32, dark: UInt32)

  private static let comment: Pair = (0x6A737D, 0x6A737D)
  private static let keyword: Pair = (0xD73A49, 0xF97583)
  private static let string: Pair = (0x032F62, 0x9ECBFF)
  private static let regexp: Pair = (0x032F62, 0xDBEDFF)
  private static let constant: Pair = (0x005CC5, 0x79B8FF)
  private static let entity: Pair = (0x6F42C1, 0xB392F0)
  private static let variable: Pair = (0xE36209, 0xFFAB70)
  private static let tag: Pair = (0x22863A, 0x85E89D)
  private static let deleted: Pair = (0xB31D28, 0xFDAEB7)

  private static let colors: [String: Pair] = [
    "comment": comment,
    "keyword": keyword, "operator": keyword, "storage": keyword, "repeat": keyword,
    "conditional": keyword, "include": keyword, "import": keyword, "preproc": keyword,
    "charset": keyword, "media": keyword, "keyframes": keyword, "supports": keyword,
    "string": string, "character": string, "text.uri": string,
    "string.regexp": regexp,
    "number": constant, "boolean": constant, "constant": constant, "escape": constant,
    "string.escape": constant, "property": constant, "field": constant,
    "variable.member": constant, "attribute": constant, "tag.attribute": constant,
    "markup.heading": constant, "text.title": constant, "markup.raw": constant,
    "text.literal": constant,
    "function": entity, "method": entity, "constructor": entity, "type": entity,
    "module": entity, "namespace": entity, "label": entity, "diff.delta": entity,
    "variable.builtin": variable, "variable.parameter": variable, "parameter": variable,
    "tag": tag, "diff.plus": tag,
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
      if let pair = colors[String(name)] { return CodeStyle(color: dark ? pair.dark : pair.light) }
      guard let dot = name.lastIndex(of: ".") else { return nil }
      name = name[..<dot]
    }
  }
}
