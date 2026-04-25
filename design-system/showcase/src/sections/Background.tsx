import { type Lang, t } from '../i18n'

const story: Record<Lang, string[]> = {
  zh: [
    'Yohaku（余白）来自日语「留白」的意思。一种主色（梅红）、三档暖灰、零冷色——这是这套系统想达到的样子。',
    '思路受 Kami 设计系统启发：用一份小而稳的约定，让 AI 协作时代下每一次 mockup 和 React 组件都落在同一种形态里。token 单一来源，约定不漂移。',
    '这个 showcase 就是这份约定的活样本：静态 `tokens.css` 来自 packages/design-system，运行时主色由 apps/web 注入。AI 读完 SKILL.md 就知道什么时候该写 mockup、什么时候该写 React、什么时候只是核对 token。',
  ],
  en: [
    'Yohaku (余白) means "blank space" in Japanese. One ume accent, three tiers of warm gray, zero cool tones — that is the look this private blog reaches for.',
    'Inspired by the Kami design system: a small, durable contract lets every mockup and React component in the AI-collaboration era land in the same form. Tokens have one source, the contract does not drift.',
    'This showcase is the living proof: static `tokens.css` ships from packages/design-system, runtime accent injects from apps/web. AI reads SKILL.md to know when to mockup, when to write React, and when to merely audit tokens.',
  ],
}

export function Background({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('bgNum', lang)}</p>
        <h2 className="section-title">{t('bgTitle', lang)}</h2>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: '64ch',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          color: 'var(--color-neutral-9)',
        }}
      >
        {story[lang].map((p, i) => (
          <p key={i} style={{ margin: 0 }}>
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
