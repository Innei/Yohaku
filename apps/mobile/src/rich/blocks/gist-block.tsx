import { useQuery } from '@tanstack/react-query'

import { UnsupportedBlock } from './card-blocks'
import { SourceCard } from './source-card'
import { gistFiles, parseGistUrl } from './source-card-model'
import { type BlockProps, str } from './types'

interface GistResponse {
  description?: string | null
  files?: Record<string, { content?: string; filename?: string }>
  owner?: { login?: string } | null
}

async function fetchGist(id: string): Promise<GistResponse> {
  const res = await fetch(`https://api.github.com/gists/${id}`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json() as Promise<GistResponse>
}

export function GistBlock({ blockId, node }: BlockProps) {
  const url = str(node.url)
  const ref = parseGistUrl(url)

  const query = useQuery({
    enabled: ref !== null,
    queryFn: () => fetchGist(ref!.id),
    queryKey: ['github-gist', ref?.id],
    staleTime: Infinity,
  })

  const files = query.data ? gistFiles(query.data) : null
  if (ref === null || query.isError || files?.length === 0) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const description = query.data?.description?.trim() || undefined
  const single = files?.length === 1 ? files[0] : undefined
  return (
    <SourceCard
      files={files}
      glyph="chevron.left.forwardslash.chevron.right"
      href={url}
      owner={query.data?.owner?.login ?? ref.owner}
      subtitle={single ? description : undefined}
      title={
        single?.name ?? description ?? (files ? `${files.length} 个文件` : 'Gist')
      }
    />
  )
}
