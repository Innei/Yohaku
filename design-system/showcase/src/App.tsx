import { useLang } from './i18n'
import { AntiPatterns } from './sections/AntiPatterns'
import { Background } from './sections/Background'
import { Color } from './sections/Color'
import { Components } from './sections/Components'
import { Decision } from './sections/Decision'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { Manifesto } from './sections/Manifesto'
import { OutputSamples } from './sections/OutputSamples'
import { Snippets } from './sections/Snippets'
import { Spacing } from './sections/Spacing'
import { Typography } from './sections/Typography'
import { useTheme } from './theme'

function GithubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.69-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.93 10.93 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function Toolbar() {
  const { lang, setLang } = useLang()
  const { theme, toggle } = useTheme()
  return (
    <div className="toolbar" role="toolbar" aria-label="Showcase controls">
      <a
        className="toolbar__icon"
        href="https://github.com/Innei/Yohaku"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="View Yohaku on GitHub"
        title="View Yohaku on GitHub"
      >
        <GithubIcon />
      </a>
      <span className="sep" aria-hidden="true" />
      <button
        onClick={() => setLang('zh')}
        data-active={lang === 'zh'}
        aria-pressed={lang === 'zh'}
      >
        中
      </button>
      <button
        onClick={() => setLang('en')}
        data-active={lang === 'en'}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <span className="sep" aria-hidden="true" />
      <button onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? '☾' : '☀'}
      </button>
    </div>
  )
}

export default function App() {
  const { lang } = useLang()
  return (
    <>
      <Toolbar />
      <main className="page">
        <Hero lang={lang} />
        <OutputSamples lang={lang} />
        <Manifesto lang={lang} />
        <Color lang={lang} />
        <Typography lang={lang} />
        <Spacing lang={lang} />
        <Components lang={lang} />
        <Snippets lang={lang} />
        <AntiPatterns lang={lang} />
        <Decision lang={lang} />
        <Background lang={lang} />
        <Footer lang={lang} />
      </main>
    </>
  )
}
