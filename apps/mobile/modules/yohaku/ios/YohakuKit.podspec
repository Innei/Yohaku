Pod::Spec.new do |s|
  s.name           = 'YohakuKit'
  s.version        = '1.0.0'
  s.summary        = 'Yohaku app native domains'
  s.description    = 'All native Swift code for the Yohaku app, organized by domain.'
  s.author         = 'Innei'
  s.homepage       = 'https://innei.in'
  s.platforms      = { :ios => '18.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'BeautifulMermaid'
  s.dependency 'SwiftMath'
  s.dependency 'SwiftTreeSitterLayer'
  Dir[File.join(__dir__, 'Vendor/TreeSitter/TreeSitter?*.podspec')].each do |spec|
    s.dependency File.basename(spec, '.podspec')
  end

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  install_modules_dependencies(s)

  s.source_files = '**/*.{h,m,mm,swift}'
  s.exclude_files = 'Code/Package.swift', 'Code/Tests/**/*', 'Code/.build/**/*'
  s.resource_bundles = { 'YohakuCodeQueries' => ['Code/Core/Queries/*.scm'] }
end
