; tree-sitter/tree-sitter-php@v0.25.0 queries/injections.scm
((comment) @injection.content
  (#set! injection.language "phpdoc"))

(heredoc
  (heredoc_body) @injection.content
  (heredoc_end) @injection.language)

(nowdoc
  (nowdoc_body) @injection.content
  (heredoc_end) @injection.language)

; tree-sitter/tree-sitter-php@v0.25.0 queries/injections-text.scm
((text) @injection.content
 (#set! injection.language "html")
 (#set! injection.combined))
