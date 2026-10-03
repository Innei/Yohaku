import type { InlineRun } from '../inline-runs'

export interface FootnoteScope {
  definitions: Record<string, string>
  numbers: Map<string, number>
}

const MENTION_HOSTS: Record<string, string> = {
  GH: 'https://github.com/',
  TG: 'https://t.me/',
  TW: 'https://twitter.com/',
}

const EXTENSION =
  /(?:\[([^\]]*)\])?\{(GH|TW|TG)@(\w+)\}|\+\+(.+?)\+\+|\[\^([^\s\]]+)\]/g

export function inlineRuns(text: string, scope: FootnoteScope): InlineRun[] {
  const runs: InlineRun[] = []
  let cursor = 0
  const pushText = (end: number) => {
    if (end > cursor) runs.push({ text: text.slice(cursor, end) })
  }
  for (const match of text.matchAll(EXTENSION)) {
    const [whole, display, source, handle, inserted, footnote] = match
    if (footnote !== undefined && !(footnote in scope.definitions)) continue
    pushText(match.index)
    cursor = match.index + whole.length
    if (handle !== undefined) {
      runs.push({
        href: `${MENTION_HOSTS[source!]}${handle}`,
        mention: true,
        text: `@${display || handle}`,
      })
    } else if (inserted !== undefined) {
      runs.push({ text: inserted, underline: true })
    } else if (footnote !== undefined) {
      if (!scope.numbers.has(footnote))
        scope.numbers.set(footnote, scope.numbers.size + 1)
      runs.push({ footnote, sup: true, text: footnote })
    }
  }
  pushText(text.length)
  return runs
}
