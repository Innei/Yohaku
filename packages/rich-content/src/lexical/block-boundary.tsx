'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  label: string
}

export class BlockBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="my-4 rounded-lg border border-(--color-neutral-3) px-4 py-3 text-(--color-neutral-7) text-copy-13">
        〔{this.props.label} · 渲染失败，请在网页中查看〕
      </div>
    )
  }
}
