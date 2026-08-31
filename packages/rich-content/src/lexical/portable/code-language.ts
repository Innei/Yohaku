import type { ComponentType, SVGProps } from 'react'

import {
  SimpleIconsC,
  SimpleIconsCplusplus,
  SimpleIconsCss,
  SimpleIconsHtml5,
  SimpleIconsJavascript,
  SimpleIconsJson,
  SimpleIconsMarkdown,
  SimpleIconsReact,
  SimpleIconsSwift,
  SimpleIconsTypescript,
  VscodeIconsFileTypeObjectivec,
  VscodeIconsFileTypeObjectivecpp,
} from './language-icons'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface CodeLanguageInfo {
  Icon: IconComponent | null
  color: string | null
  label: string
}

const ALIASES: Record<string, string> = {
  'c#': 'csharp',
  'c++': 'cpp',
  cjs: 'javascript',
  js: 'javascript',
  jsx: 'javascriptreact',
  md: 'markdown',
  mjs: 'javascript',
  objc: 'objectivec',
  objcpp: 'objectivecpp',
  'objective-c': 'objectivec',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'shell',
  shellscript: 'shell',
  ts: 'typescript',
  tsx: 'typescriptreact',
  yml: 'yaml',
  zsh: 'shell',
}

const LABELS: Record<string, string> = {
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  javascriptreact: 'JSX',
  json: 'JSON',
  markdown: 'Markdown',
  nginx: 'nginx',
  objectivec: 'Objective-C',
  objectivecpp: 'Objective-C++',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  shell: 'Shell',
  swift: 'Swift',
  typescript: 'TypeScript',
  typescriptreact: 'TSX',
  yaml: 'YAML',
}

const COLORS: Record<string, string> = {
  c: '#A8B9CC',
  cpp: '#00599C',
  css: '#1572B6',
  html: '#E34F26',
  javascript: '#F7DF1E',
  javascriptreact: '#61DAFB',
  json: '#F7DF1E',
  markdown: '#000000',
  objectivec: '#438EFF',
  objectivecpp: '#438EFF',
  shell: '#4EAA25',
  swift: '#FA7343',
  typescript: '#3178C6',
  typescriptreact: '#61DAFB',
}

const ICONS: Record<string, IconComponent> = {
  c: SimpleIconsC,
  cpp: SimpleIconsCplusplus,
  css: SimpleIconsCss,
  html: SimpleIconsHtml5,
  javascript: SimpleIconsJavascript,
  javascriptreact: SimpleIconsReact,
  json: SimpleIconsJson,
  markdown: SimpleIconsMarkdown,
  objectivec: VscodeIconsFileTypeObjectivec,
  objectivecpp: VscodeIconsFileTypeObjectivecpp,
  swift: SimpleIconsSwift,
  typescript: SimpleIconsTypescript,
  typescriptreact: SimpleIconsReact,
}

export function resolveCodeLanguage(language?: string): CodeLanguageInfo {
  if (!language) return { Icon: null, color: null, label: '' }
  const normalized = language.toLowerCase()
  const id = ALIASES[normalized] ?? normalized
  return {
    Icon: ICONS[id] ?? null,
    color: COLORS[id] ?? null,
    label: LABELS[id] ?? id.toUpperCase(),
  }
}
