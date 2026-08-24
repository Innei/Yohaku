export interface InsightsMeta {
  difficulty: 'easy' | 'medium' | 'hard'
  genre: string
  readingTimeMin: number
}

const ALLOWED_DIFFICULTIES: ReadonlyArray<InsightsMeta['difficulty']> = [
  'easy',
  'medium',
  'hard',
]

const KNOWN_GENRES = [
  'architecture',
  'tutorial',
  'post-mortem',
  'comparison',
  'mechanism',
  'diary',
  'travelogue',
  'essay',
  'review',
  'memorial',
  'retrospective',
] as const

type KnownGenre = (typeof KNOWN_GENRES)[number]

const HAN_DIGIT = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

export function extractInsightsMeta(markdown: string): InsightsMeta | null {
  const trimmed = markdown.trimEnd()
  /* eslint-disable unicorn/better-regex -- [\s\S] is the portable any-char; better-regex and match-any fight */
  const globalRe = /<!--\s*insights-meta:\s*(\{(?:(?!-->)[\s\S])*\})\s*-->/g
  /* eslint-enable unicorn/better-regex */
  let last: RegExpExecArray | null = null
  let match: RegExpExecArray | null
  while ((match = globalRe.exec(trimmed)) !== null) last = match
  if (!last) return null
  try {
    const parsed = JSON.parse(last[1]) as {
      difficulty?: InsightsMeta['difficulty']
      genre?: string
      reading_time_min?: number
    }
    if (
      typeof parsed.reading_time_min === 'number' &&
      Number.isFinite(parsed.reading_time_min) &&
      parsed.reading_time_min >= 0 &&
      ALLOWED_DIFFICULTIES.includes(
        parsed.difficulty as InsightsMeta['difficulty'],
      ) &&
      typeof parsed.genre === 'string'
    ) {
      return {
        difficulty: parsed.difficulty as InsightsMeta['difficulty'],
        genre: parsed.genre,
        readingTimeMin: parsed.reading_time_min,
      }
    }
    return null
  } catch {
    return null
  }
}

export function numToHan(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > 99) return null
  if (n < 10) return HAN_DIGIT[n]
  if (n === 10) return '十'
  if (n < 20) return `十${HAN_DIGIT[n - 10]}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return ones === 0
    ? `${HAN_DIGIT[tens]}十`
    : `${HAN_DIGIT[tens]}十${HAN_DIGIT[ones]}`
}

type MetaTranslator = (
  key: string,
  vars?: Record<string, string | number>,
) => string

function isKnownGenre(genre: string): genre is KnownGenre {
  return (KNOWN_GENRES as readonly string[]).includes(genre)
}

function genreKey(genre: string, literary: boolean): string {
  const slug = genre.toLowerCase().replaceAll('-', '_')
  const known = isKnownGenre(genre.toLowerCase())
  if (!known) return genre
  return literary ? `genreLiterary_${slug}` : `genre_${slug}`
}

export function formatInsightsMetaLine(
  meta: InsightsMeta,
  t: MetaTranslator,
  literary: boolean,
): string {
  const time = literary
    ? (() => {
        const han = numToHan(meta.readingTimeMin)
        return han
          ? t('metaLiteraryTime', { count: han })
          : t('metaLiteraryTimeFallback', { count: meta.readingTimeMin })
      })()
    : t('metaTime', { count: meta.readingTimeMin })

  const difficulty = t(
    literary
      ? `difficultyLiterary_${meta.difficulty}`
      : `difficulty_${meta.difficulty}`,
  )
  const genre = isKnownGenre(meta.genre.toLowerCase())
    ? t(genreKey(meta.genre, literary))
    : meta.genre

  return [time, difficulty, genre].join(' · ')
}
