import Foundation

enum MarkdownAST {
  struct Unavailable: Error {}

  // The parser lives in the ReactNativeEnrichedMarkdown pod, whose headers are
  // private, so the entry point is resolved through the Objective-C runtime.
  static func json(for markdown: String) throws -> String {
    let selector = NSSelectorFromString("jsonForMarkdown:")
    let exporterClass: AnyObject? = NSClassFromString("ENRMMarkdownASTExport")
    guard
      let exporter = exporterClass as? NSObjectProtocol,
      exporter.responds(to: selector),
      let json = exporter.perform(selector, with: markdown)?.takeUnretainedValue() as? String
    else {
      throw Unavailable()
    }
    return json
  }
}
