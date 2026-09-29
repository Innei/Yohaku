Pod::Spec.new do |s|
  s.name = 'TreeSitter'
  s.version = '0.25.10'
  s.summary = 'tree-sitter runtime'
  s.homepage = 'https://github.com/tree-sitter/tree-sitter'
  s.license = { :type => 'MIT' }
  s.author = 'tree-sitter'
  s.source = { :git => 'https://github.com/tree-sitter/tree-sitter.git', :tag => 'v0.25.10' }
  s.platforms = { :ios => '15.0' }
  s.static_framework = true
  s.source_files = 'lib/src/lib.c', 'lib/include/tree_sitter/api.h'
  s.public_header_files = 'lib/include/tree_sitter/api.h'
  s.header_mappings_dir = 'lib/include'
  s.preserve_paths = 'lib/src/**/*.{c,h}'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/lib/src" "${PODS_TARGET_SRCROOT}/lib/include"',
  }
end
