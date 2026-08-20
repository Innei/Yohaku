import { Stack, useLocalSearchParams } from 'expo-router'

import { NoteSlugResolveScreen } from '@/screens/details/note-slug-resolve-screen'
import { decodeRouteParam } from '@/screens/taxonomy/taxonomy-model'

export default function NoteSlugRoute() {
  const { day, month, slug, year } = useLocalSearchParams<{
    day: string
    month: string
    slug: string
    year: string
  }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <NoteSlugResolveScreen
        day={Number(day)}
        month={Number(month)}
        slug={decodeRouteParam(slug)}
        year={Number(year)}
      />
    </>
  )
}
