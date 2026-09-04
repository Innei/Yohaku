import { YohakuNative } from '@modules/yohaku'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { PlatformColor, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  PAPER_TAB_BAR_BOTTOM_GAP,
  PAPER_TAB_BAR_CAPSULE_HEIGHT,
} from '@/components/navigation/paper-tab-bar-inset'
import { t } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { AppText } from './app-text'
import { type Banner, dismissBanner, useBanner } from './banner-store'
import { NativePressable } from './native-pressable'

const BANNER_TAB_GAP = 8
const NATIVE_TAB_BAR_HEIGHT = 49
const systemOrange = PlatformColor('systemOrange')
const tertiaryLabel = PlatformColor('tertiaryLabel')

function bannerBottom(safeBottom: number) {
  if (YohakuNative.liquidGlassAvailable) {
    return safeBottom + NATIVE_TAB_BAR_HEIGHT + BANNER_TAB_GAP
  }
  return (
    safeBottom +
    PAPER_TAB_BAR_BOTTOM_GAP +
    PAPER_TAB_BAR_CAPSULE_HEIGHT +
    BANNER_TAB_GAP
  )
}

function BannerCard({ banner }: { banner: Banner }) {
  const palette = usePalette()
  const glass = isGlassEffectAPIAvailable()
  const inner = (
      <View style={styles.row}>
        <SymbolView
          name="exclamationmark.triangle.fill"
          size={22}
          tintColor={systemOrange}
        />
        <View style={styles.copy}>
          <AppText
            color={palette.neutral[10]}
            numberOfLines={1}
            style={styles.title}
          >
            {banner.title}
          </AppText>
          {banner.message ? (
            <AppText
              color={palette.neutral[7]}
              numberOfLines={2}
              style={styles.message}
            >
              {banner.message}
            </AppText>
          ) : null}
        </View>
        {banner.action ? (
          <NativePressable
            accessibilityLabel={banner.action.title}
            style={styles.retry}
            onPress={banner.action.onPress}
          >
            <AppText color={palette.accent} style={styles.retryLabel}>
              {banner.action.title}
            </AppText>
          </NativePressable>
        ) : null}
        <NativePressable
          accessibilityLabel={t('common', 'close')}
          style={styles.close}
          onPress={dismissBanner}
        >
          <SymbolView
            name="xmark.circle.fill"
            size={22}
            tintColor={tertiaryLabel}
          />
        </NativePressable>
      </View>
  )

  if (glass) {
    return (
      <GlassView
        colorScheme={palette.theme}
        glassEffectStyle="regular"
        style={styles.card}
      >
        {inner}
      </GlassView>
    )
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.capsule[palette.theme],
        },
      ]}
    >
      {inner}
    </View>
  )
}

export function BannerHost() {
  const banner = useBanner()
  const insets = useSafeAreaInsets()
  if (!banner) return null

  return (
    <View
      pointerEvents="box-none"
      style={[styles.slot, { bottom: bannerBottom(insets.bottom) }]}
    >
      <BannerCard banner={banner} />
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: -0.23,
    lineHeight: 20,
  },
  message: {
    ...fonts.sans,
    fontSize: 13,
    letterSpacing: -0.08,
    lineHeight: 18,
    marginTop: 1,
  },
  retry: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  retryLabel: {
    ...fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: -0.23,
    lineHeight: 20,
  },
  close: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: -6,
    width: 44,
  },
})
