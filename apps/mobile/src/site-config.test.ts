import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { mergeSite, privacyUrlFrom, publicSite } from './site-config'

const require = createRequire(import.meta.url)
const { findWorkspaceRoot, resolveOverlayDir } =
  require('../workspace-root.cjs') as {
    findWorkspaceRoot: (startDir: string) => string
    resolveOverlayDir: (workspaceRoot: string) => string | null
  }

const mobileRoot = path.dirname(fileURLToPath(import.meta.url))

describe('publicSite', () => {
  it('has empty runtime identity and the public bundle id', () => {
    expect(publicSite).toMatchObject({
      apiUrl: '',
      siteUrl: '',
      siteHosts: [],
      privacyUrl: '',
      scheme: 'yohaku',
      bundleId: 'dev.yohaku.app',
      bundledOwner: null,
    })
  })

  it('keeps production EAS identity out of public eas.json', () => {
    const eas = readFileSync(path.join(mobileRoot, '../eas.json'), 'utf8')
    expect(eas).not.toContain('EXPO_PUBLIC_PUSH_RELAY_URL')
    expect(eas).not.toContain('railway.app')
    expect(eas).not.toContain('EXPO_PUBLIC_API_URL')
    expect(eas).not.toContain('EXPO_PUBLIC_APNS_ENV')
  })
})

describe('mergeSite', () => {
  it('keeps public defaults when overlay is absent', () => {
    expect(mergeSite(null)).toEqual(publicSite)
    expect(mergeSite(undefined)).toEqual(publicSite)
  })

  it('derives privacy from siteUrl when overlay omits it', () => {
    expect(mergeSite({ siteUrl: 'https://example.com' }).privacyUrl).toBe(
      'https://example.com/privacy',
    )
  })

  it('accepts an explicit empty owner fallback', () => {
    expect(mergeSite({ bundledOwner: null }).bundledOwner).toBeNull()
  })
})

describe('privacyUrlFrom', () => {
  it('returns empty when siteUrl is empty', () => {
    expect(privacyUrlFrom('')).toBe('')
  })

  it('keeps an explicit override', () => {
    expect(
      privacyUrlFrom('https://example.com', 'https://example.com/legal'),
    ).toBe('https://example.com/legal')
  })
})

describe('workspace root + overlay', () => {
  const repoRoot = findWorkspaceRoot(mobileRoot)
  const overlayAtRoot = resolveOverlayDir(repoRoot)

  it('resolves this repo root from apps/mobile', () => {
    expect(path.basename(repoRoot)).not.toBe('design-oss')
  })

  it.skipIf(overlayAtRoot !== null)(
    'has no overlay directory in a public-only clone',
    () => {
      expect(overlayAtRoot).toBeNull()
    },
  )

  it('does not keep overlay identity tests in the copied mobile suite', () => {
    expect(existsSync(path.join(mobileRoot, 'overlay-present.test.ts'))).toBe(
      false,
    )
  })

  it('treats a missing overlay directory as public defaults', () => {
    expect(
      resolveOverlayDir(path.join(mobileRoot, 'does-not-exist')),
    ).toBeNull()
    expect(mergeSite(null).apiUrl).toBe('')
    expect(mergeSite(null).bundleId).toBe('dev.yohaku.app')
    expect(mergeSite(null).bundledOwner).toBeNull()
  })

  it('walks past a design-oss workspace to the closed parent', () => {
    const closed = mkdtempSync(path.join(tmpdir(), 'yohaku-closed-'))
    const designOss = path.join(closed, 'design-oss')
    const mobile = path.join(designOss, 'apps', 'mobile')
    mkdirSync(path.join(closed, 'apps', 'web'), { recursive: true })
    mkdirSync(mobile, { recursive: true })
    writeFileSync(
      path.join(closed, 'pnpm-workspace.yaml'),
      'packages:\n  - apps/*\n',
    )
    writeFileSync(
      path.join(designOss, 'pnpm-workspace.yaml'),
      'packages:\n  - design-system\n  - apps/*\n',
    )
    expect(findWorkspaceRoot(mobile)).toBe(closed)
    expect(resolveOverlayDir(designOss)).toBeNull()
  })
})
