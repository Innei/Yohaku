const FAMILY_ONLY = new Set(['iphone', 'ipad', 'ipod', 'ipod touch'])

export function formatDeviceDisplayName({
  modelId,
  modelName,
}: {
  modelId: string | null
  modelName: string | null
}): string {
  const name = modelName?.trim() ?? ''
  const id = modelId?.trim() ?? ''
  const familyOnly = !name || FAMILY_ONLY.has(name.toLowerCase()) || name === id
  if (id && familyOnly) return id
  if (name && id) return `${name} (${id})`
  return name || id || 'iPhone'
}
