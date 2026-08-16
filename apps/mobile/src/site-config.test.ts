import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
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
  it('resolves this repo root from apps/mobile with no overlay', () => {
    const root = findWorkspaceRoot(mobileRoot)
    expect(path.basename(root)).not.toBe('design-oss')
    expect(resolveOverlayDir(root)).toBeNull()
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
