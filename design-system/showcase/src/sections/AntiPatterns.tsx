import { type Lang, t } from '../i18n'

type Pair = {
  dont: { zh: string; en: string }
  do: { zh: string; en: string }
}

const pairs: Pair[] = [
  {
    dont: {
      zh: '使用 text-neutral-500 这种 Tailwind 默认色。颜色寡淡、偏冷。',
      en: 'Use Tailwind default text-neutral-500 etc. The hue feels thin and cool.',
    },
    do: {
      zh: '使用 text-neutral-7（#5C5C5C）。verify 脚本会自动拒绝前者。',
      en: 'Use text-neutral-7 (#5C5C5C). The verify script rejects the former.',
    },
  },
  {
    dont: {
      zh: '给中文加合成 bold（font-bold = 700）。中文字体大多没有 700 字重，浏览器自己描出来会模糊。',
      en: 'Synthetic bold on CJK text (font-bold = 700). CJK fonts rarely ship 700 — the browser fakes it, blurring strokes.',
    },
    do: {
      zh: 'font-medium（500）就是上限。或者换成衬线字体，让字形本身承担层级。',
      en: 'font-medium (500) is the cap. Or switch to serif so the form carries hierarchy.',
    },
  },
  {
    dont: {
      zh: '硬阴影 box-shadow: 0 8px 24px rgba(0,0,0,0.3)。视觉太重，打印出来会糊成一团。',
      en: 'Hard drop shadow box-shadow: 0 8px 24px rgba(0,0,0,0.3). Visually heavy, prints as a dark blob.',
    },
    do: {
      zh: '用 ring-1 ring-border，或者用淡阴影 0 4px 24px rgba(0,0,0,0.05)。',
      en: 'ring-1 ring-border, or whisper 0 4px 24px rgba(0,0,0,0.05).',
    },
  },
  {
    dont: {
      zh: 'inline style={{ color: "#242424" }} —— 绕过了 token 约定，难以审计。',
      en: 'inline style={{ color: "#242424" }} — bypasses the contract, audits become harder.',
    },
    do: {
      zh: 'className="text-neutral-9"。token 就是约定。',
      en: 'className="text-neutral-9". Tokens are the contract.',
    },
  },
]

export function AntiPatterns({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('antiNum', lang)}</p>
        <h2 className="section-title">{t('antiTitle', lang)}</h2>
        <p className="section-lede">{t('antiLede', lang)}</p>
      </div>

      <div className="anti-list">
        {pairs.map((p, i) => (
          <div key={i} className="anti-list__row">
            <div className="anti-list__cell anti-list__cell--dont">
              <p className="anti-list__label">{t('antiDontLabel', lang)}</p>
              <p className="anti-list__text">{p.dont[lang]}</p>
            </div>
            <div className="anti-list__cell anti-list__cell--do">
              <p className="anti-list__label">{t('antiDoLabel', lang)}</p>
              <p className="anti-list__text">{p.do[lang]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
