import Foundation
import XCTest

@testable import YohakuCodeCore

final class CodeLanguagesTests: XCTestCase {
  func testResolvesCanonicalNamesAndAliases() {
    let cases: [String: String] = [
      "ts": "typescript", "TS": "typescript", "mts": "typescript", "tsx": "tsx",
      "js": "javascript", "jsx": "javascript", "sh": "bash", "zsh": "bash",
      "jsonc": "json", "yml": "yaml", "py": "python", "patch": "diff",
      "svg": "xml", "docker": "dockerfile", "golang": "go", "h": "c",
      "md": "markdown", "rs": "rust", "php": "php", "swift": "swift", "htm": "html",
    ]
    for (tag, expected) in cases {
      XCTAssertEqual(CodeLanguages.resolve(tag)?.name, expected, tag)
    }
  }

  func testUnknownTagsResolveToNil() {
    for tag in ["", "text", "scss", "sql", "vue", "console"] {
      XCTAssertNil(CodeLanguages.resolve(tag), tag)
    }
  }
}

final class CodeHighlighterTests: XCTestCase {
  private let samples: [String: String] = [
    "typescript": "const a: number = 1\nfunction f(x: string) { return x }",
    "tsx": "const App = () => <div className=\"a\">{1}</div>",
    "javascript": "import x from 'y'\nexport const a = () => x + 1",
    "bash": "if [ -f a ]; then echo \"hi $USER\"; fi",
    "json": "{\"a\": [1, true, null]}",
    "swift": "struct A { let b: Int = 1 }\nfunc c() -> String { \"d\" }",
    "css": ".a > b { color: #fff; margin: 0 auto; }",
    "yaml": "a: 1\nb:\n  - c\n  - \"d\"",
    "html": "<div class=\"a\"><p>hi</p></div>",
    "python": "def f(x):\n    return x + 1  # c",
    "diff": "--- a\n+++ b\n@@ -1 +1 @@\n-old\n+new",
    "xml": "<?xml version=\"1.0\"?><a b=\"c\">d</a>",
    "toml": "[a]\nb = \"c\"\nd = 1",
    "dockerfile": "FROM node:20\nRUN npm ci\nCMD [\"node\", \"a.js\"]",
    "lua": "local function f(x) return x + 1 end",
    "go": "package main\nfunc main() { fmt.Println(\"a\") }",
    "java": "class A { public static void main(String[] a) { int b = 1; } }",
    "c": "#include <stdio.h>\nint main(void) { return 0; }",
    "markdown": "# Title\n\nSome *text* and `code`.\n",
    "rust": "fn main() { let a: i32 = 1; println!(\"{}\", a); }",
    "php": "<?php\nfunction f($a) { return $a . 'b'; }\n",
  ]

  func testEveryLanguageHighlightsItsSample() throws {
    XCTAssertEqual(Set(samples.keys), Set(CodeLanguages.all.map(\.name)))
    for (name, code) in samples {
      let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: name), name)
      XCTAssertFalse(spans.isEmpty, name)
    }
  }

  func testEveryShippedInjectionQueryCompiles() throws {
    let queries = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().appendingPathComponent("Core/Queries")
    let names = try FileManager.default.contentsOfDirectory(atPath: queries.path)
      .filter { $0.hasSuffix("-injections.scm") }
      .map { String($0.dropLast("-injections.scm".count)) }
    XCTAssertFalse(names.isEmpty)
    for name in names {
      XCTAssertNotNil(CodeLanguages.configuration(for: name)?.queries[.injections], name)
    }
  }

  func testTypeScriptKeywordIsCaptured() throws {
    let code = "const a = 1"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "ts"))
    XCTAssertTrue(capture(at: 0, in: spans)?.hasPrefix("keyword") == true)
  }

  func testLaterPatternWinsForTheSameNode() throws {
    let code = "function load() { return fetch(url) }"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "js"))
    let ns = code as NSString
    XCTAssertEqual(capture(at: ns.range(of: "load").location, in: spans), "function")
    XCTAssertEqual(capture(at: ns.range(of: "fetch").location, in: spans), "function")
  }

  func testTypeScriptSpecificsOverrideInheritedJavaScriptPatterns() throws {
    let ts = "function f(id: number) {}"
    let tsSpans = try XCTUnwrap(CodeHighlighter.shared.highlight(ts, language: "ts"))
    XCTAssertEqual(capture(at: (ts as NSString).range(of: "id").location, in: tsSpans), "variable.parameter")

    let tsx = "const a = <button onClick={f} />"
    let tsxSpans = try XCTUnwrap(CodeHighlighter.shared.highlight(tsx, language: "tsx"))
    XCTAssertEqual(capture(at: (tsx as NSString).range(of: "button").location, in: tsxSpans), "tag")
  }

  func testSpansAreSortedAndDoNotOverlap() throws {
    let code = "export function f(a: string) { return a.trim() }"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "typescript"))
    for (prev, next) in zip(spans, spans.dropFirst()) {
      XCTAssertLessThanOrEqual(NSMaxRange(prev.range), next.range.location)
    }
  }

  func testMarkdownFenceIsHighlightedAsItsLanguage() throws {
    let code = "Intro\n\n```ts\nconst a = 1\n```\n"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "md"))
    let keyword = (code as NSString).range(of: "const").location
    XCTAssertTrue(capture(at: keyword, in: spans)?.hasPrefix("keyword") == true)
  }

  func testMarkdownStrongTextIsEmphasised() throws {
    let code = "Some **bold** text"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "md"))
    let name = try XCTUnwrap(capture(at: (code as NSString).range(of: "bold").location, in: spans))
    XCTAssertEqual(CodeTheme.style(for: name, dark: false)?.bold, true, name)
  }

  func testUnsupportedFenceContentFallsBackToDefaultColor() throws {
    let code = "```sql\nselect 1\n```\n"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "md"))
    let name = capture(at: (code as NSString).range(of: "select").location, in: spans)
    XCTAssertNil(name.flatMap { CodeTheme.style(for: $0, dark: false) }, name ?? "")
  }

  func testHtmlScriptIsHighlightedAsJavaScript() throws {
    let code = "<script>let x = 1</script>"
    let spans = try XCTUnwrap(CodeHighlighter.shared.highlight(code, language: "html"))
    let keyword = (code as NSString).range(of: "let").location
    XCTAssertTrue(capture(at: keyword, in: spans)?.hasPrefix("keyword") == true)
  }

  func testUnsupportedOrOversizedCodeIsNotHighlighted() {
    XCTAssertNil(CodeHighlighter.shared.highlight("a", language: "sql"))
    let big = String(repeating: "a", count: CodeHighlighter.maxLength + 1)
    XCTAssertNil(CodeHighlighter.shared.highlight(big, language: "ts"))
  }

  private func capture(at location: Int, in spans: [CodeSpan]) -> String? {
    spans.first { NSLocationInRange(location, $0.range) }?.capture
  }
}

final class CodeThemeTests: XCTestCase {
  func testMatchesGithubColorsWithPrefixFallback() {
    XCTAssertEqual(CodeTheme.style(for: "keyword", dark: false)?.color, 0xD73A49)
    XCTAssertEqual(CodeTheme.style(for: "keyword.function", dark: true)?.color, 0xF97583)
    XCTAssertEqual(CodeTheme.style(for: "function.method.builtin", dark: false)?.color, 0x6F42C1)
    XCTAssertEqual(CodeTheme.style(for: "string.regexp", dark: true)?.color, 0xDBEDFF)
    XCTAssertEqual(CodeTheme.style(for: "comment", dark: true)?.color, 0x6A737D)
  }

  func testUnmappedCapturesUseDefaultForeground() {
    XCTAssertNil(CodeTheme.style(for: "punctuation.bracket", dark: false))
    XCTAssertNil(CodeTheme.style(for: "variable", dark: true))
  }

  func testMarkupEmphasisIsStyledNotColored() {
    let strong = CodeTheme.style(for: "markup.strong", dark: false)
    XCTAssertEqual(strong?.bold, true)
    XCTAssertNil(strong?.color)
    XCTAssertEqual(CodeTheme.style(for: "markup.italic", dark: false)?.italic, true)
  }
}
