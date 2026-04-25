import { type Lang, t } from '../i18n'
import { CodeBlockSnippet } from '../snippets/CodeBlock'
import { CommentThreadSnippet } from '../snippets/CommentThread'
import { FormSnippet } from '../snippets/Form'
import { ModalSnippet } from '../snippets/Modal'
import { SheetSnippet } from '../snippets/Sheet'

type Entry = {
  id: string
  source: string
  tokens: string
  Component: (props: { lang: Lang }) => React.ReactNode
}

const entries: Entry[] = [
  {
    id: 'comment-thread',
    source: 'apps/web · Comment.tsx',
    tokens: '--field-{bg,border,gradient,shadow}, --color-accent, rounded-tl-sm',
    Component: CommentThreadSnippet,
  },
  {
    id: 'form',
    source: 'apps/web · Input.tsx + StyledButton.tsx',
    tokens: '--field-*, --color-accent, rounded-xl',
    Component: FormSnippet,
  },
  {
    id: 'code-block',
    source: 'apps/web · ShikiWrapper.tsx',
    tokens: '--code-accent-{line,soft,tint,icon,foreground}, --color-paper',
    Component: CodeBlockSnippet,
  },
  {
    id: 'modal',
    source: 'apps/web · dialog',
    tokens: '--color-paper, --color-error, btn--secondary, btn--danger',
    Component: ModalSnippet,
  },
  {
    id: 'sheet',
    source: 'apps/web · sheet',
    tokens: '--color-paper, --color-neutral-{4,7,9,10}',
    Component: SheetSnippet,
  },
]

export function Snippets({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('snippetNum', lang)}</p>
        <h2 className="section-title">{t('snippetTitle', lang)}</h2>
        <p className="section-lede">{t('snippetLede', lang)}</p>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {entries.map(({ id, source, tokens, Component }) => (
          <div key={id} className="snippet-frame">
            <header className="snippet-frame__head">
              <span style={{ color: 'var(--color-neutral-9)' }}>{id}</span>
              <span style={{ display: 'none' }}>{source}</span>
              <span>{tokens}</span>
            </header>
            <div className="snippet-frame__body">
              <Component lang={lang} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
