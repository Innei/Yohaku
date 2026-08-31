'use client'

import { useEffect, useState } from 'react'

import { CodeLanguageMark, CodeShell } from './code-shell'

export interface CodeSnippetFile {
  code: string
  filename: string
  language?: string
}

function useShikiHtml(code: string, language?: string): string | null {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    import('./shiki-highlighter')
      .then(async ({ highlightToHtml }) => {
        try {
          return await highlightToHtml(code, language)
        } catch {
          return await highlightToHtml(code)
        }
      })
      .then((out) => {
        if (!cancelled) setHtml(out)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, language])

  return html
}

export function YohakuCodeSnippet({ files }: { files: CodeSnippetFile[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = files[activeIndex] ?? files[0]
  const html = useShikiHtml(active?.code ?? '', active?.language)

  if (!active) return null

  const tabs = (
    <div className="yohaku-code__tabs">
      {files.map((file, index) => (
        <button
          className={
            index === activeIndex
              ? 'yohaku-code__tab yohaku-code__tab--active'
              : 'yohaku-code__tab'
          }
          key={file.filename}
          type="button"
          onClick={() => setActiveIndex(index)}
        >
          <CodeLanguageMark language={file.language} />
          {file.filename}
        </button>
      ))}
    </div>
  )

  return (
    <CodeShell
      code={active.code}
      footerName={active.filename}
      header={tabs}
      language={active.language}
    >
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{active.code}</code>
        </pre>
      )}
    </CodeShell>
  )
}
