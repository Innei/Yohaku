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

function patchPodfile(source, pods) {
  let src = source
    .replaceAll(/^\s*pod '(?:ElkSwift|BeautifulMermaid)',[^\n]*\n/gm, '')
    .replace(
      // eslint-disable-next-line unicorn/better-regex -- regexp/strict requires escaped literal braces and brackets.
      /\n {4}\{\n {6}'ElkSwift' => 'ElkSwift',.*?build_config\.build_settings\['SWIFT_PACKAGE_NAME'\] = package_name\n {6}end\n {4}end\n/s,
      '\n',
    )
  const missing = pods.filter(([name]) => !src.includes(`pod '${name}',`))
  if (missing.length > 0) {
    if (!src.includes('use_react_native!')) {
      throw new Error(
        'Podfile is missing use_react_native!; cannot add vendored pods',
      )
    }
    src = src.replace(
      /use_react_native!\(.*?\)\n/s,
      (block) =>
        `${block}\n${missing.map(([name, podspec]) => `  pod '${name}', :podspec => '${podspec}'`).join('\n')}\n`,
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
