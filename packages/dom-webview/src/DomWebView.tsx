import { requireNativeViewManager } from 'expo-modules-core'
import * as React from 'react'
import { Image, View } from 'react-native'

import type { DomWebViewProps, DomWebViewRef } from './DomWebView.types'
import { createInjectionQueue } from './injection-queue'
import { buildMediaRewriteScript } from './site-referer'
import { webviewStyles } from './styles'

const INJECTION_RETRY_MS = 16

const { resolveAssetSource } = Image

type NativeWebViewProps = Omit<
  DomWebViewProps,
  'containerStyle' | 'injectedJavaScriptObject'
> & {
  injectedJavaScriptObject: string
}

// Every method on the native view is an expo `AsyncFunction`, so it settles
// rather than returning — the injection queue's retry loop is built on that
// promise, and a `void` here would leave every script retried to exhaustion.
type NativeDomWebViewRef = {
  [K in keyof DomWebViewRef]: (
    ...args: Parameters<DomWebViewRef[K]>
  ) => Promise<void>
}

const NativeWebView: React.ComponentType<
  React.PropsWithoutRef<NativeWebViewProps> &
    React.RefAttributes<NativeDomWebViewRef>
> = requireNativeViewManager('ExpoDomWebViewModule')

const WebView = React.forwardRef<DomWebViewRef, DomWebViewProps>(
  (
    {
      containerStyle,
      injectedJavaScriptBeforeContentLoaded,
      injectedJavaScriptObject,
      siteReferer,
      style,
      ...props
    },
    ref,
  ) => {
    const viewRef = React.useRef<NativeDomWebViewRef>(null)
    const injectionQueue = React.useRef<ReturnType<
      typeof createInjectionQueue
    > | null>(null)
    injectionQueue.current ??= createInjectionQueue({
      onDrop: (reason, script) => {
        console.warn(
          `[dom-webview] dropped an injection (${reason}): ${script.slice(0, 80)}`,
        )
      },
      schedule: (run) => {
        setTimeout(run, INJECTION_RETRY_MS)
      },
      send: (script) => viewRef.current?.injectJavaScript(script),
    })

    React.useEffect(() => () => injectionQueue.current?.dispose(), [])

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (params) => viewRef.current?.scrollTo(params),
        injectJavaScript: (script: string) =>
          injectionQueue.current?.push(script),
        reload: () => viewRef.current?.reload(),
      }),
      [],
    )

    const webViewStyles = [
      webviewStyles.container,
      webviewStyles.webView,
      style,
    ]
    const webViewContainerStyle = [webviewStyles.container, containerStyle]

    const resolvedSource = resolveAssetSource(props.source)

    return (
      <View style={webViewContainerStyle}>
        <NativeWebView
          {...props}
          ref={viewRef}
          source={resolvedSource}
          style={webViewStyles}
          siteReferer={siteReferer}
          injectedJavaScriptBeforeContentLoaded={`${buildMediaRewriteScript(siteReferer ?? '')}${injectedJavaScriptBeforeContentLoaded ?? ''}`}
          injectedJavaScriptObject={JSON.stringify(
            injectedJavaScriptObject ?? {},
          )}
        />
      </View>
    )
  },
)

export default WebView
