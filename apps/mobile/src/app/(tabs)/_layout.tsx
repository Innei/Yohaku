import { YohakuNative } from '@modules/yohaku'
import { accent, neutral } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import Tabs from 'expo-router/js-tabs'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useEffect, useRef } from 'react'
import { DynamicColorIOS, PixelRatio, useColorScheme } from 'react-native'

import { useSession } from '@/auth/session-store'
import {
  INITIAL_SECRET_TAP,
  nextSecretTap,
  type SecretTapState,
} from '@/components/dev-tools/secret-tap'
import { PaperTabBar } from '@/components/navigation/paper-tab-bar'
import { PaperTabBarInsetProvider } from '@/components/navigation/paper-tab-bar-inset'
import { useTranslations } from '@/i18n'
import { type TabAvatarIconSource, tabAvatarIconSource } from '@/lib/tab-avatar'
import { openDevTools } from '@/screens/dev/open-dev-tools'

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

const tabTint = DynamicColorIOS({ light: accent.light, dark: accent.dark })
const tabInactiveTint = DynamicColorIOS({
  light: neutral.light[6],
  dark: neutral.dark[6],
})

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
  const router = useRouter()
  const session = useSession()
  const avatar = tabAvatar(session?.image)
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
        accessibilityLabel={t('me')}
        listeners={{
          tabPress: onMeSecretTap,
        }}
        name="(me)"
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
        <NativeTabs.Trigger.Label hidden>{t('me')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

function PaperTabsLayout() {
  const t = useTranslations('tabs')
  const router = useRouter()
  const session = useSession()
  const avatar = tabAvatar(session?.image)
  const onMeSecretTap = useMeSecretTap()

  return (
    <PaperTabBarInsetProvider>
      <Tabs
        backBehavior="history"
        initialRouteName="(posts)"
        tabBar={(props) => (
          <PaperTabBar
            {...props}
            avatar={avatar}
            onMeLongPress={() => openDevTools(router)}
          />
        )}
        screenOptions={{
          animation: 'none',
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
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
          name="(me)"
          listeners={{
            tabPress: onMeSecretTap,
          }}
          options={{
            tabBarAccessibilityLabel: t('me'),
            title: t('me'),
          }}
        />
      </Tabs>
    </PaperTabBarInsetProvider>
  )
}

export default function TabsLayout() {
  return YohakuNative.liquidGlassAvailable ? (
    <NativeTabsLayout />
  ) : (
    <PaperTabsLayout />
  )
}
