Pod::Spec.new do |s|
  s.name = 'TreeSitterDiff'
  s.version = '0.2.0'
  s.summary = 'tree-sitter diff grammar'
  s.homepage = 'https://github.com/the-mikedavis/tree-sitter-diff'
  s.license = { :type => 'MIT' }
  s.author = 'the-mikedavis'
  s.source = { :git => 'https://github.com/the-mikedavis/tree-sitter-diff.git', :tag => 'v0.2.0' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'src/parser.c', 'bindings/swift/**/*.h'
  s.public_header_files = 'bindings/swift/**/*.h'
  s.preserve_paths = 'src/tree_sitter/*.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/src"',
  }
end
