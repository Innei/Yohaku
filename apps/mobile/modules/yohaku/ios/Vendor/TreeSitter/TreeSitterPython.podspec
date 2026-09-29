Pod::Spec.new do |s|
  s.name = 'TreeSitterPython'
  s.version = '0.25.0'
  s.summary = 'tree-sitter python grammar'
  s.homepage = 'https://github.com/tree-sitter/tree-sitter-python'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter'
  s.source = { :git => 'https://github.com/tree-sitter/tree-sitter-python.git', :tag => 'v0.25.0' }
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
