import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { findWorkspaceRoot } = require('../../../workspace-root.cjs') as {
  findWorkspaceRoot: (startDir: string) => string
}

const workspaceRoot = findWorkspaceRoot(
  path.resolve(import.meta.dirname, '../../..'),
)

describe('react-native-screens scroll-edge patch', () => {
  it('registers a subtree finder patch for the installed screens version', () => {
    const workspace = readFileSync(
      path.join(workspaceRoot, 'pnpm-workspace.yaml'),
      'utf8',
    )
    // The workspace root is this repo in the public checkout and its parent
    // when this repo is a submodule, so resolve the configured patch path
    // instead of hardcoding the submodule prefix.
    const { version } = JSON.parse(
      readFileSync(
        path.join(
          import.meta.dirname,
          '../../../node_modules/react-native-screens/package.json',
        ),
        'utf8',
      ),
    ) as { version: string }
    const entry = new RegExp(
      `react-native-screens@${version.replaceAll('.', '\\.')}:\\s*(\\S+)`,
    ).exec(workspace)
    expect(entry, `no patch registered for react-native-screens@${version}`).not.toBeNull()

    const patch = readFileSync(path.resolve(workspaceRoot, entry![1]), 'utf8')
    expect(patch).toContain('findFirstScrollViewInSubtreeOf')
    expect(patch).toContain('_hasConfiguredScrollEdgeEffects')
  })
})
