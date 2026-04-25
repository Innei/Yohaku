import { type Lang, t } from '../i18n'

const rules = {
  zh: [
    '中性灰分三档：1–4 用作表面，5–7 用作边框和图标，8–10 用作正文和标题',
    'n-5 不能作为文本色；n-6 只能用在很小的标签上；n-7 才开始适合做次要文本',
    '禁止使用 Tailwind 默认的 `neutral-50…950`，verify 脚本会自动拦截',
    '主色在界面上不超过 5%，留给 CTA、focus 状态和品牌标识',
    '正文默认用 n-9，深色模式自动反转',
    '字体只有三族：sans / serif / mono，每一族都必须带 CJK 回退链',
    '禁用硬阴影，深度通过描边或淡阴影表现',
    '圆角最大用到 rounded-2xl（16px），再大就只是装饰',
    '中文不要用合成 bold，font-medium（500）就是上限',
    'mockup HTML 必须 @import tokens.css，不能直接写 hex 值',
  ],
  en: [
    'Three neutral tiers: 1–4 surface, 5–7 border/icon, 8–10 body/heading',
    'n-5 never as text; n-6 only for tiny labels; n-7 for secondary text',
    'Tailwind `neutral-50…950` is banned; the verify script rejects it',
    'Accent ≤ 5% of any surface; reserved for CTA, focus, brand mark',
    'Body color defaults to n-9; dark mode auto-inverts',
    'Three font roles only: sans / serif / mono, with mandatory CJK fallback',
    'Hard drop shadows forbidden; depth via ring or whisper shadow',
    'Border radius caps at rounded-2xl (16px); beyond reads decorative',
    'No synthetic bold for CJK; font-medium (500) is the cap',
    'Mockup HTML must @import tokens.css; raw hex outside contract is a lint failure',
  ],
}

export function Manifesto({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('manifestoNum', lang)}</p>
        <h2 className="section-title">{t('manifestoTitle', lang)}</h2>
        <p className="section-lede">{t('manifestoLede', lang)}</p>
      </div>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '12px 24px',
        }}
      >
        {rules[lang].map((r, i) => (
          <li
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr',
              gap: 12,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-accent)',
                fontWeight: 600,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p
              style={{
                margin: 0,
                color: 'var(--color-neutral-9)',
                lineHeight: 1.55,
              }}
            >
              {r}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
