import { getSession } from '@/auth/session-store'

import { getAnonymousSessionId } from './anonymous-id'
import { deviceDisplayName } from './device-name'
import { resolvePresenceVisitor } from './identity'

export function currentPresenceVisitor() {
  return resolvePresenceVisitor({
    anonymousId: getAnonymousSessionId(),
    deviceName: deviceDisplayName(),
    session: getSession(),
  })
}
