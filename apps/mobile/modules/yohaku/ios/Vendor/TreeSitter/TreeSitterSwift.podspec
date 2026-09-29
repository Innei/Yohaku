Pod::Spec.new do |s|
  s.name = 'TreeSitterSwift'
  s.version = '0.7.3'
  s.summary = 'tree-sitter swift grammar'
  s.homepage = 'https://github.com/alex-pinkus/tree-sitter-swift'
  s.license = { :type => 'MIT' }
  s.author = 'alex-pinkus'
  s.source = { :git => 'https://github.com/alex-pinkus/tree-sitter-swift.git', :tag => '0.7.3-with-generated-files' }
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
