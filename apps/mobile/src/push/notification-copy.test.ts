import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const run = promisify(execFile)
const mobileRoot = path.resolve(import.meta.dirname, '../..')

describe.runIf(process.platform === 'darwin')(
  'notification extension copy',
  () => {
    let results: Record<string, unknown>
    let workDir: string

    beforeAll(async () => {
      workDir = await mkdtemp(path.join(tmpdir(), 'notification-copy-'))
      const binary = path.join(workDir, 'notification-copy')
      await run('swiftc', [
        path.join(
          mobileRoot,
          'targets/notification-service/NotificationCopy.swift',
        ),
        path.join(
          import.meta.dirname,
          '__swift__/notification-copy/main.swift',
        ),
        '-o',
        binary,
      ])
      const { stdout } = await run(binary)
      results = JSON.parse(stdout)
    }, 120_000)

    afterAll(async () => {
      await rm(workDir, { recursive: true, force: true })
    })

    it('puts the reply excerpt in the body with localized tokens', () => {
      expect(results.reply).toEqual({
        title: 'Innei',
        subtitle: '回复了你 · 《十月未央》',
        body: '暂时还不行 [图片] 看 [代码]',
      })
    })

    it('leaves replies untouched without an excerpt or a localization', () => {
      expect(results.replyWithoutExcerpt).toBeNull()
      expect(results.replyWithoutLocalization).toBeNull()
    })

    it('names the author and moves the post title to the subtitle without a body', () => {
      expect(results.post).toEqual({
        title: 'Innei 发布了新文章',
        subtitle: '十月未央',
        body: '',
      })
    })

    it('puts note weather and mood in the body', () => {
      expect(results.note).toEqual({
        title: 'Innei 发布了新手记',
        subtitle: '十月未央',
        body: '秋 · 五味杂陈',
      })
      expect(results.noteMoodOnly).toMatchObject({ body: '五味杂陈' })
    })

    it('leaves recently, ownerless and unlocalized content untouched', () => {
      expect(results.recently).toBeNull()
      expect(results.postWithoutOwner).toBeNull()
      expect(results.postWithoutLocalization).toBeNull()
    })

    it('picks an attachment extension iOS can render', () => {
      expect(results.coverPng).toBe('png')
      expect(results.coverJpeg).toBe('jpg')
      expect(results.coverFromPath).toBe('gif')
      expect(results.coverUnsupported).toBeNull()
    })
  },
)
