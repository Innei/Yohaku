'use client'
import { sx } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

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
        {...sx(atoms.my_4, atoms.h_48, atoms.w_full, atoms.animate_pulse, atoms.rounded_xl, atoms.bg____color_neutral_2)}
        data-github-file-embed=""
      />
    )
  }

  const code = sliceGithubFile(resource.data, parsed.startLine, parsed.endLine)
  const Code = slots?.CodeBlock ?? PortableCodeBlock

  return (
    <div
      {...sx(atoms.my_4, atoms.flex, atoms.w_full, atoms.flex_col, atoms.items_center)}
      data-github-file-embed=""
    >
      <div {...sx(atoms.w_full)}>
        <CodeFold code={code}>
          <Code code={code} fold={false} language={parsed.language} />
        </CodeFold>
      </div>
      <a
        {...sx(atoms.mt_3, atoms.text__12px, atoms.text_neutral_7)}
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {href}
      </a>
    </div>
  )
}
