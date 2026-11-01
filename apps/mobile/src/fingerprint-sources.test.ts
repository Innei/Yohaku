import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

import { beforeAll, describe, expect, it } from 'vitest'

const run = promisify(execFile)
const mobileRoot = path.resolve(import.meta.dirname, '..')

let sourcePaths: string[]

beforeAll(async () => {
  const { stdout } = await run(
    path.join(mobileRoot, 'node_modules/.bin/fingerprint'),
    ['fingerprint:generate', '--platform', 'ios'],
    { cwd: mobileRoot, maxBuffer: 64 * 1024 * 1024 },
  )
  const fingerprint = JSON.parse(stdout) as {
    sources: { type: string; filePath?: string }[]
  }
  sourcePaths = fingerprint.sources.flatMap((source) =>
    source.filePath ? [source.filePath] : [],
  )
}, 120_000)

describe('iOS runtime fingerprint', () => {
  it('changes when native extension targets change', () => {
    expect(sourcePaths).toContain('targets')
  })

  it('changes when notification string catalogs change', () => {
    expect(sourcePaths).toContain('assets/notifications')
  })
})
