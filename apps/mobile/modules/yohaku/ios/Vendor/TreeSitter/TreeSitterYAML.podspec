Pod::Spec.new do |s|
  s.name = 'TreeSitterYAML'
  s.version = '0.7.2'
  s.summary = 'tree-sitter yaml grammar'
  s.homepage = 'https://github.com/tree-sitter-grammars/tree-sitter-yaml'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter-grammars'
  s.source = { :git => 'https://github.com/tree-sitter-grammars/tree-sitter-yaml.git', :tag => 'v0.7.2' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'src/parser.c', 'src/scanner.c', 'bindings/swift/**/*.h'
  s.public_header_files = 'bindings/swift/**/*.h'
  s.preserve_paths = 'src/tree_sitter/*.h', 'src/schema.core.c'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/src"',
  }
end
