import { type Lang, t } from '../i18n'

type Family = {
  glyph: string
  family: string
  role: { zh: string; en: string }
  stack: string
  use: { zh: string; en: string }
}

const families: Family[] = [
  {
    glyph: 'Aa',
    family: 'var(--font-sans)',
    role: { zh: 'Sans · UI 主体', en: 'Sans · UI default' },
    stack: 'Inter → PingFang SC → Microsoft YaHei → Noto Sans SC',
    use: {
      zh: 'UI 主体、按钮、列表、表单。Inter（变量字体）+ 完整中文回退链。',
      en: 'UI body, buttons, lists, forms. Inter (var) + full CJK fallback chain.',
    },
  },
  {
    glyph: '宋',
    family: 'var(--font-serif)',
    role: { zh: 'Serif · 标题 / 长文正文', en: 'Serif · Headings / long-form' },
    stack: 'Noto Serif CJK SC → Source Han Serif → SongTi SC → Georgia',
    use: {
      zh: 'Hero 标题、长文正文、引文。中日文优先用 Noto Serif CJK。',
      en: 'Hero titles, long-form body, pull quotes. Noto Serif CJK leads CJK rendering.',
    },
  },
  {
    glyph: '</>',
    family: 'var(--font-mono)',
    role: { zh: 'Mono · 代码 / 元数据', en: 'Mono · Code / metadata' },
    stack: 'Operator Mono → JetBrains Mono → Fira Code → Consolas',
    use: {
      zh: '代码块、版本号、hex 色值、表格里需要等宽对齐的数字。',
      en: 'Code blocks, version numbers, hex values, tabular figures.',
    },
  },
]

const scale = [
  { label: 'text-4xl', size: '2.25rem', weight: 500, line: 1.1, role: { zh: 'Hero 标题', en: 'Hero title' } },
  { label: 'text-3xl', size: '1.875rem', weight: 500, line: 1.15, role: { zh: 'H1 / 文章标题', en: 'H1 / article title' } },
  { label: 'text-2xl', size: '1.5rem', weight: 500, line: 1.2, role: { zh: 'H2 / 节标题', en: 'H2 / section heading' } },
  { label: 'text-xl', size: '1.25rem', weight: 500, line: 1.3, role: { zh: 'H3 / 弹框标题', en: 'H3 / modal heading' } },
  { label: 'text-lg', size: '1.125rem', weight: 400, line: 1.55, role: { zh: '导读段', en: 'Lead paragraph' } },
  { label: 'text-base', size: '1rem', weight: 400, line: 1.55, role: { zh: 'UI / 正文默认', en: 'UI / body default' } },
  { label: 'text-sm', size: '0.875rem', weight: 400, line: 1.5, role: { zh: '次要文本 / 元数据', en: 'Secondary / metadata' } },
  { label: 'text-xs', size: '0.75rem', weight: 600, line: 1.4, role: { zh: '小帽子文字 / 标签', en: 'Eyebrow / label' } },
]

export function Typography({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('typeNum', lang)}</p>
        <h2 className="section-title">{t('typeTitle', lang)}</h2>
        <p className="section-lede">{t('typeLede', lang)}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {families.map((f) => (
          <article
            key={f.family}
            style={{
              padding: 20,
              background: 'var(--color-neutral-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              display: 'grid',
              gap: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: f.family,
                fontSize: '3rem',
                fontWeight: 500,
                lineHeight: 1,
                color: 'var(--color-neutral-10)',
              }}
            >
              {f.glyph}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-accent)',
                letterSpacing: '0.04em',
              }}
            >
              {f.role[lang]}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--color-neutral-7)',
                lineHeight: 1.5,
              }}
            >
              {f.stack}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--color-neutral-9)',
                lineHeight: 1.55,
              }}
            >
              {f.use[lang]}
            </p>
          </article>
        ))}
      </div>

      <h3 className="subhead" style={{ marginTop: 32 }}>
        {t('typeScaleHead', lang)}
      </h3>
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {scale.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 160px',
              gap: 16,
              padding: '14px 16px',
              borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
              alignItems: 'baseline',
            }}
          >
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-accent)',
              }}
            >
              {s.label}
            </code>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: s.size,
                fontWeight: s.weight,
                lineHeight: s.line,
                color: 'var(--color-neutral-10)',
              }}
            >
              {s.role[lang]}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-neutral-7)',
                textAlign: 'right',
              }}
            >
              {s.size} · {s.weight} · {s.line}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
