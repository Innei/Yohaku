import { useLayoutEffect, useRef } from 'react'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DURATION_MS = 360

export function tweenHeight(
  el: HTMLElement,
  from: number,
  to: number,
): Promise<void> {
  if (
    from === to ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    typeof el.animate !== 'function' ||
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  ) {
    return Promise.resolve()
  }

  el.style.height = `${from}px`
  el.style.overflow = 'hidden'

  return new Promise((resolve) => {
    const animation = el.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: DURATION_MS, easing: EASE },
    )
    const finish = () => {
      el.style.height = ''
      el.style.overflow = ''
      resolve()
    }
    animation.addEventListener('finish', finish)
    animation.addEventListener('cancel', finish)
  })
}

export function useExpandHeight(collapsed: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const fromRef = useRef(0)

  useLayoutEffect(() => {
    if (collapsed) return
    const el = ref.current
    const from = fromRef.current
    if (!el || from <= 0) return
    fromRef.current = 0
    void tweenHeight(el, from, el.scrollHeight)
  }, [collapsed])

  return {
    ref,
    capture: () => {
      fromRef.current = ref.current?.getBoundingClientRect().height ?? 0
    },
  }
}
