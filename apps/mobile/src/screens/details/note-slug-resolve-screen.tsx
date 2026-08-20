import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

import { api } from '@/api/client'
import { AppText, Desk } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'

import { NoteDetailScreen } from './note-detail'

export function NoteSlugResolveScreen({
  day,
  month,
  slug,
  year,
}: {
  day: number
  month: number
  slug: string
  year: number
}) {
  const router = useRouter()
  const locale = useLocale()
  const tc = useTranslations('common')
  const tt = useTranslations('tabs')
  const [nid, setNid] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void api
      .noteBySlugDate(year, month, day, slug, locale)
      .then(({ data }) => {
        if (cancelled) return
        if (!Number.isFinite(data.nid) || data.nid <= 0) {
          router.replace('/notes')
          return
        }
        setNid(data.nid)
      })
      .catch(() => {
        if (!cancelled) router.replace('/notes')
      })
    return () => {
      cancelled = true
    }
  }, [day, locale, month, router, slug, year])

  if (nid != null) return <NoteDetailScreen nid={nid} />

  return (
    <Desk>
      <Stack.Screen options={{ title: tt('notes') }} />
      <AppText style={styles.placeholder} variant="secondary">
        {tc('loading')}
      </AppText>
    </Desk>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    marginTop: 32,
    textAlign: 'center',
  },
})
