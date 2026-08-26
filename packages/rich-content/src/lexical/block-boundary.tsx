'use client'
import { sx } from '../lib/sx'
import { atoms } from '../styles/atoms.stylex'

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
      <div {...sx(atoms.my_4, atoms.rounded_lg, atoms.border, atoms.border____color_neutral_3, atoms.px_4, atoms.py_3, atoms.text____color_neutral_7, atoms.text_copy_13)}>
        〔{this.props.label} · 渲染失败，请在网页中查看〕
      </div>
    )
  }
}
