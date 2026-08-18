import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../../host'
import { StaticExcalidraw } from './StaticExcalidraw'

const host: HostCapabilities = {
  apiBase: 'https://example.com/api',
  fetchJSON: async () => ({}) as never,
  labels: {
    nestedDocCollapse: '收起',
    nestedDocExpand: '展开',
    nestedDocLabel: '嵌套文档',
  },
  nestedDocPresentation: 'inline',
  openImage: () => {},
  openLink: () => {},
  scrollToAnchor: () => {},
  theme: 'light',
  webOrigin: 'https://example.com',
}

const inline = JSON.stringify({
  appState: {},
  elements: [
    {
      backgroundColor: '#fff',
      fillStyle: 'solid',
      height: 20,
      id: 'r',
      opacity: 100,
      roughness: 1,
      seed: 1,
      strokeColor: '#000',
      strokeStyle: 'solid',
      strokeWidth: 1,
      type: 'rectangle',
      width: 20,
      x: 0,
      y: 0,
    },
  ],
  files: {},
})

describe('StaticExcalidraw', () => {
  let mountEl: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
    Reflect.deleteProperty(
      window as unknown as { ReactNativeWebView?: unknown },
      'ReactNativeWebView',
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
    Reflect.deleteProperty(
      window as unknown as { ReactNativeWebView?: unknown },
      'ReactNativeWebView',
    )
  })

  it('does not wait for IntersectionObserver inside a React Native WebView', async () => {
    Object.defineProperty(window, 'ReactNativeWebView', {
      configurable: true,
      value: { postMessage: () => {} },
    })

    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <div style={{ width: 320, height: 180 }}>
            <StaticExcalidraw data={inline} />
          </div>
        </HostProvider>,
      )
    })

    expect(mountEl.textContent).not.toContain('Whiteboard')
    expect(mountEl.querySelector('.group\\/excalidraw')).not.toBeNull()
  })
})
