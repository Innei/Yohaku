import type { Lang } from '../i18n'

const text = {
  zh: {
    title: '确定要删除这条内容吗？',
    body: '删除之后无法恢复。已经有 3 个人回复过这条内容，删除后他们的评论也会一起消失。',
    cancel: '取消',
    confirm: '删除',
  },
  en: {
    title: 'Delete this entry?',
    body: 'This cannot be undone. Three people have replied to this — their comments will also be removed.',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
} as const

export function ModalSnippet({ lang }: { lang: Lang }) {
  const t = text[lang]
  return (
    <div
      style={{
        position: 'relative',
        height: 360,
        borderRadius: 12,
        overflow: 'hidden',
        background:
          'repeating-linear-gradient(45deg, var(--color-neutral-2) 0 8px, var(--color-neutral-1) 8px 16px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--color-neutral-10) 40%, transparent)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{
            width: 'min(560px, calc(100% - 32px))',
            background: 'var(--color-paper)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
            padding: 24,
            display: 'grid',
            gap: 16,
          }}
        >
          <header>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'var(--color-neutral-10)',
              }}
            >
              {t.title}
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--color-neutral-7)',
                lineHeight: 1.55,
              }}
            >
              {t.body}
            </p>
          </header>
          <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn--secondary">{t.cancel}</button>
            <button className="btn btn--danger">{t.confirm}</button>
          </footer>
        </div>
      </div>
    </div>
  )
}
