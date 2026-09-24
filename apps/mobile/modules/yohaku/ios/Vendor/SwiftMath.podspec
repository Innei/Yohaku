Pod::Spec.new do |s|
  s.name = 'SwiftMath'
  s.version = '1.7.3'
  s.summary = 'LaTeX math typesetting for Apple platforms'
  s.homepage = 'https://github.com/mgriebling/SwiftMath'
  s.license = { :type => 'MIT' }
  s.author = 'mgriebling'
  s.source = {
    :git => 'https://github.com/mgriebling/SwiftMath.git',
    :tag => '1.7.3',
  }
  s.platforms = { :ios => '15.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.frameworks = 'CoreGraphics', 'CoreText', 'QuartzCore', 'UIKit'
  # SPM-only package: Bundle.module does not exist under CocoaPods, and only the
  # default Latin Modern face is shipped (the other eleven fonts add ~6.6 MB).
  s.prepare_command = <<-CMD
    find Sources/SwiftMath/mathFonts.bundle -type f ! -name 'latinmodern-math.*' ! -name 'GUST-FONT-LICENSE.txt' -delete
    printf 'import Foundation\\n\\nprivate final class SwiftMathBundleToken {}\\n\\nextension Foundation.Bundle {\\n  static let module = Bundle(for: SwiftMathBundleToken.self)\\n}\\n' > Sources/SwiftMath/MathBundle/BundleModule.swift
  CMD
  s.source_files = 'Sources/SwiftMath/**/*.swift'
  s.resources = 'Sources/SwiftMath/mathFonts.bundle'
end
