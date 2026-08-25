import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import type { SessionUser } from '@/auth/session-store'
import { AppText, GroupedCard, NativePressable, RemoteImage } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { guestCardHref, guestCardKind } from './guest-card'

export function GuestDoor({ session }: { session: SessionUser | null }) {
  const t = useTranslations('study')
  const palette = usePalette()
  const router = useRouter()
  const kind = guestCardKind(session)
  const href = guestCardHref(kind)

  return (
    <NativePressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
    >
      <GroupedCard style={styles.card}>
        {kind === 'owner' ? null : session?.image ? (
          <RemoteImage
            contentFit="cover"
            style={styles.face}
            uri={session.image}
          />
        ) : (
          <View style={[styles.face, { backgroundColor: palette.neutral[3] }]}>
            <SymbolView
              name="person.crop.circle"
              size={20}
              tintColor={palette.neutral[6]}
            />
          </View>
        )}
        <View style={styles.copy}>
          <AppText variant="entryTitleSans">
            {kind === 'owner' ? t('account') : t('me')}
          </AppText>
          {kind === 'reader' && session?.name ? (
            <AppText color={palette.neutral[7]} variant="secondary">
              {session.name}
            </AppText>
          ) : null}
        </View>
        <SymbolView
          name="chevron.right"
          size={16}
          tintColor={palette.neutral[5]}
        />
      </GroupedCard>
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  face: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
})
