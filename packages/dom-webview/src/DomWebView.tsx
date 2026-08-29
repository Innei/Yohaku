import { requireNativeViewManager } from 'expo-modules-core'
import * as React from 'react'
import { Image, View } from 'react-native'

import type { DomWebViewProps, DomWebViewRef } from './DomWebView.types'
import { buildMediaRewriteScript } from './site-referer'
import { webviewStyles } from './styles'

const { resolveAssetSource } = Image

type NativeWebViewProps = Omit<
  DomWebViewProps,
  'containerStyle' | 'injectedJavaScriptObject'
> & {
  injectedJavaScriptObject: string
}

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

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (params) => viewRef.current?.scrollTo(params),
        injectJavaScript: (script: string) =>
          viewRef.current?.injectJavaScript(script),
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
