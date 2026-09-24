export interface SnippetFile {
  code: string
  filename: string
  language: string
}

export function snippetFiles(node: Record<string, unknown>): SnippetFile[] {
  const files = Array.isArray(node.files) ? node.files : []
  const out: SnippetFile[] = []
  files.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    if (typeof record.code !== 'string') return
    out.push({
      code: record.code,
      filename:
        typeof record.filename === 'string' && record.filename
          ? record.filename
          : `file ${index + 1}`,
      language: typeof record.language === 'string' ? record.language : '',
    })
  })
  return out
}
