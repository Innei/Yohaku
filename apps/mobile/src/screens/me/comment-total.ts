export function commentTotalFromPage(
  previous: number | null,
  outcome: { total: number } | { error: unknown },
): number | null {
  if ('total' in outcome) return outcome.total
  return previous
}
