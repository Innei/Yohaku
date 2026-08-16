export interface GithubFileRef {
  endLine?: number
  fetchUrl: string
  language: string
  owner: string
  path: string
  ref: string
  repo: string
  startLine: number
}

const EXT_TO_LANG: Record<string, string> = {
  '.bash': 'bash',
  '.c': 'c',
  '.cjs': 'javascript',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.css': 'css',
  '.cts': 'typescript',
  '.dart': 'dart',
  '.ex': 'elixir',
  '.go': 'go',
  '.graphql': 'graphql',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'jsx',
  '.kt': 'kotlin',
  '.lua': 'lua',
  '.m': 'objectivec',
  '.md': 'markdown',
  '.mjs': 'javascript',
  '.mts': 'typescript',
  '.py': 'python',
  '.r': 'r',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.scala': 'scala',
  '.scss': 'scss',
  '.sh': 'bash',
  '.sql': 'sql',
  '.swift': 'swift',
  '.toml': 'toml',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.vue': 'vue',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.zsh': 'bash',
}

function languageFromPath(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot === -1) return 'text'
  return EXT_TO_LANG[path.slice(dot).toLowerCase()] || 'text'
}

export function parseGithubFileUrl(href: string): GithubFileRef | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.hostname !== 'github.com') return null
  const [, owner, repo, type, ...rest] = url.pathname.split('/')
  if (!owner || !repo || type !== 'blob' || rest.length === 0) return null
  const ref = rest[0]
  const path = rest.slice(1).join('/')
  if (!ref || !path) return null

  const matchResult = url.hash.match(/L\d+/g)
  let startLine = 0
  let endLine: number | undefined
  if (matchResult?.length === 1) {
    startLine = Number.parseInt(matchResult[0].slice(1), 10) - 1
    endLine = startLine + 1
  } else if (matchResult && matchResult.length > 1) {
    startLine = Number.parseInt(matchResult[0].slice(1), 10) - 1
    endLine = Number.parseInt(matchResult[1].slice(1), 10)
  }

  return {
    endLine,
    fetchUrl: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${path}`,
    language: languageFromPath(path),
    owner,
    path,
    ref,
    repo,
    startLine,
  }
}

export function sliceGithubFile(
  text: string,
  startLine: number,
  endLine?: number,
): string {
  const lines = text.split('\n')
  const end = endLine ?? lines.length
  return lines.slice(startLine, end).join('\n')
}
