import { createRequire } from 'node:module'
import path from 'node:path'

import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)
const { findWorkspaceRoot, overlayFiles, resolveOverlayDir } =
  require('./workspace-root.cjs') as {
    findWorkspaceRoot: (startDir: string) => string
    overlayFiles: (overlayDir: string) => {
      expoJson: string | null
      siteTs: string | null
    }
    resolveOverlayDir: (workspaceRoot: string) => string | null
  }

const mobileRoot = import.meta.dirname
const overlayDir = resolveOverlayDir(findWorkspaceRoot(mobileRoot))
const overlaySite =
  overlayDir && overlayFiles(overlayDir).siteTs
    ? overlayFiles(overlayDir).siteTs
    : path.resolve(mobileRoot, 'src/site-overlay.stub.ts')
const overlayBundledAssets = path.resolve(mobileRoot, 'src/bundled-assets.stub.ts')

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(mobileRoot, 'src'),
      '@modules': path.resolve(mobileRoot, 'modules'),
      'yohaku-mobile-overlay': overlaySite,
      'yohaku-mobile-overlay/bundled-assets': overlayBundledAssets,
    },
  },
  test: {
    environment: 'happy-dom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'plugins/**/*.test.ts',
      ...(overlayDir ? [path.join(overlayDir, '**/*.test.ts')] : []),
    ],
  },
})
