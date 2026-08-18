/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const {
  findWorkspaceRoot,
  overlayFiles,
  resolveOverlayDir,
} = require('./workspace-root.cjs')

const projectRoot = __dirname
const workspaceRoot = findWorkspaceRoot(projectRoot)
const overlayDir = resolveOverlayDir(workspaceRoot)
const overlaySite =
  overlayDir && overlayFiles(overlayDir).siteTs
    ? overlayFiles(overlayDir).siteTs
    : path.join(projectRoot, 'src/site-overlay.stub.ts')

const richCssPath = path.join(
  workspaceRoot,
  'packages/rich-content/dist/rich.css',
)
if (!existsSync(richCssPath)) {
  const result = spawnSync(
    'pnpm',
    ['--filter', '@yohaku/rich-content', 'build:css'],
    { cwd: workspaceRoot, stdio: 'inherit' },
  )
  if (result.status !== 0) {
    throw new Error('Failed to generate @yohaku/rich-content/rich.css')
  }
}

const config = getDefaultConfig(projectRoot)
config.watchFolders = overlayDir ? [workspaceRoot, overlayDir] : [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.sourceExts.push('sql')

// Metro has no tree-shaking, so a bare `import { X } from 'lucide-react'` in a
// dependency drags the package's entire icon barrel into the bundle — together
// these two accounted for 9.2MB of the DOM bundle for 71 icons. The importers
// are third-party dist code, so the barrels are swapped for local shims that
// re-export only the names in use. Subpaths are left alone: the shims
// themselves deep-import through them.
const BARREL_SHIMS = {
  '@icons-pack/react-simple-icons': './shims/react-simple-icons.ts',
  'lucide-react': './shims/lucide-react.ts',
  // Same problem, different shape: @haklex's renderers pull shiki/bundle/full
  // (242 grammars + all 65 themes) and there is no way to narrow it from the
  // call site, so the whole bundle module is swapped for a curated one.
  // shiki's own main entry re-exports that same full bundle — @streamdown/code
  // reaches it that way — so the bare specifier maps here too. Subpaths stay
  // untouched: the shim itself loads shiki/engine/oniguruma and shiki/wasm.
  shiki: './shims/shiki-bundle-full.ts',
  'shiki/bundle/full': './shims/shiki-bundle-full.ts',
}

// Metro fails to resolve @base-ui/react's `#prehydration/*` subpath imports
// (package "imports" field). Their browser condition maps every one of them
// to the same no-op stub, so route them there directly.
const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'yohaku-mobile-overlay') {
    return {
      type: 'sourceFile',
      filePath: overlaySite,
    }
  }

  const shim = BARREL_SHIMS[moduleName]
  if (shim) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, shim),
    }
  }

  if (moduleName.startsWith('#prehydration/')) {
    const marker = `${path.sep}@base-ui${path.sep}react${path.sep}`
    const index = context.originModulePath.lastIndexOf(marker)
    if (index !== -1) {
      return {
        type: 'sourceFile',
        filePath: path.join(
          context.originModulePath.slice(0, index + marker.length),
          'internals',
          'prehydrationScript.stub.mjs',
        ),
      }
    }
  }
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  )
}

module.exports = config
