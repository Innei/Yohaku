import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { YohakuCodeSnippet } from './code-snippet'

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

const FILES = [
  { code: 'const a = 1', filename: 'renderer.ts', language: 'typescript' },
  { code: 'const b = 2', filename: 'Host.tsx', language: 'tsx' },
]

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

function render(files = FILES) {
  act(() => {
    root.render(
      <HostProvider host={host}>
        <YohakuCodeSnippet files={files} />
      </HostProvider>,
    )
  })
}

describe('YohakuCodeSnippet', () => {
  it('tabs 独占头行，尾行重复当前文件名', () => {
    render()
    expect(container.querySelectorAll('.yohaku-code__tab')).toHaveLength(2)
    expect(container.querySelector('.yohaku-code__foot-name')?.textContent).toBe(
      'renderer.ts',
    )
  })

  it('首个 tab 默认激活', () => {
    render()
    const active = container.querySelector('.yohaku-code__tab--active')
    expect(active?.textContent).toContain('renderer.ts')
  })

  it('切 tab 换代码并换尾行名字', () => {
    render()
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      '.yohaku-code__tab',
    )
    act(() => tabs[1].click())
    expect(container.querySelector('.yohaku-code__foot-name')?.textContent).toBe(
      'Host.tsx',
    )
    expect(
      container.querySelector('.yohaku-code__tab--active')?.textContent,
    ).toContain('Host.tsx')
  })

  it('复制的是当前 tab 的代码', () => {
    render()
    const copied: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          copied.push(text)
          return Promise.resolve()
        },
      },
    })
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      '.yohaku-code__tab',
    )
    act(() => tabs[1].click())
    act(() => {
      container.querySelector<HTMLButtonElement>('.yohaku-code__copy')!.click()
    })
    expect(copied).toEqual(['const b = 2'])
  })

  it('空 files 不渲染', () => {
    render([])
    expect(container.querySelector('.yohaku-code')).toBeNull()
  })
})
