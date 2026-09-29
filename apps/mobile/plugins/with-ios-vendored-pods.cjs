/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

const { withDangerousMod } = require('expo/config-plugins')

const path = require('node:path')
const { readdirSync } = require('node:fs')

const MODULE_IOS = path.join(__dirname, '..', 'modules', 'yohaku', 'ios')

function vendoredPods() {
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.podspec'))
        found.push([
          path.basename(entry.name, '.podspec'),
          `../modules/yohaku/ios/${path.relative(MODULE_IOS, full).split(path.sep).join('/')}`,
        ])
    }
  }
  walk(path.join(MODULE_IOS, 'Vendor'))
  return found.sort(([a], [b]) => a.localeCompare(b))
}

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

function patchPodfile(source, pods) {
  let src = source
  const missing = pods.filter(([name]) => !src.includes(`pod '${name}',`))
  if (missing.length > 0) {
    if (!src.includes('use_react_native!')) {
      throw new Error(
        'Podfile is missing use_react_native!; cannot add vendored pods',
      )
    }
    src = src.replace(
      /use_react_native!\([\s\S]*?\)\n/,
      (block) =>
        `${block}\n${missing.map(([name, podspec]) => `  pod '${name}', :podspec => '${podspec}'`).join('\n')}\n`,
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

function withIosVendoredPods(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const { readFile, writeFile } = require('node:fs/promises')
      const podfile = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      )
      await writeFile(
        podfile,
        patchPodfile(await readFile(podfile, 'utf8'), vendoredPods()),
      )
      return config
    },
  ])
}

module.exports = withIosVendoredPods
module.exports.patchPodfile = patchPodfile
module.exports.vendoredPods = vendoredPods
