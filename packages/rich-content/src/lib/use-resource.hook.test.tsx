import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  __listenerCount,
  __resetResourceCache,
  invalidateResource,
  type ResourceState,
  useResource,
} from './use-resource'

let mountEl: HTMLDivElement
let root: Root

beforeEach(() => {
  __resetResourceCache()
  mountEl = document.createElement('div')
  document.body.append(mountEl)
  root = createRoot(mountEl)
})

afterEach(() => {
  act(() => root.unmount())
  mountEl.remove()
})

async function flush(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

function Probe({
  fetcher,
  onState,
  resourceKey,
}: {
  fetcher: () => Promise<string>
  onState: (state: ResourceState<string>) => void
  resourceKey: string | null
}) {
  onState(useResource(resourceKey, fetcher))
  return null
}

it('refetches on a fresh mount after a previous mount errored', async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('boom 1'))
    .mockRejectedValueOnce(new Error('boom 2'))
    .mockRejectedValueOnce(new Error('boom 3'))
    .mockResolvedValueOnce('value')

  await act(async () => {
    root.render(<Probe fetcher={fetcher} resourceKey="k" onState={() => {}} />)
  })
  await flush(150)
  expect(fetcher).toHaveBeenCalledTimes(3)

  act(() => root.unmount())
  const root2 = createRoot(mountEl)
  const states: ResourceState<string>[] = []
  await act(async () => {
    root2.render(
      <Probe
        fetcher={fetcher}
        resourceKey="k"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush()

  expect(fetcher).toHaveBeenCalledTimes(4)
  expect(states.at(-1)?.data).toBe('value')
  expect(states.at(-1)?.error).toBeUndefined()
  act(() => root2.unmount())
})

it('resolves without ever exposing an error state when a fetch fails twice then succeeds', async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('transient 1'))
    .mockRejectedValueOnce(new Error('transient 2'))
    .mockResolvedValueOnce('value')
  const states: ResourceState<string>[] = []

  await act(async () => {
    root.render(
      <Probe
        fetcher={fetcher}
        resourceKey="k"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush(150)

  expect(fetcher).toHaveBeenCalledTimes(3)
  expect(states.every((s) => s.error === undefined)).toBe(true)
  expect(states.at(-1)?.data).toBe('value')
  expect(states.at(-1)?.isLoading).toBe(false)
})

it('settles into an error state (not an infinite loop) when every attempt fails', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('always fails'))
  const states: ResourceState<string>[] = []

  await act(async () => {
    root.render(
      <Probe
        fetcher={fetcher}
        resourceKey="k"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush(150)

  expect(fetcher).toHaveBeenCalledTimes(3)
  expect(states.at(-1)?.error).toBeInstanceOf(Error)
  expect(states.at(-1)?.isLoading).toBe(false)
})

it('serves a resolved key from cache on a second mount without refetching', async () => {
  const fetcher = vi.fn(async () => 'value')

  await act(async () => {
    root.render(<Probe fetcher={fetcher} resourceKey="k" onState={() => {}} />)
  })
  await flush()
  expect(fetcher).toHaveBeenCalledOnce()

  act(() => root.unmount())
  const root2 = createRoot(mountEl)
  const states: ResourceState<string>[] = []
  await act(async () => {
    root2.render(
      <Probe
        fetcher={fetcher}
        resourceKey="k"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush()

  expect(fetcher).toHaveBeenCalledOnce()
  expect(states.at(-1)?.data).toBe('value')
  expect(states.at(-1)?.isLoading).toBe(false)
  act(() => root2.unmount())
})

it('fetches the new key when key changes', async () => {
  const fetcher = vi.fn(async (k: string) => `value-${k}`)
  const states: ResourceState<string>[] = []

  await act(async () => {
    root.render(
      <Probe
        fetcher={() => fetcher('a')}
        resourceKey="a"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush()
  expect(fetcher).toHaveBeenCalledWith('a')

  await act(async () => {
    root.render(
      <Probe
        fetcher={() => fetcher('b')}
        resourceKey="b"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush()

  expect(fetcher).toHaveBeenCalledWith('b')
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(states.at(-1)?.data).toBe('value-b')
})

it('does not throw and cleans up its listener when unmounted mid-flight', async () => {
  let resolveFetch: (value: string) => void = () => {}
  const fetcher = vi.fn(
    () =>
      new Promise<string>((resolve) => {
        resolveFetch = resolve
      }),
  )

  await act(async () => {
    root.render(<Probe fetcher={fetcher} resourceKey="k" onState={() => {}} />)
  })

  expect(__listenerCount('k')).toBe(1)
  expect(() => act(() => root.unmount())).not.toThrow()
  expect(__listenerCount('k')).toBe(0)

  await act(async () => {
    resolveFetch('value')
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
})

it('invalidateResource causes a subsequent mount to refetch', async () => {
  const fetcher = vi.fn(async () => 'value')

  await act(async () => {
    root.render(<Probe fetcher={fetcher} resourceKey="k" onState={() => {}} />)
  })
  await flush()
  expect(fetcher).toHaveBeenCalledOnce()

  act(() => root.unmount())
  invalidateResource('k')

  const root2 = createRoot(mountEl)
  const states: ResourceState<string>[] = []
  await act(async () => {
    root2.render(
      <Probe
        fetcher={fetcher}
        resourceKey="k"
        onState={(s) => states.push(s)}
      />,
    )
  })
  await flush()

  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(states.at(-1)?.data).toBe('value')
  act(() => root2.unmount())
})
