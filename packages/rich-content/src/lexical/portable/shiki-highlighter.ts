import githubDark from '@shikijs/themes/github-dark'
import githubLight from '@shikijs/themes/github-light'
import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

import {
  LANGUAGE_IDS,
  LANGUAGE_LOADERS,
  type LanguageId,
  resolveLanguage,
  THEMES,
} from './shiki-catalog'

export type { LanguageId }
export { LANGUAGE_IDS, resolveLanguage, THEMES }

let corePromise: Promise<HighlighterCore> | null = null
const pendingLanguages = new Map<LanguageId, Promise<void>>()

function getCore(): Promise<HighlighterCore> {
  corePromise ??= createHighlighterCore({
    themes: [githubDark, githubLight],
    langs: [],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  })
  return corePromise
}

export async function highlightToHtml(
  code: string,
  language?: string,
): Promise<string> {
  const core = await getCore()
  const lang = resolveLanguage(language)

  if (lang) {
    let pending = pendingLanguages.get(lang)
    if (!pending) {
      pending = core
        .loadLanguage(LANGUAGE_LOADERS[lang]())
        .then(() => undefined)
      pendingLanguages.set(lang, pending)
    }
    await pending
  }

  // 'text' needs no grammar — shiki treats it as a hard-coded plain language.
  return core.codeToHtml(code, { lang: lang ?? 'text', themes: THEMES })
}
