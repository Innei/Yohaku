import type { Lang } from '../i18n'

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

const lines = [
  `@import 'tailwindcss';`,
  `@import '@yohaku/design-system/tokens.css';`,
  ``,
  `html {`,
  `  font-size: 14px;`,
  `}`,
]

const copyLabel: Record<Lang, string> = {
  zh: '复制代码',
  en: 'Copy code',
}

export function CodeBlockSnippet({ lang }: { lang: Lang }) {
  return (
    <figure className="shiki-card">
      <div className="shiki-card__surface">
        <div aria-hidden className="shiki-card__topline" />
        <div className="shiki-card__header">
          <div className="shiki-card__header-left">
            <span aria-hidden className="shiki-card__lang-icon">
              CSS
            </span>
            <span className="shiki-card__filename">tailwindcss.css</span>
          </div>
          <div className="shiki-card__header-right">
            <span className="shiki-card__lang-text">CSS</span>
            <button
              type="button"
              className="shiki-card__copy"
              aria-label={copyLabel[lang]}
              title={copyLabel[lang]}
            >
              <CopyIcon />
            </button>
          </div>
        </div>
        <div aria-hidden className="shiki-card__divider" />
        <pre className="shiki-card__pre">
          <code>
            {lines.map((ln, i) => (
              <span
                key={i}
                className={
                  i === 1
                    ? 'shiki-card__line shiki-card__line--highlighted'
                    : 'shiki-card__line'
                }
              >
                {ln || ' '}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  )
}
