import type { NativeStackNavigationOptions } from 'expo-router/native-stack'
import { Platform } from 'react-native'

import { parseTocDetents } from '@/lib/article-toc'
import { timings } from '@/theme/motion'

type RootScreen = {
  name: string
  options:
    | NativeStackNavigationOptions
    | ((props: {
        route: { params?: object }
      }) => NativeStackNavigationOptions)
}

export function rootScreens(deskColor: string): RootScreen[] {
  return [
    { name: '(tabs)', options: { headerShown: false } },
    {
      name: 'reader',
      options: {
        headerTransparent: false,
        headerStyle: { backgroundColor: deskColor },
        presentation: 'formSheet',
        sheetAllowedDetents: [1],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'search',
      options: { animation: 'fade', animationDuration: timings.fade.duration },
    },
    {
      name: 'dev',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.72, 1],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'dev-demos',
      options: {
        animation: 'slide_from_right',
        headerShown: false,
        presentation: 'fullScreenModal',
      },
    },
    {
      name: 'dev-duo',
      options: {
        animation: 'none',
        headerShown: false,
        presentation: 'fullScreenModal',
      },
    },
    {
      name: 'comments/[id]',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.75, 1],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'login',
      options: {
        headerShown: false,
        // On Android a formSheet keeps the screen underneath interactive in
        // the area it does not cover, and that native surface swallows the
        // taps aimed at the provider buttons. A full-screen modal gives the
        // sheet its own window, so the social buttons are reachable.
        presentation: Platform.OS === 'android' ? 'fullScreenModal' : 'formSheet',
        ...(Platform.OS === 'android'
          ? { animation: 'slide_from_bottom' as const }
          : {
              sheetAllowedDetents: [0.72, 1],
              sheetGrabberVisible: true,
            }),
      },
    },
    {
      name: 'desk',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.42],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'summary/[kind]/[id]',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.62, 1],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'insights/[kind]/[id]',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.72, 1],
        sheetGrabberVisible: true,
      },
    },
    {
      name: 'selection-comment',
      options: {
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: [0.5, 1],
        sheetGrabberVisible: true,
        sheetLargestUndimmedDetentIndex: 0,
      },
    },
    {
      name: 'toc',
      options: ({ route }) => ({
        headerShown: false,
        presentation: 'formSheet',
        sheetAllowedDetents: parseTocDetents(route.params),
        sheetGrabberVisible: true,
      }),
    },
  ]
}
