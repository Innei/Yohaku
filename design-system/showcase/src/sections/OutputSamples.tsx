import { useEffect, useRef, useState } from 'react'

import { type Lang, t } from '../i18n'

type Sample = {
  id: string
  base: string
  title: { zh: string; en: string }
  desc: { zh: string; en: string }
  viewportWidth: number
  viewportHeight: number
}

const samples: Sample[] = [
  {
    id: 'post',
    base: '/demos/demo-post',
    title: { zh: '长文', en: 'Long-form Post' },
    desc: {
      zh: '正文页 · 衬线字体 · drop cap · 多页',
      en: 'Reading page · serif body · drop cap · multi-page',
    },
    viewportWidth: 1100,
    viewportHeight: 1500,
  },
  {
    id: 'resume',
    base: '/demos/demo-resume',
    title: { zh: '简历', en: 'Resume' },
    desc: {
      zh: 'A4 单页 · 设计工程师简历',
      en: 'A4 single page · designer-engineer CV',
    },
    viewportWidth: 794,
    viewportHeight: 1123,
  },
  {
    id: 'report',
    base: '/demos/demo-report',
    title: { zh: '一页报告', en: 'One-page Report' },
    desc: {
      zh: 'A4 单页 · 项目进度报告',
      en: 'A4 single page · project status report',
    },
    viewportWidth: 794,
    viewportHeight: 1123,
  },
]

function hrefFor(sample: Sample, lang: Lang, ext: 'html' | 'pdf') {
  const suffix = lang === 'en' ? '.en' : ''
  return `${sample.base}${suffix}.${ext}`
}

function DemoCard({
  sample,
  lang,
}: {
  sample: Sample
  lang: Lang
}) {
  const frameRef = useRef<HTMLAnchorElement>(null)
  const [scale, setScale] = useState(0.25)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setScale(w / sample.viewportWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [sample.viewportWidth])

  const htmlHref = hrefFor(sample, lang, 'html')
  const pdfHref = hrefFor(sample, lang, 'pdf')

  return (
    <article className="demo-card">
      <a
        ref={frameRef}
        className="demo-card__frame"
        href={htmlHref}
        target="_blank"
        rel="noreferrer"
      >
        <div className="demo-card__viewport">
          <iframe
            key={htmlHref}
            src={htmlHref}
            title={sample.title[lang]}
            loading="lazy"
            scrolling="no"
            className="demo-card__iframe"
            tabIndex={-1}
            aria-hidden="true"
            style={{
              width: sample.viewportWidth,
              height: sample.viewportHeight,
              transform: `scale(${scale})`,
            }}
          />
          <span className="demo-card__shield" aria-hidden="true" />
        </div>
        <span className="demo-card__open" aria-hidden="true">
          ↗
        </span>
      </a>
      <p className="demo-card__title">{sample.title[lang]}</p>
      <p className="demo-card__desc">{sample.desc[lang]}</p>
      <a
        className="demo-card__pdf"
        href={pdfHref}
        target="_blank"
        rel="noreferrer"
      >
        ↓ {lang === 'zh' ? '下载 PDF' : 'Download PDF'}
      </a>
    </article>
  )
}

export function OutputSamples({ lang }: { lang: Lang }) {
  return (
    <section className="section">
      <div className="section-head">
        <p className="section-num">{t('outputNum', lang)}</p>
        <h2 className="section-title">{t('outputTitle', lang)}</h2>
        <p className="section-lede">{t('outputLede', lang)}</p>
      </div>

      <div className="demo-grid">
        {samples.map((sample) => (
          <DemoCard key={sample.id} sample={sample} lang={lang} />
        ))}
      </div>
    </section>
  )
}
