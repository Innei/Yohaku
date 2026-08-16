import { Image } from 'expo-image'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { SymbolView } from 'expo-symbols'
import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { NativePressable } from '@/components/ui'
import type { TabAvatarIconSource } from '@/lib/tab-avatar'
import { springs } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import {
  PAPER_TAB_BAR_BOTTOM_GAP,
  PAPER_TAB_BAR_CAPSULE_HEIGHT,
  PAPER_TAB_BAR_SCROLL_EDGE_BLEED,
} from './paper-tab-bar-inset'

const CAPSULE_MAX_WIDTH = 328
const CAPSULE_SIDE_MARGIN = 16
const SELECTION_INSET = 6
const TAB_COUNT = 4

const tabIcons = {
  '(notes)': {
    default: require('../../../assets/tabs/quill-pen-line.png'),
    selected: require('../../../assets/tabs/quill-pen-fill.png'),
  },
  '(posts)': {
    default: require('../../../assets/tabs/news-line.png'),
    selected: require('../../../assets/tabs/news-fill.png'),
  },
  '(thinking)': {
    default: require('../../../assets/tabs/bulb-line.png'),
    selected: require('../../../assets/tabs/bulb-fill.png'),
  },
} as const

type IllustratedTab = keyof typeof tabIcons

function isIllustratedTab(name: string): name is IllustratedTab {
  return name in tabIcons
}

function TabIcon({
  avatar,
  focused,
  routeName,
}: {
  avatar?: TabAvatarIconSource
  focused: boolean
  routeName: string
}) {
  const palette = usePalette()
  const tintColor = focused ? palette.accent : palette.neutral[6]

  if (routeName === '(me)') {
    if (avatar) {
      return <Image source={avatar} style={styles.avatar} />
    }

    return (
      <SymbolView
        name={focused ? 'person.crop.circle.fill' : 'person.crop.circle'}
        size={26}
        tintColor={tintColor}
      />
    )
  }

  if (!isIllustratedTab(routeName)) return null
  const source = tabIcons[routeName]

  return (
    <Image
      source={focused ? source.selected : source.default}
      style={styles.icon}
      tintColor={tintColor}
    />
  )
}

export function PaperTabBar({
  avatar,
  descriptors,
  insets,
  navigation,
  state,
}: BottomTabBarProps & { avatar?: TabAvatarIconSource }) {
  const palette = usePalette()
  const { width: viewportWidth } = useWindowDimensions()
  const activeSurface = palette.theme === 'dark' ? palette.neutral[3] : '#fff'
  const capsuleWidth = Math.min(
    CAPSULE_MAX_WIDTH,
    viewportWidth - CAPSULE_SIDE_MARGIN * 2,
  )
  const slotWidth = capsuleWidth / TAB_COUNT
  const selectedOffset = useSharedValue(state.index * slotWidth)

  useEffect(() => {
    selectedOffset.value = withSpring(state.index * slotWidth, springs.glide)
  }, [selectedOffset, slotWidth, state.index])

  const selectionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectedOffset.value }],
  }))
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          height:
            PAPER_TAB_BAR_CAPSULE_HEIGHT +
            insets.bottom +
            PAPER_TAB_BAR_BOTTOM_GAP +
            PAPER_TAB_BAR_SCROLL_EDGE_BLEED,
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        style={[
          styles.capsule,
          {
            backgroundColor: palette.surface.paper,
            boxShadow: shadow.capsule[palette.theme],
            width: capsuleWidth,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selection,
            {
              backgroundColor: activeSurface,
              boxShadow: shadow.paperSmall[palette.theme],
              width: slotWidth - SELECTION_INSET * 2,
            },
            selectionStyle,
          ]}
        />

        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]
          const options = descriptor.options
          const focused = state.index === index
          const accessibilityLabel =
            options.tabBarAccessibilityLabel ??
            (typeof options.title === 'string' ? options.title : route.name)

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            })

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          return (
            <NativePressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={route.key}
              style={[styles.tab, { width: slotWidth }]}
              testID={`paper-tab-${route.name.replaceAll(/[()]/g, '')}`}
              onPress={onPress}
            >
              <TabIcon
                avatar={avatar}
                focused={focused}
                routeName={route.name}
              />
            </NativePressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  dock: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    paddingTop: PAPER_TAB_BAR_SCROLL_EDGE_BLEED,
    zIndex: 1,
  },
  capsule: {
    borderCurve: 'continuous',
    borderRadius: PAPER_TAB_BAR_CAPSULE_HEIGHT / 2,
    flexDirection: 'row',
    height: PAPER_TAB_BAR_CAPSULE_HEIGHT,
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  selection: {
    borderCurve: 'continuous',
    borderRadius: (PAPER_TAB_BAR_CAPSULE_HEIGHT - SELECTION_INSET * 2) / 2,
    height: PAPER_TAB_BAR_CAPSULE_HEIGHT - SELECTION_INSET * 2,
    left: SELECTION_INSET,
    position: 'absolute',
    top: SELECTION_INSET,
  },
  tab: {
    alignItems: 'center',
    height: PAPER_TAB_BAR_CAPSULE_HEIGHT,
    justifyContent: 'center',
  },
  icon: {
    height: 24,
    width: 24,
  },
  avatar: {
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 28,
    width: 28,
  },
})
