/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

const { withXcodeProject } = require('expo/config-plugins')

const BUNDLE_PHASE_NAME = 'Bundle React Native code and images'
const WIPE_MARKER = 'UNLOCALIZED_RESOURCES_FOLDER_PATH/www.bundle'
const XCODE_SH_ANCHOR = 'react-native-xcode.sh'

// Keep the wipe snippet in one place so pbxproj and prebuild stay aligned.
const WIPE_BLOCK = `if [[ "$CONFIGURATION" != *Debug* ]]; then
  rm -rf "$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/www.bundle"
fi
`

function phaseName(phase) {
  if (!phase || typeof phase.name !== 'string') return ''
  return phase.name.replace(/^"|"$/g, '')
}

function decodePbxShellScript(raw) {
  const quoted = raw.startsWith('"') && raw.endsWith('"')
  const body = quoted ? raw.slice(1, -1) : raw
  const encoded = quoted && body.includes('\\n')
  const text = encoded
    ? body.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    : body
  return { encoded, quoted, text }
}

function encodePbxShellScript(text, { encoded, quoted }) {
  if (!quoted) return text
  if (!encoded) return `"${text}"`
  return `"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

function injectWipeScript(raw) {
  if (raw.includes(WIPE_MARKER)) return raw

  const decoded = decodePbxShellScript(raw)
  if (!decoded.text.includes(XCODE_SH_ANCHOR)) {
    throw new Error(
      'Cannot find react-native-xcode.sh in the Bundle React Native script.',
    )
  }

  const { text } = decoded
  const anchorAt = text.lastIndexOf(XCODE_SH_ANCHOR)
  const lineStart = text.lastIndexOf('\n', anchorAt) + 1
  const next = `${text.slice(0, lineStart)}${WIPE_BLOCK}\n${text.slice(lineStart)}`
  return encodePbxShellScript(next, decoded)
}

function applyWipeToXcodeProject(project) {
  const phases = project.hash.project.objects.PBXShellScriptBuildPhase ?? {}
  let patched = false
  for (const key of Object.keys(phases)) {
    const phase = phases[key]
    if (!phase || typeof phase.shellScript !== 'string') continue
    if (phaseName(phase) !== BUNDLE_PHASE_NAME) continue
    phase.shellScript = injectWipeScript(phase.shellScript)
    patched = true
  }
  if (!patched) {
    throw new Error(
      `Cannot find the "${BUNDLE_PHASE_NAME}" build phase to wipe www.bundle.`,
    )
  }
  return project
}

const withWipeWwwBundle = (config) =>
  withXcodeProject(config, (config) => {
    config.modResults = applyWipeToXcodeProject(config.modResults)
    return config
  })

module.exports = withWipeWwwBundle
module.exports.injectWipeScript = injectWipeScript
module.exports.WIPE_BLOCK = WIPE_BLOCK
module.exports.WIPE_MARKER = WIPE_MARKER
