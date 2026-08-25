Pod::Spec.new do |s|
  s.name = 'BeautifulMermaid'
  s.version = '1.0.4'
  s.summary = 'Native Mermaid renderer for Apple platforms'
  s.homepage = 'https://github.com/lukilabs/beautiful-mermaid-swift'
  s.license = { :type => 'MIT' }
  s.author = 'lukilabs'
  s.source = {
    :git => 'https://github.com/lukilabs/beautiful-mermaid-swift.git',
    :tag => '1.0.4',
  }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ElkSwift'
  s.frameworks = 'CoreGraphics', 'UIKit'
  s.source_files = 'Sources/BeautifulMermaidSwift/**/*.swift'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => '$(inherited) -package-name BeautifulMermaid',
  }
end
