// Skill docs ship with a YAML frontmatter block whose name/description already
// travel in the article meta, so the body is stripped rather than parsed.
export function stripSkillFrontmatter(raw: string): string {
  if (!raw.startsWith('---\n')) return raw
  const end = raw.indexOf('\n---\n', 4)
  if (end < 0) return raw
  return raw.slice(end + 5).replace(/^\n+/, '')
}

export function stripLeadingHeading(body: string): string {
  const match = /^\s*# [^\n]*\n*/.exec(body)
  return match ? body.slice(match[0].length) : body
}

export function skillBody(raw: string): string {
  return stripLeadingHeading(stripSkillFrontmatter(raw)).trim()
}
