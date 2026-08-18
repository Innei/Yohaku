export const CODE_COLLAPSE_LINE_THRESHOLD = 20

export function shouldCollapseCode(code: string): boolean {
  if (!code) return false
  return code.split('\n').length > CODE_COLLAPSE_LINE_THRESHOLD
}
