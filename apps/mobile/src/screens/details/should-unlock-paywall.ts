export function shouldUnlockPaywalledContent({
  locked,
  isMember,
  isOwner,
}: {
  isMember: boolean
  isOwner: boolean
  locked: boolean
}): boolean {
  return locked && (isMember || isOwner)
}
