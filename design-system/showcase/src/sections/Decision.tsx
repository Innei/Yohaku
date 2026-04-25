import { type Lang, t } from '../i18n'

const rows: Array<{
  task: { zh: string; en: string }
  how: { zh: string; en: string }
}> = [
  {
    task: { zh: '正文段落', en: 'Body paragraph' },
    how: { zh: 'text-neutral-9', en: 'text-neutral-9' },
  },
  {
    task: { zh: '次要文', en: 'Secondary text' },
    how: { zh: 'text-neutral-7', en: 'text-neutral-7' },
  },
  {
    task: { zh: '小标 / caption', en: 'Caption' },
    how: { zh: 'text-neutral-6 text-sm', en: 'text-neutral-6 text-sm' },
  },
  {
    task: { zh: '标题', en: 'Heading' },
    how: {
      zh: 'text-neutral-10 font-medium · 衬线字体承担层级，不要用合成 bold',
      en: 'text-neutral-10 font-medium · serif carries hierarchy, no synthetic bold',
    },
  },
  {
    task: { zh: '卡片', en: 'Card' },
    how: {
      zh: 'bg-neutral-2 rounded-lg p-4 ring-1 ring-border',
      en: 'bg-neutral-2 rounded-lg p-4 ring-1 ring-border',
    },
  },
  {
    task: { zh: '主按钮', en: 'Primary button' },
    how: {
      zh: 'bg-accent text-white · ≤ 5% 表面',
      en: 'bg-accent text-white · ≤ 5% of surface',
    },
  },
  {
    task: { zh: '次按钮', en: 'Secondary button' },
    how: {
      zh: 'bg-neutral-2 hover:bg-neutral-3 text-neutral-9 ring-1 ring-border',
      en: 'bg-neutral-2 hover:bg-neutral-3 text-neutral-9 ring-1 ring-border',
    },
  },
  {
    task: { zh: '标签 / chip', en: 'Tag / chip' },
    how: {
      zh: 'bg-neutral-2 text-neutral-7 text-xs px-2 py-0.5 rounded-md',
      en: 'bg-neutral-2 text-neutral-7 text-xs px-2 py-0.5 rounded-md',
    },
  },
  {
    task: { zh: '代码块', en: 'Code block' },
    how: {
      zh: 'bg-neutral-1 ring-1 ring-border rounded-md font-mono text-sm',
      en: 'bg-neutral-1 ring-1 ring-border rounded-md font-mono text-sm',
    },
  },
  {
    task: { zh: '引文', en: 'Blockquote' },
    how: {
      zh: 'border-l-2 border-accent text-neutral-7',
      en: 'border-l-2 border-accent text-neutral-7',
    },
  },
  {
    task: { zh: '分隔', en: 'Divider' },
    how: {
      zh: '1px solid var(--color-border) 或 bg-neutral-3 h-px',
      en: '1px solid var(--color-border) or bg-neutral-3 h-px',
    },
  },
]

export function Decision({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('decideNum', lang)}</p>
        <h2 className="section-title">{t('decideTitle', lang)}</h2>
        <p className="section-lede">{t('decideLede', lang)}</p>
      </div>
      <div className="row-list row-list--decision">
        {rows.map((r, i) => (
          <div key={i} className="row-list__row">
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-neutral-10)',
                fontWeight: 500,
              }}
            >
              {r.task[lang]}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                color: 'var(--color-neutral-7)',
                lineHeight: 1.55,
              }}
            >
              {r.how[lang]}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
