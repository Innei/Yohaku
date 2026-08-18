// @haklex's code-block and code-snippet renderers import shiki/bundle/full in
// 48 places, which ships 242 grammars and all 65 themes — 8.1MB of app bundle.
// metro.config.js aliases that specifier here: same public surface, built from
// @yohaku/rich-content's curated catalog (48 languages, the 2 themes the
// renderer actually styles for).
import {
  createBundledHighlighter,
  createSingletonShorthands,
  guessEmbeddedLanguages,
} from '@shikijs/core'
import {
  bundledLanguages,
  bundledLanguagesInfo,
  bundledThemes,
  bundledThemesInfo,
  resolveLanguage,
} from '@yohaku/rich-content/src/lexical/portable/shiki-highlighter.ts'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

export * from '@shikijs/core'
export {
  bundledLanguages,
  bundledLanguagesInfo,
  bundledThemes,
  bundledThemesInfo,
}

export const createHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createOnigurumaEngine(import('shiki/wasm')),
})

const shorthands = createSingletonShorthands(createHighlighter, {
  guessEmbeddedLanguages,
})

export const {
  codeToHast,
  codeToTokens,
  codeToTokensBase,
  codeToTokensWithThemes,
  getLastGrammarState,
  getSingletonHighlighter,
} = shorthands

// The upstream bundle can highlight anything, so callers never guarded against
// an unknown fence tag. Downgrading to plain text keeps a rare language
// rendering as an unhighlighted block instead of throwing through the renderer.
export const codeToHtml: typeof shorthands.codeToHtml = (code, options) =>
  shorthands.codeToHtml(code, {
    ...options,
    lang: resolveLanguage(options.lang) ?? 'text',
  })
