Pod::Spec.new do |s|
  s.name = 'TreeSitterXML'
  s.version = '0.7.0'
  s.summary = 'tree-sitter xml grammar'
  s.homepage = 'https://github.com/tree-sitter-grammars/tree-sitter-xml'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter-grammars'
  s.source = { :git => 'https://github.com/tree-sitter-grammars/tree-sitter-xml.git', :tag => 'v0.7.0' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'xml/src/parser.c', 'xml/src/scanner.c', 'bindings/swift/xml/**/*.h'
  s.public_header_files = 'bindings/swift/xml/**/*.h'
  s.preserve_paths = 'xml/src/tree_sitter/*.h', 'common/scanner.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/xml/src"',
  }
end
