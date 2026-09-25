
// shiki/bundle/full ships 242 grammars and all 65 themes — 8.1MB of the app
// bundle for two themes and a handful of languages. The core highlighter takes
// exactly what is listed here instead. Aliases are mirrored from each grammar's
// own `aliases` field: loadLanguage registers them, but resolving a fence tag
// to the right loader has to happen before the grammar is loaded.
export const LANGUAGE_LOADERS = {
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

export const LANGUAGE_ALIASES: Record<string, LanguageId> = {
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

export const bundledThemes = {
  'github-dark': () => import('@shikijs/themes/github-dark'),
  'github-light': () => import('@shikijs/themes/github-light'),
}

export function resolveLanguage(
  language: string | undefined,
): LanguageId | null {
  if (!language) return null
  const id = language.toLowerCase()
  const canonical = LANGUAGE_ALIASES[id] ?? id
  return canonical in LANGUAGE_LOADERS ? (canonical as LanguageId) : null
}
