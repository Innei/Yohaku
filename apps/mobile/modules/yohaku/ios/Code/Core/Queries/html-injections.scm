; tree-sitter/tree-sitter-html@v0.23.2 queries/injections.scm
((script_element
  (raw_text) @injection.content)
 (#set! injection.language "javascript"))

((style_element
  (raw_text) @injection.content)
 (#set! injection.language "css"))
