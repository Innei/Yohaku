import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import type { SymbolViewProps } from 'expo-symbols'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, SlotText } from '@/components/ui'
import type { ThinkingRow } from '@/db/schema'
import { useTranslations } from '@/i18n'
import type { Attitude } from '@/interactions/attitude'
import { useThinkingAttitude } from '@/interactions/use-thinking-attitude'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function ThinkingActions({ item }: { item: ThinkingRow }) {
  const t = useTranslations('comment')
  const palette = usePalette()
  const router = useRouter()
  const { current, send, pending } = useThinkingAttitude(item.id)

  const countStyle = (active: boolean) => ({
    ...fonts.sans,
    fontSize: typeScale.label12.size,
    lineHeight: typeScale.label12.lineHeight,
    color: active ? palette.accent : palette.neutral[6],
  })

  const attitudeButton = (
    pressed: Attitude,
    symbol: SymbolViewProps['name'],
    activeSymbol: SymbolViewProps['name'],
    count: number,
  ) => {
    const active = current === pressed
    return (
      <NativePressable
        disabled={pending}
        style={styles.action}
        onPress={() => void send(pressed)}
      >
        <SymbolView
          name={active ? activeSymbol : symbol}
          size={14}
          tintColor={active ? palette.accent : palette.neutral[6]}
        />
        <SlotText textStyle={countStyle(active)} value={count} />
      </NativePressable>
    )
  }

  return (
    <View style={styles.row}>
      {attitudeButton('up', 'hand.thumbsup', 'hand.thumbsup.fill', item.up)}
      {attitudeButton(
        'down',
        'hand.thumbsdown',
        'hand.thumbsdown.fill',
        item.down,
      )}
      <View style={styles.spacer} />
      {item.allowComment ? (
        <NativePressable
          style={styles.action}
          onPress={() => router.push(`/comments/${item.id}`)}
        >
          <SymbolView
            name="bubble.right"
            size={14}
            tintColor={palette.neutral[6]}
          />
          {item.commentsIndex > 0 ? (
            <SlotText
              textStyle={countStyle(false)}
              value={item.commentsIndex}
            />
          ) : (
            <AppText color={palette.neutral[6]} variant="meta">
              {t('title')}
            </AppText>
          )}
        </NativePressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  spacer: {
    flex: 1,
  },
})
