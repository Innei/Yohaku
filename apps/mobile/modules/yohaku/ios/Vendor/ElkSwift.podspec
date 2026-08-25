Pod::Spec.new do |s|
  s.name = 'ElkSwift'
  s.version = '1.0.2'
  s.summary = 'Swift port of the Eclipse Layout Kernel'
  s.homepage = 'https://github.com/lukilabs/elk-swift'
  s.license = { :type => 'EPL-2.0' }
  s.author = 'lukilabs'
  s.source = { :git => 'https://github.com/lukilabs/elk-swift.git', :tag => '1.0.2' }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.source_files = 'Sources/ElkSwift/**/*.swift'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => '$(inherited) -package-name ElkSwift',
  }
end
