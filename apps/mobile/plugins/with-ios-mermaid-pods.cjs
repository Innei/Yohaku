/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

const { withDangerousMod } = require('expo/config-plugins')

const ELK_LINE =
  "  pod 'ElkSwift', :podspec => '../modules/yohaku/ios/Vendor/ElkSwift.podspec'"
const MERMAID_LINE =
  "  pod 'BeautifulMermaid', :podspec => '../modules/yohaku/ios/Vendor/BeautifulMermaid.podspec'"
const SWIFTMATH_LINE =
  "  pod 'SwiftMath', :podspec => '../modules/yohaku/ios/Vendor/SwiftMath.podspec'"

const PACKAGE_NAME_POST_INSTALL = `
    {
      'ElkSwift' => 'ElkSwift',
      'BeautifulMermaid' => 'BeautifulMermaid',
    }.each do |target_name, package_name|
      target = installer.pods_project.targets.find { |item| item.name == target_name }
      next unless target
      target.build_configurations.each do |build_config|
        flags = String(build_config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)')
        unless flags.include?("-package-name #{package_name}")
          build_config.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} -package-name #{package_name}"
        end
        build_config.build_settings['SWIFT_PACKAGE_NAME'] = package_name
      end
    end
`

function patchPodfile(source) {
  let src = source
  const pods = [
    ["pod 'ElkSwift'", ELK_LINE],
    ["pod 'BeautifulMermaid'", MERMAID_LINE],
    ["pod 'SwiftMath'", SWIFTMATH_LINE],
  ].filter(([needle]) => !src.includes(needle))
  if (pods.length > 0) {
    if (!src.includes('use_react_native!')) {
      throw new Error(
        'Podfile is missing use_react_native!; cannot add vendored pods',
      )
    }
    src = src.replace(
      /use_react_native!\([\s\S]*?\)\n/,
      (block) => `${block}\n${pods.map(([, line]) => line).join('\n')}\n`,
    )
  }
  if (!src.includes("SWIFT_PACKAGE_NAME'] = package_name")) {
    src = src.replace(
      /react_native_post_install\(\s*installer,[\s\S]*?\)\n/,
      (block) => `${block}${PACKAGE_NAME_POST_INSTALL}`,
    )
  }
  return src
}

function withIosMermaidPods(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const { readFile, writeFile } = require('node:fs/promises')
      const path = require('node:path')
      const podfile = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      )
      await writeFile(podfile, patchPodfile(await readFile(podfile, 'utf8')))
      return config
    },
  ])
}

module.exports = withIosMermaidPods
module.exports.patchPodfile = patchPodfile
