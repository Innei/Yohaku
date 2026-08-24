import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('gallery site Referer', () => {
  it('threads the caller site URL through every gallery open path', () => {
    const imageCache = readFileSync(
      path.join(srcRoot, 'lib/image-cache.ts'),
      'utf8',
    )
    const articleBody = readFileSync(
      path.join(srcRoot, 'screens/details/article-body.tsx'),
      'utf8',
    )
    const host = readFileSync(
      path.join(srcRoot, 'components/dom/webview-host.ts'),
      'utf8',
    )
    const engine = readFileSync(path.join(srcRoot, 'sync/engine.ts'), 'utf8')

    expect(imageCache).toContain('siteReferer?: string')
    expect(articleBody).toContain('siteReferer: getSiteUrl()')
    expect(host).toContain('postNativeImagePreview(payload, deps.webOrigin)')
    expect(engine).toContain('prefetchImages([...new Set(urls)], getSiteUrl())')
  })
})
