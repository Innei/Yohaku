import { getLocale, useLocale } from './locale-store'
import type { Namespace, Translator } from './translate'
import { translate } from './translate'

export function useTranslations<N extends Namespace>(
  namespace: N,
): Translator<N> {
  const locale = useLocale()
  return (key, vars) => translate(locale, namespace, key, vars)
}

export function t<N extends Namespace>(
  namespace: N,
  ...rest: Parameters<Translator<N>>
): string {
  return translate(getLocale(), namespace, ...rest)
}

export type { Locale } from './config'
export { defaultLocale, isLocale, localeNames, locales } from './config'
export { getLocale, setLocale, useLocale } from './locale-store'
export type { Messages, Namespace, Translator, Vars } from './translate'
export { getMessages, translate } from './translate'
