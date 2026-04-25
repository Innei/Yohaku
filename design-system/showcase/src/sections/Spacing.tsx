import { type Lang, t } from '../i18n'

const radii = [
  { px: 4, label: { zh: 'rounded · 标签', en: 'rounded · chip' } },
  { px: 6, label: { zh: 'rounded-md · 默认', en: 'rounded-md · default' } },
  { px: 8, label: { zh: 'rounded-lg · 卡片', en: 'rounded-lg · card' } },
  { px: 12, label: { zh: 'rounded-xl · modal', en: 'rounded-xl · modal' } },
  { px: 16, label: { zh: 'rounded-2xl · hero（最大）', en: 'rounded-2xl · hero (cap)' } },
]

export function Spacing({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('spaceNum', lang)}</p>
        <h2 className="section-title">{t('spaceTitle', lang)}</h2>
        <p className="section-lede">{t('spaceLede', lang)}</p>
      </div>

      <h3 className="subhead">{t('radiusHead', lang)}</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {radii.map((r) => (
          <div
            key={r.px}
            style={{
              padding: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              background: 'var(--color-neutral-2)',
              display: 'grid',
              gap: 8,
              placeItems: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: r.px,
                background: 'var(--color-neutral-4)',
              }}
            />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-neutral-9)',
                textAlign: 'center',
              }}
            >
              {r.px}px
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--color-neutral-7)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {r.label[lang]}
            </p>
          </div>
        ))}
      </div>

      <h3 className="subhead">{t('shadowHead', lang)}</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: 'var(--color-paper)',
            boxShadow: 'inset 0 0 0 1px var(--color-border)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
              marginBottom: 8,
            }}
          >
            ring
          </p>
          <p style={{ margin: 0, color: 'var(--color-neutral-9)', lineHeight: 1.55 }}>
            {lang === 'zh'
              ? 'ring-1 ring-border · 没有投影，最常用'
              : 'ring-1 ring-border · no drop, most common'}
          </p>
        </div>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: 'var(--color-paper)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
              marginBottom: 8,
            }}
          >
            whisper
          </p>
          <p style={{ margin: 0, color: 'var(--color-neutral-9)', lineHeight: 1.55 }}>
            {lang === 'zh'
              ? '0 4px 24px / 0.05 · 轻微浮起感'
              : '0 4px 24px / 0.05 · gentle elevation'}
          </p>
        </div>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: 'var(--color-error)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            position: 'relative',
            opacity: 0.9,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              opacity: 0.85,
              marginBottom: 8,
            }}
          >
            anti · hard drop
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            {lang === 'zh' ? '硬投影：禁用，又重又俗' : 'Hard drop shadow: forbidden, heavy'}
          </p>
        </div>
      </div>
    </section>
  )
}
