import type { Lang } from '../i18n'

const text = {
  zh: {
    name: '姓名',
    namePlaceholder: '怎么称呼你',
    email: '邮箱',
    emailHint: '(不公开)',
    body: '内容',
    bodyPlaceholder: '写下你的想法',
    submit: '发表',
  },
  en: {
    name: 'Name',
    namePlaceholder: 'What should we call you',
    email: 'Email',
    emailHint: '(not public)',
    body: 'Message',
    bodyPlaceholder: 'Write your thoughts',
    submit: 'Post',
  },
} as const

export function FormSnippet({ lang }: { lang: Lang }) {
  const t = text[lang]
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: 'grid', gap: 16, maxWidth: 480 }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <label className="field-label" htmlFor="comment-name">
          {t.name}
        </label>
        <div className="field">
          <input id="comment-name" type="text" placeholder={t.namePlaceholder} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label className="field-label" htmlFor="comment-mail">
          {t.email}{' '}
          <span style={{ color: 'var(--color-neutral-6)', fontWeight: 400 }}>
            {t.emailHint}
          </span>
        </label>
        <div className="field">
          <input id="comment-mail" type="email" placeholder="you@example.com" />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label className="field-label" htmlFor="comment-body">
          {t.body}
        </label>
        <div className="field">
          <textarea
            id="comment-body"
            rows={4}
            placeholder={t.bodyPlaceholder}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary">
          {t.submit}
        </button>
      </div>
    </form>
  )
}
