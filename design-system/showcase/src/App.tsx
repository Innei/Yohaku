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

function Toolbar() {
  const { lang, setLang } = useLang()
  const { theme, toggle } = useTheme()
  return (
    <div className="toolbar" role="toolbar" aria-label="Showcase controls">
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
