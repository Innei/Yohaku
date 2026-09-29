import Foundation
import SwiftTreeSitter
import TreeSitterBash
import TreeSitterC
import TreeSitterCSS
import TreeSitterDiff
import TreeSitterDockerfile
import TreeSitterGo
import TreeSitterHTML
import TreeSitterJava
import TreeSitterJavaScript
import TreeSitterJSON
import TreeSitterLua
import TreeSitterMarkdown
import TreeSitterMarkdownInline
import TreeSitterPHP
import TreeSitterPython
import TreeSitterRust
import TreeSitterSwift
import TreeSitterTOML
import TreeSitterTSX
import TreeSitterTypeScript
import TreeSitterXML
import TreeSitterYAML

struct CodeLanguage {
  let name: String
  let aliases: [String]
  let injectedOnly: Bool
  let parser: () -> OpaquePointer

  init(_ name: String, _ aliases: [String] = [], injectedOnly: Bool = false, parser: @escaping () -> OpaquePointer) {
    self.name = name
    self.aliases = aliases
    self.injectedOnly = injectedOnly
    self.parser = parser
  }
}

private final class CodeQueriesToken {}

enum CodeLanguages {
  private static let registry: [CodeLanguage] = [
    CodeLanguage("typescript", ["ts", "mts", "cts"]) { tree_sitter_typescript() },
    CodeLanguage("tsx") { tree_sitter_tsx() },
    CodeLanguage("javascript", ["js", "mjs", "cjs", "jsx"]) { tree_sitter_javascript() },
    CodeLanguage("bash", ["sh", "shell", "zsh"]) { tree_sitter_bash() },
    CodeLanguage("json", ["json5", "jsonc"]) { tree_sitter_json() },
    CodeLanguage("swift") { tree_sitter_swift() },
    CodeLanguage("css") { tree_sitter_css() },
    CodeLanguage("yaml", ["yml"]) { tree_sitter_yaml() },
    CodeLanguage("html", ["htm"]) { tree_sitter_html() },
    CodeLanguage("python", ["py"]) { tree_sitter_python() },
    CodeLanguage("diff", ["patch"]) { tree_sitter_diff() },
    CodeLanguage("xml", ["svg", "plist"]) { tree_sitter_xml() },
    CodeLanguage("toml") { tree_sitter_toml() },
    CodeLanguage("dockerfile", ["docker"]) { tree_sitter_dockerfile() },
    CodeLanguage("lua") { tree_sitter_lua() },
    CodeLanguage("go", ["golang"]) { tree_sitter_go() },
    CodeLanguage("java") { tree_sitter_java() },
    CodeLanguage("c", ["h"]) { tree_sitter_c() },
    CodeLanguage("markdown", ["md", "mdx"]) { tree_sitter_markdown() },
    CodeLanguage("markdown_inline", injectedOnly: true) { tree_sitter_markdown_inline() },
    CodeLanguage("rust", ["rs"]) { tree_sitter_rust() },
    CodeLanguage("php") { tree_sitter_php() },
  ]

  static let all = registry.filter { !$0.injectedOnly }

  private static let byTag: [String: CodeLanguage] = {
    var map: [String: CodeLanguage] = [:]
    for language in registry where !language.injectedOnly {
      map[language.name] = language
      for alias in language.aliases { map[alias] = language }
    }
    return map
  }()

  private static let byName = Dictionary(uniqueKeysWithValues: registry.map { ($0.name, $0) })

  static func resolve(_ tag: String) -> CodeLanguage? {
    byTag[tag.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()]
  }

  private static let lock = NSLock()
  private static var configurations: [String: LanguageConfiguration?] = [:]

  static func configuration(for name: String) -> LanguageConfiguration? {
    lock.lock()
    defer { lock.unlock() }
    if let cached = configurations[name] { return cached }
    let built = byName[name].flatMap(build)
    configurations[name] = built
    return built
  }

  static func configuration(forInjected tag: String) -> LanguageConfiguration? {
    let name = byName[tag] != nil ? tag : resolve(tag)?.name
    return name.flatMap(configuration(for:))
  }

  private static func build(_ language: CodeLanguage) -> LanguageConfiguration? {
    let tsLanguage = language.parser()
    guard let highlights = query(language.name, "highlights", tsLanguage) else { return nil }
    var queries: [Query.Definition: Query] = [.highlights: highlights]
    queries[.injections] = query(language.name, "injections", tsLanguage)
    return LanguageConfiguration(tsLanguage, name: language.name, queries: queries)
  }

  private static let bundle: Bundle? = {
    #if SWIFT_PACKAGE
      return Bundle.module
    #else
      return Bundle(for: CodeQueriesToken.self)
        .url(forResource: "YohakuCodeQueries", withExtension: "bundle")
        .flatMap(Bundle.init(url:))
    #endif
  }()

  private static func query(_ name: String, _ kind: String, _ tsLanguage: OpaquePointer) -> Query? {
    guard let url = bundle?.url(forResource: "\(name)-\(kind)", withExtension: "scm"),
          let data = try? Data(contentsOf: url)
    else { return nil }
    do {
      return try Query(language: Language(language: tsLanguage), data: data)
    } catch {
      NSLog("[YohakuCode] \(name) \(kind) query failed: \(error)")
      return nil
    }
  }
}
