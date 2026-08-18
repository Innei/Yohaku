const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JS',
  javascriptreact: 'JSX',
  js: 'JS',
  jsx: 'JSX',
  markdown: 'MD',
  md: 'MD',
  'objective-c': 'OBJC',
  objectivec: 'OBJC',
  objectivecpp: 'OBJCPP',
  objc: 'OBJC',
  objcpp: 'OBJCPP',
  shell: 'SH',
  typescript: 'TS',
  typescriptreact: 'TSX',
}

const LANGUAGE_ACCENTS: Record<string, string> = {
  bash: '#4EAA25',
  c: '#A8B9CC',
  'c++': '#00599C',
  cpp: '#00599C',
  css: '#1572B6',
  html: '#E34F26',
  javascript: '#F7DF1E',
  javascriptreact: '#61DAFB',
  js: '#F7DF1E',
  jsx: '#61DAFB',
  json: '#F7DF1E',
  markdown: '#000000',
  md: '#000000',
  'objective-c': '#438EFF',
  objectivec: '#438EFF',
  objectivecpp: '#438EFF',
  objc: '#438EFF',
  objcpp: '#438EFF',
  sh: '#4EAA25',
  shell: '#4EAA25',
  swift: '#FA7343',
  ts: '#3178C6',
  tsx: '#3178C6',
  typescript: '#3178C6',
  typescriptreact: '#61DAFB',
  zsh: '#4EAA25',
}

export function formatCodeLanguageLabel(language?: string): string {
  if (!language) return ''
  const normalized = language.toLowerCase()
  return LANGUAGE_LABELS[normalized] || normalized.toUpperCase()
}

export function codeLanguageAccent(language?: string): string | undefined {
  if (!language) return undefined
  return LANGUAGE_ACCENTS[language.toLowerCase()]
}
