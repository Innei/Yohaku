import githubDark from '@shikijs/themes/github-dark'
import githubLight from '@shikijs/themes/github-light'
import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

// shiki/bundle/full ships 242 grammars and all 65 themes — 8.1MB of the app
// bundle for two themes and a handful of languages. The core highlighter takes
// exactly what is listed here instead. Aliases are mirrored from each grammar's
// own `aliases` field: loadLanguage registers them, but resolving a fence tag
// to the right loader has to happen before the grammar is loaded.
const LANGUAGE_LOADERS = {
  astro: () => import('@shikijs/langs/astro'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  css: () => import('@shikijs/langs/css'),
  dart: () => import('@shikijs/langs/dart'),
  diff: () => import('@shikijs/langs/diff'),
  docker: () => import('@shikijs/langs/docker'),
  elixir: () => import('@shikijs/langs/elixir'),
  go: () => import('@shikijs/langs/go'),
  graphql: () => import('@shikijs/langs/graphql'),
  groovy: () => import('@shikijs/langs/groovy'),
  html: () => import('@shikijs/langs/html'),
  http: () => import('@shikijs/langs/http'),
  ini: () => import('@shikijs/langs/ini'),
  java: () => import('@shikijs/langs/java'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  jsx: () => import('@shikijs/langs/jsx'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  less: () => import('@shikijs/langs/less'),
  lua: () => import('@shikijs/langs/lua'),
  make: () => import('@shikijs/langs/make'),
  markdown: () => import('@shikijs/langs/markdown'),
  mdx: () => import('@shikijs/langs/mdx'),
  nginx: () => import('@shikijs/langs/nginx'),
  'objective-c': () => import('@shikijs/langs/objective-c'),
  php: () => import('@shikijs/langs/php'),
  powershell: () => import('@shikijs/langs/powershell'),
  prisma: () => import('@shikijs/langs/prisma'),
  proto: () => import('@shikijs/langs/proto'),
  python: () => import('@shikijs/langs/python'),
  regexp: () => import('@shikijs/langs/regexp'),
  ruby: () => import('@shikijs/langs/ruby'),
  rust: () => import('@shikijs/langs/rust'),
  scss: () => import('@shikijs/langs/scss'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  sql: () => import('@shikijs/langs/sql'),
  svelte: () => import('@shikijs/langs/svelte'),
  swift: () => import('@shikijs/langs/swift'),
  toml: () => import('@shikijs/langs/toml'),
  tsx: () => import('@shikijs/langs/tsx'),
  typescript: () => import('@shikijs/langs/typescript'),
  vue: () => import('@shikijs/langs/vue'),
  xml: () => import('@shikijs/langs/xml'),
  yaml: () => import('@shikijs/langs/yaml'),
  zig: () => import('@shikijs/langs/zig'),
} as const

export type LanguageId = keyof typeof LANGUAGE_LOADERS

export const LANGUAGE_IDS = Object.keys(LANGUAGE_LOADERS) as LanguageId[]

const LANGUAGE_ALIASES: Record<string, LanguageId> = {
  bash: 'shellscript',
  'c#': 'csharp',
  'c++': 'cpp',
  cjs: 'javascript',
  cs: 'csharp',
  cts: 'typescript',
  dockerfile: 'docker',
  gql: 'graphql',
  js: 'javascript',
  kt: 'kotlin',
  kts: 'kotlin',
  makefile: 'make',
  md: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  objc: 'objective-c',
  properties: 'ini',
  protobuf: 'proto',
  ps: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  py: 'python',
  rb: 'ruby',
  regex: 'regexp',
  rs: 'rust',
  sh: 'shellscript',
  shell: 'shellscript',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'shellscript',
}

export const THEMES = { dark: 'github-dark', light: 'github-light' } as const

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

export const bundledThemes = {
  'github-dark': () => import('@shikijs/themes/github-dark'),
  'github-light': () => import('@shikijs/themes/github-light'),
}

export const bundledThemesInfo = [
  { id: 'github-dark', displayName: 'GitHub Dark', type: 'dark' as const },
  { id: 'github-light', displayName: 'GitHub Light', type: 'light' as const },
]

let corePromise: Promise<HighlighterCore> | null = null
const pendingLanguages = new Map<LanguageId, Promise<void>>()

export function resolveLanguage(
  language: string | undefined,
): LanguageId | null {
  if (!language) return null
  const id = language.toLowerCase()
  const canonical = LANGUAGE_ALIASES[id] ?? id
  return canonical in LANGUAGE_LOADERS ? (canonical as LanguageId) : null
}

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
