Pod::Spec.new do |s|
  s.name = 'TreeSitterMarkdown'
  s.version = '0.5.3'
  s.summary = 'tree-sitter markdown grammar'
  s.homepage = 'https://github.com/tree-sitter-grammars/tree-sitter-markdown'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter-grammars'
  s.source = { :git => 'https://github.com/tree-sitter-grammars/tree-sitter-markdown.git', :tag => 'v0.5.3' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'tree-sitter-markdown/src/parser.c', 'tree-sitter-markdown/src/scanner.c', 'tree-sitter-markdown/bindings/swift/**/*.h'
  s.public_header_files = 'tree-sitter-markdown/bindings/swift/**/*.h'
  s.preserve_paths = 'tree-sitter-markdown/src/tree_sitter/*.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/tree-sitter-markdown/src"',
  }
end
