import { parseGithubFileUrl as parseUpstream } from '@yohaku/rich-content/src/lexical/portable/github-file.ts'

export interface GithubFileRef {
  language: string
  owner: string
  path: string
  rawUrl: string
  ref: string
  repo: string
}

export function parseGithubFileUrl(href: string): GithubFileRef | null {
  const parsed = parseUpstream(href)
  if (!parsed) return null
  return {
    language: parsed.language,
    owner: parsed.owner,
    path: parsed.path,
    ref: parsed.ref,
    rawUrl: parsed.fetchUrl,
    repo: parsed.repo,
  }
}
