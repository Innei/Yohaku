Pod::Spec.new do |s|
  s.name = 'TreeSitterLua'
  s.version = '0.5.0'
  s.summary = 'tree-sitter lua grammar'
  s.homepage = 'https://github.com/tree-sitter-grammars/tree-sitter-lua'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter-grammars'
  s.source = { :git => 'https://github.com/tree-sitter-grammars/tree-sitter-lua.git', :tag => 'v0.5.0' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'src/parser.c', 'src/scanner.c', 'bindings/swift/**/*.h'
  s.public_header_files = 'bindings/swift/**/*.h'
  s.preserve_paths = 'src/tree_sitter/*.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/src"',
  }
end
