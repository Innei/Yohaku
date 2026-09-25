import githubDark from '@shikijs/themes/github-dark'
import githubLight from '@shikijs/themes/github-light'
import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

import {
  bundledThemes,
  LANGUAGE_ALIASES,
  LANGUAGE_IDS,
  LANGUAGE_LOADERS,
  type LanguageId,
  resolveLanguage,
  THEMES,
} from './shiki-catalog'

export type { LanguageId }
export { bundledThemes, LANGUAGE_IDS, resolveLanguage, THEMES }

// Mirrors the shape of shiki/bundle/*, so a host can alias the upstream bundle
// to this catalog and keep every consumer — including @haklex's own code-block
// renderers — on the curated set. Alias keys are folded in the way shiki does
// it, since createBundledHighlighter resolves a fence tag straight off this map.
export const bundledLanguages: Record<
  string,
  (typeof LANGUAGE_LOADERS)[LanguageId]
> = {
  ...LANGUAGE_LOADERS,
  ...Object.fromEntries(
    Object.entries(LANGUAGE_ALIASES).map(([alias, id]) => [
      alias,
      LANGUAGE_LOADERS[id],
    ]),
  ),
}

export const bundledLanguagesInfo = LANGUAGE_IDS.map((id) => ({
  id,
  name: id,
  aliases: Object.entries(LANGUAGE_ALIASES)
    .filter(([, target]) => target === id)
    .map(([alias]) => alias),
}))

export const bundledThemesInfo = [
  { id: 'github-dark', displayName: 'GitHub Dark', type: 'dark' as const },
  { id: 'github-light', displayName: 'GitHub Light', type: 'light' as const },
]

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
