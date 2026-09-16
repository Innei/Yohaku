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
    expect(workspace).toContain(
      'react-native-screens@4.26.2: yohaku-oss/patches/react-native-screens@4.26.2.patch',
    )

    const patch = readFileSync(
      path.join(
        workspaceRoot,
        'yohaku-oss/patches/react-native-screens@4.26.2.patch',
      ),
      'utf8',
    )
    expect(patch).toContain('findFirstScrollViewInSubtreeOf')
    expect(patch).toContain('_hasConfiguredScrollEdgeEffects')
  })
})
