'use client'

import { useMemo } from 'react'

import { useHost } from '../../host'
import { useResource } from '../../lib/use-resource'
import { PortableCodeBlock } from './code-block'
import { CodeFold } from './code-fold'
import { parseGithubFileUrl, sliceGithubFile } from './github-file'

export function PortableGithubFileEmbed({ href }: { href: string }) {
  const { slots } = useHost()
  const parsed = useMemo(() => parseGithubFileUrl(href), [href])
  const resource = useResource(parsed?.fetchUrl ?? null, async () => {
    if (!parsed) throw new Error('No fetch url')
    const res = await fetch(parsed.fetchUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  })

  if (!parsed) return <a href={href}>{href}</a>

  if (resource.error) {
    return (
      <p data-github-file-embed="">
        <a href={href} rel="noreferrer" target="_blank">
          {href}
        </a>
      </p>
    )
  }

  if (resource.data === undefined) {
    return (
      <div
        aria-hidden
        className="my-4 h-48 w-full animate-pulse rounded-xl bg-(--color-neutral-2)"
        data-github-file-embed=""
      />
    )
  }

  const code = sliceGithubFile(resource.data, parsed.startLine, parsed.endLine)
  const Code = slots?.CodeBlock ?? PortableCodeBlock

  return (
    <div
      className="my-4 flex w-full flex-col items-center"
      data-github-file-embed=""
    >
      <div className="w-full">
        <CodeFold code={code}>
          <Code code={code} fold={false} language={parsed.language} />
        </CodeFold>
      </div>
      <a
        className="mt-3 text-[12px] text-neutral-7"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {href}
      </a>
    </div>
  )
}
