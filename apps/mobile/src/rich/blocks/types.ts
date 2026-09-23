import type { ReactNode } from 'react'

export interface BlockProps {
  blockId: string
  children?: ReactNode
  gallery?: string[]
  node: Record<string, unknown> & { type: string }
}

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
