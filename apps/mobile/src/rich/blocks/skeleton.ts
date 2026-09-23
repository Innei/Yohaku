import { usePalette } from '@/theme/palette'

export function useBoneColor(): string {
  const palette = usePalette()
  return palette.theme === 'dark' ? palette.neutral[3] : palette.neutral[2]
}
