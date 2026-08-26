const MARKDOWN_EXTS = new Set(['md', 'markdown'])
const TEXT_EXTS = new Set([
  'txt',
  'json',
  'yaml',
  'yml',
  'toml',
  'ini',
  'csv',
  'log',
  'js',
  'jsx',
  'ts',
  'tsx',
  'css',
  'scss',
  'html',
  'xml',
  'sh',
  'py',
  'rs',
  'go',
  'swift',
  'sql',
])
const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'svg',
  'bmp',
  'ico',
])
const QUICKLOOK_EXTS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'pages',
  'numbers',
  'key',
  'rtf',
])

export interface FilePreviewSource {
  ext?: string
  mimeType?: string
  name: string
}

export type FilePreviewKind = 'markdown' | 'text' | 'image' | 'quicklook'

function resolveFileExt(name: string, ext?: string): string {
  if (ext) return ext.toLowerCase()
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(index + 1).toLowerCase() : ''
}

export function filePreviewKind(
  source: FilePreviewSource,
): FilePreviewKind | null {
  const ext = resolveFileExt(source.name, source.ext)
  if (QUICKLOOK_EXTS.has(ext) || source.mimeType === 'application/pdf') {
    return 'quicklook'
  }
  if (IMAGE_EXTS.has(ext) || source.mimeType?.startsWith('image/')) {
    return 'image'
  }
  if (MARKDOWN_EXTS.has(ext)) return 'markdown'
  if (TEXT_EXTS.has(ext)) return 'text'
  if (source.mimeType?.startsWith('text/')) return 'text'
  return null
}
