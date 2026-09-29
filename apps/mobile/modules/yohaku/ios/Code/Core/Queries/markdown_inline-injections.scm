; tree-sitter-grammars/tree-sitter-markdown@v0.5.3 tree-sitter-markdown-inline/queries/injections.scm
((html_tag) @injection.content
  (#set! injection.language "html"))

((latex_block) @injection.content
  (#set! injection.language "latex"))
