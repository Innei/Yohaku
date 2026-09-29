import Foundation
import SwiftTreeSitter
import SwiftTreeSitterLayer

struct CodeSpan: Equatable {
  let range: NSRange
  let capture: String
}

final class CodeHighlighter {
  static let shared = CodeHighlighter()
  static let maxLength = 100_000

  private static let ignoredCaptures: Set<String> = ["spell", "nospell", "embedded", "error"]

  private struct Capture {
    let range: NSRange
    let name: String
    let depth: Int
    let pattern: Int
  }

  func highlight(_ code: String, language tag: String) -> [CodeSpan]? {
    let length = code.utf16.count
    guard length > 0, length <= Self.maxLength,
          let language = CodeLanguages.resolve(tag),
          let root = CodeLanguages.configuration(for: language.name)
    else { return nil }

    do {
      let layer = try LanguageLayer(
        languageConfig: root,
        configuration: .init(languageProvider: { CodeLanguages.configuration(forInjected: $0) })
      )
      layer.replaceContent(with: code)
      let matches = try layer
        .executeQuery(.highlights, in: IndexSet(integersIn: 0..<length))
        .resolve(with: .init(string: code))

      var captures: [Capture] = []
      for match in matches {
        for capture in match.captures {
          guard let name = capture.name, !name.hasPrefix("_"),
                !Self.ignoredCaptures.contains(name), capture.range.length > 0
          else { continue }
          captures.append(Capture(range: capture.range, name: name, depth: capture.depth, pattern: capture.patternIndex))
        }
      }
      return Self.flatten(captures, length: length)
    } catch {
      return nil
    }
  }

  // Painter's order: deeper layers over shallower, inner nodes over outer, and for
  // the same node the later pattern wins, as tree-sitter-highlight resolves it.
  private static func flatten(_ captures: [Capture], length: Int) -> [CodeSpan] {
    let ordered = captures.sorted {
      if $0.depth != $1.depth { return $0.depth < $1.depth }
      if $0.range.length != $1.range.length { return $0.range.length > $1.range.length }
      return $0.pattern < $1.pattern
    }
    var owner = [Int32](repeating: -1, count: length)
    for (index, capture) in ordered.enumerated() {
      let end = min(NSMaxRange(capture.range), length)
      guard capture.range.location < end else { continue }
      for unit in capture.range.location..<end { owner[unit] = Int32(index) }
    }

    var spans: [CodeSpan] = []
    var start = 0
    while start < length {
      let current = owner[start]
      var end = start + 1
      while end < length, owner[end] == current { end += 1 }
      if current >= 0 {
        spans.append(CodeSpan(range: NSRange(location: start, length: end - start), capture: ordered[Int(current)].name))
      }
      start = end
    }
    return spans
  }
}
