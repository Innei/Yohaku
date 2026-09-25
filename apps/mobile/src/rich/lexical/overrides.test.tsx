import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import { RunMarker } from './markers'
import { nativeBuiltinOverrides } from './overrides'

describe('nativeBuiltinOverrides.footnote', () => {
  it('emits a superscript run tagged with its identifier', () => {
    const element = nativeBuiltinOverrides.footnote!(
      { type: 'footnote', identifier: 'note-a' } as never,
      'k',
      null,
      () => null,
    )
    expect(isValidElement(element) && element.type).toBe(RunMarker)
    expect((element as { props: { run: unknown } }).props.run).toEqual({
      footnote: 'note-a',
      sup: true,
      text: 'note-a',
    })
  })
})

describe('nativeBuiltinOverrides.katex-inline', () => {
  it('emits a math run carrying the TeX source', () => {
    const element = nativeBuiltinOverrides['katex-inline']!(
      { type: 'katex-inline', equation: 'e^{i\\pi}' } as never,
      'k',
      null,
      () => null,
    )
    expect((element as { props: { run: unknown } }).props.run).toEqual({
      math: true,
      text: 'e^{i\\pi}',
    })
  })
})
