import type { Locale } from './config'
import { defaultLocale } from './config'
import { en } from './messages/en'
import { ja } from './messages/ja'
import { ko } from './messages/ko'
import type { Messages, Namespace } from './messages/zh'
import { zh } from './messages/zh'
import { zhTW } from './messages/zh-TW'

const catalogs: Record<Locale, Messages> = {
  zh,
  'zh-TW': zhTW,
  en,
  ja,
  ko,
}

export type Vars = Record<string, string | number>

export type Translator<N extends Namespace> = (
  key: keyof Messages[N],
  vars?: Vars,
) => string

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  // eslint-disable-next-line unicorn/better-regex -- regexp/strict (error) requires the braces escaped; better-regex (warning) wants them bare
  return template.replaceAll(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale]
}

export function translate<N extends Namespace>(
  locale: Locale,
  namespace: N,
  key: keyof Messages[N],
  vars?: Vars,
): string {
  const value = getMessages(locale)[namespace][key]
  return interpolate(value as string, vars)
}

export type { Messages, Namespace }
