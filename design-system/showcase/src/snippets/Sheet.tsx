import type { Lang } from '../i18n'

const text = {
  zh: {
    title: '分享这条内容',
    body: '选择一种分享方式。',
    items: ['复制链接', '分享到 Twitter', '导出为 markdown'],
  },
  en: {
    title: 'Share this entry',
    body: 'Pick one of the options below.',
    items: ['Copy link', 'Share to Twitter', 'Export as markdown'],
  },
} as const

export function SheetSnippet({ lang }: { lang: Lang }) {
  const t = text[lang]
  const itemStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '12px 16px',
    color: 'var(--color-neutral-9)',
    font: 'inherit',
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 'clamp(340px, 64vw, 420px)',
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
          background: 'color-mix(in srgb, var(--color-neutral-10) 30%, transparent)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--color-paper)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: '12px 24px 32px',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.05)',
            maxHeight: '75%',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: 'var(--color-neutral-4)',
              borderRadius: 2,
              margin: '0 auto 16px',
            }}
          />
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '1.125rem',
              fontWeight: 500,
              color: 'var(--color-neutral-10)',
            }}
          >
            {t.title}
          </h2>
          <p style={{ margin: '0 0 16px', color: 'var(--color-neutral-7)', lineHeight: 1.55 }}>
            {t.body}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {t.items.map((item) => (
              <li key={item}>
                <button style={itemStyle}>{item}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
