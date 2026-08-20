import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

import { api } from '@/api/client'
import { AppText, Desk } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'

import { NoteDetailScreen } from './note-detail'
import { resolveDatedNote } from './resolve-dated-note'

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
  const td = useTranslations('detail')
  const tt = useTranslations('tabs')
  const [nid, setNid] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    void resolveDatedNote(() =>
      api.noteBySlugDate(year, month, day, slug, locale),
    ).then((result) => {
      if (cancelled) return
      if (result.kind === 'missing') {
        router.replace('/notes')
        return
      }
      if (result.kind === 'retry') {
        setFailed(true)
        return
      }
      setNid(result.nid)
    })
    return () => {
      cancelled = true
    }
  }, [attempt, day, locale, month, router, slug, year])

  if (nid != null) return <NoteDetailScreen nid={nid} />

  return (
    <Desk>
      <Stack.Screen options={{ title: tt('notes') }} />
      <AppText
        style={styles.placeholder}
        variant="secondary"
        onPress={failed ? () => setAttempt((value) => value + 1) : undefined}
      >
        {failed ? td('noteFailed') : tc('loading')}
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
