import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildMarkdownArticle } from '@/rich/markdown/article'

import { parseMarkdownToAst } from '../../../modules/yohaku/android/markdown'

const fixture = (name: string) =>
  readFileSync(
    path.join(import.meta.dirname, '__fixtures__', name),
    'utf8',
  )

describe('Android markdown parser', () => {
  it('maps the sample article like the native md4c parser', () => {
    const article = buildMarkdownArticle(fixture('sample.md'), parseMarkdownToAst)
    const summary = article.segments.flatMap((segment) =>
      segment.kind === 'view'
        ? [`${segment.blockId} ${segment.node.type}`]
        : segment.blocks.map(
            (block) =>
              `${block.id} ${block.role} ${block.runs.map((run) => run.text).join('|')}`,
          ),
    )
    expect(summary).toEqual([
      'm0 heading Title',
      'm1 paragraph A |bold| & |code| |@Innei| line| |中文|换行',
      'm2 alert-quote',
      'm3.0#0 listItem one',
      'm3.1 code-block',
      'm3.2#0 listItem two',
      'm3.2#1 listItem done',
      'm4 table',
      'm5 katex-block',
      'm6 image',
      'm7 link-card',
      'm8 paragraph <details>raw</details>',
    ])
    expect(article.headings).toEqual([{ blockId: 'm0', level: 1, text: 'Title' }])
  })
})
