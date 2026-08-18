import { describe, expect, it } from 'vitest'

import { fallbackMonoFont } from './theme'

describe('fallbackMonoFont', () => {
  it('leads with --app-font-mono so a host can inject Cascadia without forking the stack', () => {
    expect(
      fallbackMonoFont.startsWith(
        "var(--app-font-mono, 'OperatorMonoSSmLig Nerd Font')",
      ),
    ).toBe(true)
    expect(fallbackMonoFont).toContain("'Cascadia Code PL'")
  })
})
