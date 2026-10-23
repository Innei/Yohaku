import { NestedContentRendererProvider } from '@haklex/rich-editor/static'
import type { SerializedEditorState } from 'lexical'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LexicalStepsOverride } from './steps'

const state = (label: string) => ({ label }) as unknown as SerializedEditorState

const renderContent = (value: SerializedEditorState) => (
  <p>{(value as unknown as { label: string }).label}</p>
)

function render(steps: Parameters<typeof LexicalStepsOverride>[0]['steps']) {
  return renderToStaticMarkup(
    <NestedContentRendererProvider value={renderContent}>
      <LexicalStepsOverride steps={steps} />
    </NestedContentRendererProvider>,
  )
}

describe('LexicalStepsOverride', () => {
  it('puts a two-digit number before each title and renders the content', () => {
    const html = render([
      { id: 'a', title: '下载安装', content: state('访问官网') },
      { id: 'b', title: '配置', content: state('填入密钥') },
    ])
    expect(html).toMatch(/rich-steps-yohaku-number">01</)
    expect(html).toMatch(/rich-steps-yohaku-number">02</)
    expect(html).toContain('下载安装')
    expect(html).toContain('填入密钥')
  })

  it('marks only the last step', () => {
    const html = render([
      { id: 'a', title: 'One', content: state('x') },
      { id: 'b', title: 'Two', content: state('y') },
    ])
    expect(html.match(/data-last=""/g)).toHaveLength(1)
    expect(html.indexOf('data-last')).toBeGreaterThan(html.indexOf('One'))
  })

  it('keeps the number when the title is empty', () => {
    const html = render([{ id: 'a', title: '', content: state('x') }])
    expect(html).toMatch(/rich-steps-yohaku-number">01</)
    expect(html).not.toContain('rich-steps-yohaku-title')
  })

  it('renders nothing for an empty list', () => {
    expect(render([])).toBe('')
  })
})
