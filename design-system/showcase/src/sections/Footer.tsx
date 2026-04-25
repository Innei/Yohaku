import { type Lang, t } from '../i18n'

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer
      style={{
        marginTop: 48,
        paddingTop: 32,
        borderTop: '1px solid var(--color-border)',
        display: 'grid',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'var(--color-neutral-2)',
            border: '1px solid var(--color-border)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 500,
            color: 'var(--color-neutral-10)',
          }}
        >
          余
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: '1.125rem',
              fontWeight: 500,
              color: 'var(--color-neutral-10)',
            }}
          >
            Yohaku · 余白
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.8125rem',
              color: 'var(--color-neutral-7)',
            }}
          >
            @yohaku/design-system
          </p>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-serif)',
          color: 'var(--color-neutral-7)',
          lineHeight: 1.55,
        }}
      >
        {t('footerLine', lang)}
      </p>
    </footer>
  )
}
