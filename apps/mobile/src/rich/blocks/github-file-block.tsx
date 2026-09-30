import { useQuery } from '@tanstack/react-query'

import { UnsupportedBlock } from './card-blocks'
import { type GithubFileRef, parseGithubFileUrl } from './github-file'
import { SourceCard } from './source-card'
import { type BlockProps, str } from './types'

async function fetchFileText(rawUrl: string): Promise<string> {
  const res = await fetch(rawUrl)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.text()
}

function fileName(path: string): string {
  return path.split('/').pop() ?? path
}

function dirLabel(fileRef: GithubFileRef): string {
  const dir = fileRef.path.split('/').slice(0, -1).join('/')
  return dir
    ? `${fileRef.owner}/${fileRef.repo} · ${dir}`
    : `${fileRef.owner}/${fileRef.repo}`
}

export function GithubFileBlock({ blockId, node }: BlockProps) {
  const url = str(node.url)
  const ref = parseGithubFileUrl(url)

  const query = useQuery({
    enabled: ref !== null,
    queryFn: () => fetchFileText(ref!.rawUrl),
    queryKey: ['github-file', ref?.rawUrl],
    staleTime: Infinity,
  })

  if (ref === null || query.isError) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const name = fileName(ref.path)
  return (
    <SourceCard
      chip={ref.ref}
      glyph="doc.text"
      href={url}
      subtitle={dirLabel(ref)}
      title={name}
      files={
        query.data === undefined
          ? null
          : [{ content: query.data, language: ref.language, name }]
      }
    />
  )
}
