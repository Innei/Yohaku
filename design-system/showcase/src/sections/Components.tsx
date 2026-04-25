import { type Lang, t } from '../i18n'

function Card({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <article
      style={{
        padding: 20,
        background: 'var(--color-neutral-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        display: 'grid',
        gap: 12,
      }}
    >
      <header>
        <h4
          style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-neutral-10)',
          }}
        >
          {title}
        </h4>
        <p
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--color-neutral-7)',
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      </header>
      <div
        style={{
          padding: 16,
          background: 'var(--color-paper)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
        }}
      >
        {children}
      </div>
    </article>
  )
}

export function Components({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('compNum', lang)}</p>
        <h2 className="section-title">{t('compTitle', lang)}</h2>
        <p className="section-lede">{t('compLede', lang)}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <Card
          title={lang === 'zh' ? '按钮' : 'Buttons'}
          hint="rounded-xl · accent/8 fill · 1px translucent border"
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--primary">
              {lang === 'zh' ? '主按钮' : 'Primary'}
            </button>
            <button className="btn btn--secondary">
              {lang === 'zh' ? '次按钮' : 'Secondary'}
            </button>
            <button className="btn btn--ghost">
              {lang === 'zh' ? '幽灵' : 'Ghost'}
            </button>
          </div>
        </Card>

        <Card title={lang === 'zh' ? '标签' : 'Tags'} hint="bg-neutral-2 · text-xs">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['design', 'tokens', 'mockup'].map((tag) => (
              <span
                key={tag}
                style={{
                  background: 'var(--color-neutral-2)',
                  color: 'var(--color-neutral-7)',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </Card>

        <Card
          title={lang === 'zh' ? '引文' : 'Blockquote'}
          hint="border-l accent · text-neutral-7"
        >
          <blockquote
            style={{
              margin: 0,
              padding: '4px 0 4px 16px',
              borderLeft: '2px solid var(--color-accent)',
              color: 'var(--color-neutral-7)',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            {lang === 'zh'
              ? '一千次「不」，方有一次「是」。'
              : 'A thousand no’s for every yes.'}
          </blockquote>
        </Card>

        <Card title={lang === 'zh' ? '指标' : 'Metric'} hint="serif · tabular-nums">
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { v: '128', l: lang === 'zh' ? '文章' : 'Posts' },
              { v: '1', l: lang === 'zh' ? '主色' : 'Accent' },
              { v: '10', l: lang === 'zh' ? '戒律' : 'Rules' },
            ].map((m) => (
              <div key={m.l}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    color: 'var(--color-neutral-10)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.v}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--color-neutral-7)',
                  }}
                >
                  {m.l}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={lang === 'zh' ? '虚划列表' : 'Dash List'}
          hint="dash bullet · editorial"
        >
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 6,
              color: 'var(--color-neutral-9)',
              lineHeight: 1.55,
            }}
          >
            {(lang === 'zh'
              ? ['色不溢于五分', '硬阴影禁', '中文不施合成 bold']
              : ['Accent ≤ 5%', 'No hard drop shadows', 'No synthetic bold for CJK']
            ).map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '16px 1fr',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--color-neutral-5)' }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={lang === 'zh' ? 'Inline 代码' : 'Inline code'}
          hint="bg-neutral-2 · font-mono"
        >
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--color-neutral-9)' }}>
            {lang === 'zh' ? '执 ' : 'Use '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                padding: '1px 6px',
                borderRadius: 3,
                background: 'var(--color-neutral-2)',
                color: 'var(--color-neutral-9)',
              }}
            >
              text-neutral-9
            </code>
            {lang === 'zh' ? ' 为正文默认色。' : ' as the default body color.'}
          </p>
        </Card>
      </div>
    </section>
  )
}
