import { describe, expect, it } from 'vitest'

import { patchPodfile } from './with-ios-mermaid-pods.cjs'

const bare = `target 'Yohaku' do
  use_react_native!(
    :path => config[:reactNativePath],
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
    )
  end
end
`

const count = (src: string, needle: string) => src.split(needle).length - 1

describe('patchPodfile', () => {
  it('adds the mermaid and math pods after use_react_native!', () => {
    const src = patchPodfile(bare)
    expect(count(src, "pod 'BeautifulMermaid'")).toBe(1)
    expect(count(src, "pod 'SwiftMath'")).toBe(1)
    expect(src.indexOf("pod 'SwiftMath'")).toBeGreaterThan(
      src.indexOf('use_react_native!'),
    )
  })

  it('adds the math pod to a Podfile that already carries mermaid, once', () => {
    const withMermaid = patchPodfile(bare).replace(
      /\n {2}pod 'SwiftMath'[^\n]*/,
      '',
    )
    expect(withMermaid).not.toContain("pod 'SwiftMath'")
    const once = patchPodfile(withMermaid)
    expect(count(once, "pod 'SwiftMath'")).toBe(1)
    expect(patchPodfile(once)).toBe(once)
  })
})
