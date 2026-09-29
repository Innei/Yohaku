Pod::Spec.new do |s|
  s.name = 'TreeSitterTypeScript'
  s.version = '0.23.2'
  s.summary = 'tree-sitter typescript grammar'
  s.homepage = 'https://github.com/tree-sitter/tree-sitter-typescript'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter'
  s.source = { :git => 'https://github.com/tree-sitter/tree-sitter-typescript.git', :tag => 'v0.23.2' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'typescript/src/parser.c', 'typescript/src/scanner.c', 'bindings/swift/typescript/**/*.h'
  s.public_header_files = 'bindings/swift/typescript/**/*.h'
  s.preserve_paths = 'typescript/src/tree_sitter/*.h', 'common/scanner.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/typescript/src"',
  }
end
