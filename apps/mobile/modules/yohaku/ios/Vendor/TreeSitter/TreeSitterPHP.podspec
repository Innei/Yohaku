Pod::Spec.new do |s|
  s.name = 'TreeSitterPHP'
  s.version = '0.25.0'
  s.summary = 'tree-sitter php grammar'
  s.homepage = 'https://github.com/tree-sitter/tree-sitter-php'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter'
  s.source = { :git => 'https://github.com/tree-sitter/tree-sitter-php.git', :tag => 'v0.25.0' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'php/src/parser.c', 'php/src/scanner.c', 'bindings/swift/**/*.h'
  s.public_header_files = 'bindings/swift/**/*.h'
  s.preserve_paths = 'php/src/tree_sitter/*.h', 'common/scanner.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/php/src"',
  }
end
