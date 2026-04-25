import { type Lang, t } from '../i18n'

type SwatchData = {
  v: string
  hex: string
  name: { zh: string; en: string }
  role: { zh: string; en: string }
  modifier?: 'accent'
}

const neutrals: SwatchData[] = [
  {
    v: '--color-neutral-1',
    hex: '#F9F8F5',
    name: { zh: 'n-1', en: 'n-1' },
    role: { zh: '页底 / 最浅填充', en: 'Page bg / lightest fill' },
  },
  {
    v: '--color-neutral-2',
    hex: '#F0EFEB',
    name: { zh: 'n-2', en: 'n-2' },
    role: { zh: '卡片底', en: 'Card bg' },
  },
  {
    v: '--color-neutral-3',
    hex: '#E3E1DB',
    name: { zh: 'n-3', en: 'n-3' },
    role: { zh: '微填充 / hover', en: 'Subtle fill / hover' },
  },
  {
    v: '--color-neutral-4',
    hex: '#D0CEC6',
    name: { zh: 'n-4', en: 'n-4' },
    role: { zh: '强填充', en: 'Strong fill' },
  },
  {
    v: '--color-neutral-5',
    hex: '#A8A69F',
    name: { zh: 'n-5', en: 'n-5' },
    role: { zh: '边框（不能作文本色）', en: 'Border, never text' },
  },
  {
    v: '--color-neutral-6',
    hex: '#787670',
    name: { zh: 'n-6', en: 'n-6' },
    role: { zh: '图标 / 小标签', en: 'Icon / tiny label' },
  },
  {
    v: '--color-neutral-7',
    hex: '#5C5A55',
    name: { zh: 'n-7', en: 'n-7' },
    role: { zh: '次要文本', en: 'Secondary text' },
  },
  {
    v: '--color-neutral-8',
    hex: '#403F3A',
    name: { zh: 'n-8', en: 'n-8' },
    role: { zh: '加强的次要文本', en: 'Strong secondary' },
  },
  {
    v: '--color-neutral-9',
    hex: '#24231F',
    name: { zh: 'n-9 · 正文', en: 'n-9 · body' },
    role: { zh: '正文（默认）', en: 'Body (default)' },
  },
  {
    v: '--color-neutral-10',
    hex: '#141312',
    name: { zh: 'n-10 · 标题', en: 'n-10 · heading' },
    role: { zh: '标题 / 最强调', en: 'Heading / max emphasis' },
  },
]

const accent: SwatchData[] = [
  {
    v: '--color-accent',
    hex: '#C56473',
    name: { zh: '梅 ume', en: 'Ume' },
    role: { zh: 'CTA · focus · 引文边 · 不超过 5%', en: 'CTA · focus · quote bar · ≤ 5%' },
    modifier: 'accent',
  },
]

const semantics: SwatchData[] = [
  {
    v: '--color-info',
    hex: '#3D6896',
    name: { zh: '縹 hanada', en: '縹 hanada' },
    role: { zh: '信息状态', en: 'Informational' },
  },
  {
    v: '--color-success',
    hex: '#5E9F7E',
    name: { zh: '若竹 wakatake', en: '若竹 wakatake' },
    role: { zh: '成功状态', en: 'Success' },
  },
  {
    v: '--color-warning',
    hex: '#A87A3D',
    name: { zh: '朽葉 kuchiba', en: '朽葉 kuchiba' },
    role: { zh: '警告状态', en: 'Warning' },
  },
  {
    v: '--color-error',
    hex: '#A64953',
    name: { zh: '蘇芳 suoh', en: '蘇芳 suoh' },
    role: { zh: '错误 / 破坏性操作', en: 'Error / destructive' },
  },
]

function Swatch({ data, lang }: { data: SwatchData; lang: Lang }) {
  const className = `swatch${data.modifier ? ` swatch--${data.modifier}` : ''}`
  return (
    <div className={className}>
      <div className="swatch__chip" style={{ background: `var(${data.v})` }} />
      <div className="swatch__info">
        <p className="swatch__name">{data.name[lang]}</p>
        <p className="swatch__role">{data.role[lang]}</p>
        <span className="swatch__hex">{data.hex}</span>
      </div>
    </div>
  )
}

export function Color({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('colorNum', lang)}</p>
        <h2 className="section-title">{t('colorTitle', lang)}</h2>
        <p className="section-lede">{t('colorLede', lang)}</p>
      </div>

      <h3 className="subhead">{t('colorNeutralHead', lang)}</h3>
      <div className="swatches">
        {neutrals.map((s) => (
          <Swatch key={s.v} data={s} lang={lang} />
        ))}
      </div>

      <h3 className="subhead">{t('colorAccentHead', lang)}</h3>
      <div className="swatches">
        {accent.map((s) => (
          <Swatch key={s.v} data={s} lang={lang} />
        ))}
        <div className="swatch">
          <div
            className="swatch__chip"
            style={{
              background:
                'linear-gradient(135deg, var(--color-accent), color-mix(in oklch, var(--color-accent) 60%, var(--color-neutral-1)))',
            }}
          />
          <div className="swatch__info">
            <p className="swatch__name">--a (runtime)</p>
            <p className="swatch__role">
              {lang === 'zh'
                ? '由 AccentColorStyleInjector 在运行时注入'
                : 'Injected by AccentColorStyleInjector'}
            </p>
            <span className="swatch__hex">OKLCH</span>
          </div>
        </div>
      </div>

      <h3 className="subhead">{t('colorSemanticHead', lang)}</h3>
      <div className="swatches">
        {semantics.map((s) => (
          <Swatch key={s.v} data={s} lang={lang} />
        ))}
      </div>
    </section>
  )
}
