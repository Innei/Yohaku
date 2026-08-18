import type { Locale } from './config'
import { defaultLocale, isLocale, locales } from './config'

export interface SystemLocale {
  languageCode?: string | null
  languageScriptCode?: string | null
  languageTag?: string | null
  regionCode?: string | null
}

const TRADITIONAL_REGIONS = new Set(['TW', 'HK', 'MO'])

function exactTag(tag: string): Locale | null {
  const hit = locales.find(
    (locale) => locale.toLowerCase() === tag.toLowerCase(),
  )
  return hit ?? null
}

function matchOne(candidate: SystemLocale): Locale | null {
  const tag = candidate.languageTag ?? ''
  const exact = tag ? exactTag(tag) : null
  if (exact) return exact

  const language = (
    candidate.languageCode ??
    tag.split('-')[0] ??
    ''
  ).toLowerCase()
  if (!language) return null

  if (language === 'zh') {
    const script = candidate.languageScriptCode?.toLowerCase()
    const region = candidate.regionCode?.toUpperCase()
    const traditional =
      script === 'hant' ||
      (!!region && TRADITIONAL_REGIONS.has(region)) ||
      tag.toLowerCase().includes('hant')
    return traditional ? 'zh-TW' : 'zh'
  }

  return isLocale(language) ? language : null
}

export function matchLocale(candidates: SystemLocale[]): Locale {
  for (const candidate of candidates) {
    const matched = matchOne(candidate)
    if (matched) return matched
  }
  return defaultLocale
}
