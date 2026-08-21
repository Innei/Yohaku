import { describe, expect, it } from 'vitest'

import { applyKeychainSigningSettings } from './with-ios-keychain-signing.cjs'

describe('applyKeychainSigningSettings', () => {
  it('leaves unrelated configurations alone', () => {
    expect(applyKeychainSigningSettings({ PRODUCT_NAME: 'Pods' })).toEqual({
      PRODUCT_NAME: 'Pods',
    })
  })

  it('forces entitlement injection on the app target before entitlements exist', () => {
    expect(
      applyKeychainSigningSettings({
        DEVELOPMENT_TEAM: 'KAMM5N88X3',
        PRODUCT_NAME: 'Yohaku',
      }),
    ).toEqual({
      CODE_SIGN_INJECT_BASE_ENTITLEMENTS: 'YES',
      DEVELOPMENT_TEAM: 'KAMM5N88X3',
      ENABLE_DEBUG_DYLIB: 'NO',
      ENTITLEMENTS_REQUIRED: 'YES',
      PRODUCT_NAME: 'Yohaku',
    })
  })
})
