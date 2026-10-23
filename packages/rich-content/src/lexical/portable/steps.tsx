'use client'

import {
  useOptionalNestedContentRenderer,
  useVariant,
} from '@haklex/rich-editor/static'
import type { StepsRendererProps } from '@haklex/rich-ext-steps/node'

export function LexicalStepsOverride({ steps }: StepsRendererProps) {
  const renderNestedContent = useOptionalNestedContentRenderer()
  const variant = useVariant()

  if (steps.length === 0) return null

  return (
    <ol className="rich-steps-yohaku">
      {steps.map((step, index) => (
        <li
          className="rich-steps-yohaku-item"
          data-last={index === steps.length - 1 ? '' : undefined}
          key={step.id}
        >
          <span aria-hidden className="rich-steps-yohaku-dot" />
          <div className="rich-steps-yohaku-head">
            <span className="rich-steps-yohaku-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            {step.title && (
              <span className="rich-steps-yohaku-title">{step.title}</span>
            )}
          </div>
          {renderNestedContent && (
            <div className="rich-steps-yohaku-content">
              {renderNestedContent(step.content, variant)}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
