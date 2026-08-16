export function stripInsightsMarkup(markdown: string): string {
  /* eslint-disable unicorn/better-regex -- [\s\S] is the portable any-char; better-regex and match-any fight */
  return markdown
    .replaceAll(/<!--\s*insights-meta:[\s\S]*?-->/g, '')
    .replaceAll(/<ref\b[^>]*\/>/g, '')
    .replaceAll(/<ref\b[^>]*>[\s\S]*?<\/ref>/g, '')
    .trim()
  /* eslint-enable unicorn/better-regex */
}
