Pod::Spec.new do |s|
  s.name = 'TreeSitterDockerfile'
  s.version = '0.2.0'
  s.summary = 'tree-sitter dockerfile grammar'
  s.homepage = 'https://github.com/camdencheek/tree-sitter-dockerfile'
  s.license = { :type => 'MIT' }
  s.author = 'camdencheek'
  s.source = { :git => 'https://github.com/camdencheek/tree-sitter-dockerfile.git', :tag => 'v0.2.0' }
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
