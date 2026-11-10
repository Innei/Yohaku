import { YohakuNative } from '@modules/yohaku'
import { type DuoImageSource, isDuo } from '@modules/yohaku/duo-shell'
import { accent, neutral } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import Tabs from 'expo-router/js-tabs'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useEffect, useRef, useState } from 'react'
import {
  DynamicColorIOS,
  Image,
  type ImageSourcePropType,
  PixelRatio,
  Platform,
  useColorScheme,
} from 'react-native'

import {
  INITIAL_SECRET_TAP,
  nextSecretTap,
  type SecretTapState,
} from '@/components/dev-tools/secret-tap'
import { DuoTabs } from '@/components/navigation/duo/navigators'
import { PaperTabBar } from '@/components/navigation/paper-tab-bar'
import { PaperTabBarInsetProvider } from '@/components/navigation/paper-tab-bar-inset'
import { useTranslations } from '@/i18n'
import { type TabAvatarIconSource, tabAvatarIconSource } from '@/lib/tab-avatar'
import { useOwner } from '@/owner/store'
import { openDevTools } from '@/screens/dev/open-dev-tools'
import { tabAccessibilityLabel } from '@/screens/study/guest-card'

const tabIcons = {
  notes: {
    default: require('../../../assets/tabs/quill-pen-line.png'),
    selected: require('../../../assets/tabs/quill-pen-fill.png'),
  },
  posts: {
    default: require('../../../assets/tabs/news-line.png'),
    selected: require('../../../assets/tabs/news-fill.png'),
  },
  thinking: {
    default: require('../../../assets/tabs/bulb-line.png'),
    selected: require('../../../assets/tabs/bulb-fill.png'),
  },
}

// DynamicColorIOS throws on Android, so the native-tab tints only use it on
// iOS; the paper tabs read concrete colours from the palette on both.
const tabTint =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ light: accent.light, dark: accent.dark })
    : accent.light
const tabInactiveTint =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: neutral.light[6],
        dark: neutral.dark[6],
      })
    : neutral.light[6]

function tabAvatar(
  image: string | null | undefined,
): TabAvatarIconSource | undefined {
  return image ? tabAvatarIconSource(image, PixelRatio.get()) : undefined
}

function useMeSecretTap() {
  const router = useRouter()
  const secretTapRef = useRef<SecretTapState>(INITIAL_SECRET_TAP)

  return () => {
    const next = nextSecretTap(secretTapRef.current, Date.now())
    secretTapRef.current = next
    if (next.unlocked) {
      openDevTools(router)
      return
    }
    if (next.count >= 3) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }
}

function NativeTabsLayout() {
  const colorScheme = useColorScheme()
  const t = useTranslations('tabs')
  const tStudy = useTranslations('study')
  const router = useRouter()
  const owner = useOwner()
  const avatar = tabAvatar(owner?.avatarUrl)
  const studyLabel = tabAccessibilityLabel(owner, tStudy('tabFallback'))
  const onMeSecretTap = useMeSecretTap()

  useEffect(() => {
    YohakuNative.configureCompactNativeTabBar()
  }, [avatar, colorScheme])

  useEffect(() => {
    const sub = YohakuNative.addListener('onMeTabLongPress', () => {
      openDevTools(router)
    })
    return () => sub.remove()
  }, [router])

  return (
    <NativeTabs
      iconColor={{ default: tabInactiveTint, selected: tabTint }}
      minimizeBehavior="never"
      tintColor={tabTint}
    >
      <NativeTabs.Trigger accessibilityLabel={t('posts')} name="(posts)">
        <NativeTabs.Trigger.Icon
          renderingMode="template"
          src={tabIcons.posts}
        />
        <NativeTabs.Trigger.Label hidden>{t('posts')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger accessibilityLabel={t('notes')} name="(notes)">
        <NativeTabs.Trigger.Icon
          renderingMode="template"
          src={tabIcons.notes}
        />
        <NativeTabs.Trigger.Label hidden>{t('notes')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger accessibilityLabel={t('thinking')} name="(thinking)">
        <NativeTabs.Trigger.Icon
          renderingMode="template"
          src={tabIcons.thinking}
        />
        <NativeTabs.Trigger.Label hidden>
          {t('thinking')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        accessibilityLabel={studyLabel}
        name="(study)"
        listeners={{
          tabPress: onMeSecretTap,
        }}
      >
        {avatar ? (
          <NativeTabs.Trigger.Icon renderingMode="original" src={avatar} />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{
              default: 'person.crop.circle',
              selected: 'person.crop.circle.fill',
            }}
          />
        )}
        <NativeTabs.Trigger.Label hidden>{studyLabel}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

function PaperTabsLayout() {
  const t = useTranslations('tabs')
  const tStudy = useTranslations('study')
  const router = useRouter()
  const owner = useOwner()
  const avatar = tabAvatar(owner?.avatarUrl)
  const studyLabel = tabAccessibilityLabel(owner, tStudy('tabFallback'))
  const onMeSecretTap = useMeSecretTap()

  return (
    <PaperTabBarInsetProvider>
      <Tabs
        backBehavior="history"
        screenOptions={{
          animation: 'none',
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <PaperTabBar
            {...props}
            avatar={avatar}
            onMeLongPress={() => openDevTools(router)}
          />
        )}
      >
        <Tabs.Screen
          name="(posts)"
          options={{
            tabBarAccessibilityLabel: t('posts'),
            title: t('posts'),
          }}
        />
        <Tabs.Screen
          name="(notes)"
          options={{
            tabBarAccessibilityLabel: t('notes'),
            title: t('notes'),
          }}
        />
        <Tabs.Screen
          name="(thinking)"
          options={{
            tabBarAccessibilityLabel: t('thinking'),
            title: t('thinking'),
          }}
        />
        <Tabs.Screen
          name="(study)"
          listeners={{
            tabPress: onMeSecretTap,
          }}
          options={{
            tabBarAccessibilityLabel: studyLabel,
            title: studyLabel,
          }}
        />
      </Tabs>
    </PaperTabBarInsetProvider>
  )
}

function duoIcon(source: ImageSourcePropType): DuoImageSource | undefined {
  const resolved = Image.resolveAssetSource(source)
  return resolved
    ? {
        height: resolved.height,
        scale: resolved.scale,
        uri: resolved.uri,
        width: resolved.width,
      }
    : undefined
}

const duoTabIcons = {
  notes: {
    default: duoIcon(tabIcons.notes.default),
    selected: duoIcon(tabIcons.notes.selected),
  },
  posts: {
    default: duoIcon(tabIcons.posts.default),
    selected: duoIcon(tabIcons.posts.selected),
  },
  thinking: {
    default: duoIcon(tabIcons.thinking.default),
    selected: duoIcon(tabIcons.thinking.selected),
  },
}

function useDuoAvatarIcon(avatarUrl: string | null | undefined) {
  const [icon, setIcon] = useState<{ source: DuoImageSource; url: string }>()
  useEffect(() => {
    if (!avatarUrl) return
    let cancelled = false
    void YohakuNative.circularImageUri(avatarUrl).then((source) => {
      if (!cancelled) setIcon({ source, url: avatarUrl })
    })
    return () => {
      cancelled = true
    }
  }, [avatarUrl])
  return icon && icon.url === avatarUrl ? icon.source : undefined
}

function DuoTabsLayout() {
  const colorScheme = useColorScheme()
  const t = useTranslations('tabs')
  const tStudy = useTranslations('study')
  const owner = useOwner()
  const studyLabel = tabAccessibilityLabel(owner, tStudy('tabFallback'))
  const avatar = useDuoAvatarIcon(owner?.avatarUrl)
  const dark = colorScheme === 'dark'

  return (
    <DuoTabs
      activeTintColor={dark ? accent.dark : accent.light}
      inactiveTintColor={dark ? neutral.dark[6] : neutral.light[6]}
    >
      <DuoTabs.Screen
        name="(posts)"
        options={{
          icon: duoTabIcons.posts.default,
          selectedIcon: duoTabIcons.posts.selected,
          title: t('posts'),
        }}
      />
      <DuoTabs.Screen
        name="(notes)"
        options={{
          icon: duoTabIcons.notes.default,
          selectedIcon: duoTabIcons.notes.selected,
          title: t('notes'),
        }}
      />
      <DuoTabs.Screen
        name="(thinking)"
        options={{
          icon: duoTabIcons.thinking.default,
          selectedIcon: duoTabIcons.thinking.selected,
          title: t('thinking'),
        }}
      />
      <DuoTabs.Screen
        name="(study)"
        options={
          avatar
            ? { icon: avatar, iconRenderingMode: 'original', title: studyLabel }
            : {
                selectedSystemImage: 'person.crop.circle.fill',
                systemImage: 'person.crop.circle',
                title: studyLabel,
              }
        }
      />
    </DuoTabs>
  )
}

export default function TabsLayout() {
  if (isDuo) return <DuoTabsLayout />
  return YohakuNative.liquidGlassAvailable ? (
    <NativeTabsLayout />
  ) : (
    <PaperTabsLayout />
  )
}
