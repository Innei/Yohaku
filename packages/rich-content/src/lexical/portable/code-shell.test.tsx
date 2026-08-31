import type { ReactNode } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { CodeShell } from './code-shell'

const host = {
  labels: {
    codeCopied: '已复制',
    codeCopy: '复制',
    codeExpand: '展开 · {count} 行',
    nestedDocCollapse: '',
    nestedDocExpand: '',
    nestedDocLabel: '',
  },
} as unknown as HostCapabilities

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(ui: ReactNode) {
  act(() => {
    root.render(<HostProvider host={host}>{ui}</HostProvider>)
  })
}

const LONG = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n')

describe('CodeShell', () => {
  it('短代码：copy 在头行，没有尾行', () => {
    render(
      <CodeShell code="const a = 1" language="typescript">
        <pre>const a = 1</pre>
      </CodeShell>,
    )
    const head = container.querySelector('.yohaku-code__head')
    expect(head?.textContent).toContain('复制')
    expect(head?.textContent).toContain('TypeScript')
    expect(container.querySelector('.yohaku-code__foot')).toBeNull()
  })

  it('给了 footerName：copy 落尾行，头行不含 copy', () => {
    render(
      <CodeShell
        code="const a = 1"
        footerName="renderer.ts"
        header={<span>tabs</span>}
      >
        <pre>const a = 1</pre>
      </CodeShell>,
    )
    const foot = container.querySelector('.yohaku-code__foot')
    expect(foot?.textContent).toContain('renderer.ts')
    expect(foot?.textContent).toContain('复制')
    expect(container.querySelector('.yohaku-code__head')?.textContent).not.toContain(
      '复制',
    )
  })

  it('超过 20 行：折叠并显示带行数的展开项', () => {
    render(
      <CodeShell code={LONG} language="typescript">
        <pre>{LONG}</pre>
      </CodeShell>,
    )
    expect(container.querySelector('.yohaku-code--collapsed')).not.toBeNull()
    expect(container.querySelector('.yohaku-code__expand')?.textContent).toBe(
      '展开 · 30 行',
    )
  })

  it('点击展开后折叠态消失', () => {
    render(
      <CodeShell code={LONG} language="typescript">
        <pre>{LONG}</pre>
      </CodeShell>,
    )
    const button = container.querySelector<HTMLButtonElement>(
      '.yohaku-code__expand',
    )!
    act(() => button.click())
    expect(container.querySelector('.yohaku-code--collapsed')).toBeNull()
    expect(container.querySelector('.yohaku-code__expand')).toBeNull()
  })

  it('fold=false 不折叠', () => {
    render(
      <CodeShell code={LONG} fold={false} language="typescript">
        <pre>{LONG}</pre>
      </CodeShell>,
    )
    expect(container.querySelector('.yohaku-code--collapsed')).toBeNull()
  })
})
