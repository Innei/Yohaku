import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useRouteTransitionSettled } from './use-route-transition-settled'

const navigation = vi.hoisted(() => ({ addListener: vi.fn() }))
vi.mock('expo-router', () => ({ useNavigation: () => navigation }))

let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
let onTransitionEnd: (event: { data: { closing: boolean } }) => void
const unsubscribe = vi.fn()

function Probe({ identity }: { identity: string }) {
  return String(useRouteTransitionSettled(identity))
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  vi.clearAllMocks()
  navigation.addListener.mockImplementation((_event, listener) => {
    onTransitionEnd = listener
    return unsubscribe
  })
  container = document.createElement('div')
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  vi.useRealTimers()
})

it('unblocks queries when presentation emits no event, including reused routes', () => {
  act(() => root.render(createElement(Probe, { identity: 'login' })))
  expect(container.textContent).toBe('false')
  act(() => vi.advanceTimersByTime(1_000))
  expect(container.textContent).toBe('true')

  act(() => root.render(createElement(Probe, { identity: 'insights:en' })))
  expect(container.textContent).toBe('false')
  act(() => vi.advanceTimersByTime(1_000))
  expect(container.textContent).toBe('true')
  expect(unsubscribe).toHaveBeenCalledOnce()
})

it('settles immediately after opening, ignores closing, and cancels pending work', () => {
  act(() => root.render(createElement(Probe, { identity: 'login' })))
  act(() => onTransitionEnd({ data: { closing: true } }))
  expect(container.textContent).toBe('false')
  act(() => onTransitionEnd({ data: { closing: false } }))
  expect(container.textContent).toBe('true')
  expect(vi.getTimerCount()).toBe(0)
  act(() => root.render(createElement(Probe, { identity: 'desk' })))
  act(() => root.render(null))
  expect(vi.getTimerCount()).toBe(0)
})
