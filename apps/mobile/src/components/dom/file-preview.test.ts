import { describe, expect, it } from 'vitest'

import { filePreviewKind } from './file-preview'

describe('filePreviewKind', () => {
  it('returns markdown for md files', () => {
    expect(filePreviewKind({ name: 'README.md' })).toBe('markdown')
    expect(filePreviewKind({ ext: 'markdown', name: 'notes' })).toBe('markdown')
  })

  it('returns text for code and plain-text files', () => {
    expect(filePreviewKind({ name: 'main.ts' })).toBe('text')
    expect(filePreviewKind({ ext: 'json', name: 'data' })).toBe('text')
    expect(filePreviewKind({ mimeType: 'text/plain', name: 'untitled' })).toBe(
      'text',
    )
  })

  it('returns image for raster and svg files', () => {
    expect(filePreviewKind({ name: 'cover.png' })).toBe('image')
    expect(filePreviewKind({ ext: 'SVG', name: 'logo' })).toBe('image')
    expect(
      filePreviewKind({ mimeType: 'image/webp', name: 'photo' }),
    ).toBe('image')
  })

  it('returns quicklook for pdf and office documents', () => {
    expect(filePreviewKind({ name: '季度报告.pdf' })).toBe('quicklook')
    expect(filePreviewKind({ ext: 'PDF', name: 'report' })).toBe('quicklook')
    expect(
      filePreviewKind({
        mimeType: 'application/pdf',
        name: 'report',
      }),
    ).toBe('quicklook')
    expect(filePreviewKind({ name: 'notes.docx' })).toBe('quicklook')
    expect(filePreviewKind({ ext: 'xlsx', name: 'sheet' })).toBe('quicklook')
    expect(filePreviewKind({ name: 'deck.key' })).toBe('quicklook')
  })

  it('prefers quicklook over a misleading text mime type', () => {
    expect(
      filePreviewKind({
        mimeType: 'text/plain',
        name: 'report.pdf',
      }),
    ).toBe('quicklook')
  })

  it('prefers image over a generic octet-stream mime type', () => {
    expect(
      filePreviewKind({
        mimeType: 'application/octet-stream',
        name: 'hero.jpg',
      }),
    ).toBe('image')
  })

  it('returns null for files that cannot be previewed', () => {
    expect(filePreviewKind({ name: 'archive.zip' })).toBeNull()
    expect(
      filePreviewKind({
        mimeType: 'application/zip',
        name: 'bundle',
      }),
    ).toBeNull()
  })
})
