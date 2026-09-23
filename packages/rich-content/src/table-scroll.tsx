'use client'

import clsx from 'clsx'
import type { HTMLAttributes } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollState {
  canScrollLeft: boolean
  canScrollRight: boolean
  scrollable: boolean
}

const INITIAL_SCROLL_STATE: ScrollState = {
  canScrollLeft: false,
  canScrollRight: false,
  scrollable: false,
}

const getScrollState = (element: HTMLDivElement): ScrollState => {
  const maxScrollLeft = Math.max(element.scrollWidth - element.clientWidth, 0)
  const scrollLeft = Math.max(element.scrollLeft, 0)

  return {
    canScrollLeft: scrollLeft > 1,
    canScrollRight: maxScrollLeft - scrollLeft > 1,
    scrollable: maxScrollLeft > 1,
  }
}

/**
 * Keeps wide tables usable on touch devices and makes the hidden overflow
 * discoverable on platforms with overlay scrollbars.
 */
export const RichTableScroll = ({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState(INITIAL_SCROLL_STATE)

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const nextState = getScrollState(element)
    // Measurement is intentionally driven by the effect's observers.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setScrollState((previousState) => {
      if (
        previousState.canScrollLeft === nextState.canScrollLeft &&
        previousState.canScrollRight === nextState.canScrollRight &&
        previousState.scrollable === nextState.scrollable
      ) {
        return previousState
      }
      return nextState
    })
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateScrollState()
    element.addEventListener('scroll', updateScrollState, { passive: true })

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateScrollState)
    resizeObserver?.observe(element)

    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver(updateScrollState)
    mutationObserver?.observe(element, { childList: true, subtree: true })

    return () => {
      element.removeEventListener('scroll', updateScrollState)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [updateScrollState])

  return (
    <div className={clsx('rich-table-scroll-shell', className)} {...rest}>
      <div
        aria-label={scrollState.scrollable ? '可横向滚动的表格' : undefined}
        className="rich-table-scroll"
        ref={scrollRef}
        role={scrollState.scrollable ? 'region' : undefined}
        tabIndex={scrollState.scrollable ? 0 : undefined}
      >
        {children}
      </div>
      {scrollState.canScrollLeft && (
        <span
          aria-hidden="true"
          className="rich-table-scroll-cue rich-table-scroll-cue-left"
        >
          ←
        </span>
      )}
      {scrollState.canScrollRight && (
        <span
          aria-hidden="true"
          className="rich-table-scroll-cue rich-table-scroll-cue-right"
        >
          →
        </span>
      )}
    </div>
  )
}
