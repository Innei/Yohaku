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

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end
