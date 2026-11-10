import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const mobileRoot = path.resolve(import.meta.dirname, '../..')
const target = (name: string) =>
  readFile(`${mobileRoot}/targets/notification-service/${name}`, 'utf8')

describe('notification service extension source', () => {
  it('generates a communication notification target with a dedicated bundle id', async () => {
    const config = await target('expo-target.config.js')
    expect(config).toContain("type: 'notification-service'")
    expect(config).toContain("bundleIdentifier: '.notification-service'")
    expect(config).toContain("'UserNotifications'")
    expect(config).toContain("'Intents'")
  })

  it('upgrades only reply payloads through INSendMessageIntent', async () => {
    const source = await target('NotificationService.swift')
    expect(source).toContain('YOHAKU_COMMENT_REPLIED')
    expect(source).toContain('INSendMessageIntent(')
    expect(source).toContain('interaction.direction = .incoming')
    expect(source).toContain('content.updating(from: intent)')
  })

  it('validates remote avatars and preserves a fallback notification', async () => {
    const source = await target('NotificationService.swift')
    expect(source).toContain('url.scheme == "https"')
    expect(source).toContain('HTTPURLResponse')
    expect(source).toContain('1_500_000')
    expect(source).toContain('finish(with:')
    expect(source).toContain('serviceExtensionTimeWillExpire')
  })
})
