export function activePreparedContent<
  T extends { content: string; id: string },
>(prepared: T | null, readerId: string | undefined, content: string): T | null {
  if (!prepared) return null
  if (prepared.content === '' && prepared.id !== readerId) return null
  return prepared.id === readerId && prepared.content === content
    ? null
    : prepared
}
