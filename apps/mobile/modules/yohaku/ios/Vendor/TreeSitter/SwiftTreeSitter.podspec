Pod::Spec.new do |s|
  s.name = 'SwiftTreeSitter'
  s.version = '0.10.0'
  s.summary = 'Swift API for the tree-sitter runtime'
  s.homepage = 'https://github.com/tree-sitter/swift-tree-sitter'
  s.license = { :type => 'BSD-3-Clause' }
  s.author = 'ChimeHQ'
  s.source = { :git => 'https://github.com/tree-sitter/swift-tree-sitter.git', :tag => '0.10.0' }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.source_files = 'Sources/SwiftTreeSitter/**/*.swift'
  s.dependency 'TreeSitter'
end
