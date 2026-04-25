import { type Lang, t } from '../i18n'

export function Hero({ lang }: { lang: Lang }) {
  return (
    <header className="hero">
      <p className="hero__eyebrow">
        <span className="hero__eyebrow-dot" />
        <span>{t('heroEyebrow', lang)} · 2026.04</span>
      </p>

      <h1 className="hero__title">
        Yohaku<span className="hero__title-cn">余白</span>
      </h1>

      <p className="hero__tagline">{t('heroTagline', lang)}</p>

      <div className="hero__tokens">
        <span>
          <b>{t('heroTokenAccent', lang)}</b>#C56473 · 梅 ume
        </span>
        <span>
          <b>{t('heroTokenNeutral', lang)}</b>n-1…10 · 三档暖色调中性灰
        </span>
        <span>
          <b>{t('heroTokenSerif', lang)}</b>Noto Serif CJK
        </span>
        <span>
          <b>{t('heroTokenMono', lang)}</b>Operator / JetBrains
        </span>
      </div>
    </header>
  )
}
