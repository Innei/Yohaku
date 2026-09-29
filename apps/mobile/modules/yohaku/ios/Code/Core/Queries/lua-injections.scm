; tree-sitter-grammars/tree-sitter-lua@v0.5.0 queries/injections.scm
((function_call
  name: [
    (identifier) @_cdef_identifier
    (_
      _
      (identifier) @_cdef_identifier)
  ]
  arguments: (arguments
    (string
      content: _ @injection.content
      (#set! injection.language "c"))))
  (#eq? @_cdef_identifier "cdef"))
