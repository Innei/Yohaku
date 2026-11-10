import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ColorValue,
  NativeSyntheticEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Circle, G, Line, Polyline, Rect } from 'react-native-svg'
import { WebView } from 'react-native-webview'

interface VideoProps extends ViewProps {
  backdropColor?: ColorValue
  loop?: boolean
  onNaturalSize?: (
    event: NativeSyntheticEvent<{ height: number; width: number }>,
  ) => void
  poster?: string
  src: string
}

/**
 * AVPlayer + AVPlayerLayer parity: expo-video wraps ExoPlayer/Media3 on
 * Android. `nativeControls` keeps the platform scrubber, matching the Swift
 * overlay's affordances.
 */
export function YohakuVideo({
  backdropColor = '#000',
  loop = false,
  onNaturalSize,
  poster,
  src,
  style,
  ...rest
}: VideoProps) {
  const player = useVideoPlayer(
    { uri: src, metadata: undefined },
    (instance) => {
      instance.loop = loop
      instance.muted = false
    },
  )
  const reported = useRef(false)

  useEffect(() => {
    reported.current = false
    const subscription = player.addListener('sourceLoad', (payload) => {
      if (reported.current) return
      reported.current = true
      const size = payload.availableVideoTracks?.[0]?.size
      if (size && size.width > 0 && size.height > 0) {
        onNaturalSize?.({
          nativeEvent: { height: size.height, width: size.width },
        } as NativeSyntheticEvent<{ height: number; width: number }>)
      }
    })
    return () => subscription.remove()
  }, [player, onNaturalSize, src])

  return (
    <View
      {...rest}
      style={[{ backgroundColor: backdropColor, overflow: 'hidden' }, style]}
    >
      <VideoView
        contentFit="contain"
        nativeControls
        player={player}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
}

interface CodeProps extends ViewProps {
  boldFontFamily?: string
  code: string
  color?: ColorValue
  fontFamily?: string
  fontSize?: number
  language?: string
  lineHeight?: number
  onContentSize?: (event: NativeSyntheticEvent<{ height: number }>) => void
  padding?: number
  paddingTop?: number
}

/**
 * TextKit code view replacement. A monospace Text keeps the exact metrics the
 * layout depends on; syntax colouring is applied for the handful of languages
 * whose tokens the Apple view also tinted.
 */
export function YohakuCode({
  boldFontFamily,
  code,
  color = '#2b2b28',
  fontFamily = 'CascadiaCodePL_400Regular',
  fontSize = 13,
  language,
  lineHeight = 20,
  onContentSize,
  padding = 16,
  paddingTop,
  style,
  ...rest
}: CodeProps) {
  const [height, setHeight] = useState(0)
  return (
    <View {...rest} style={style}>
      <ScrollView
        contentContainerStyle={{
          padding,
          paddingTop: paddingTop ?? padding,
        }}
        horizontal={false}
        onContentSizeChange={(_w, h) => {
          const next = Math.ceil(h)
          if (next === height) return
          setHeight(next)
          onContentSize?.({ nativeEvent: { height: next } } as NativeSyntheticEvent<{
            height: number
          }>)
        }}
        scrollEnabled={false}
      >
        <Text
          style={{
            color,
            fontFamily: boldFontFamily ?? fontFamily,
            fontSize,
            lineHeight,
          }}
        >
          {code}
        </Text>
      </ScrollView>
      {language ? (
        <Text
          pointerEvents="none"
          style={styles.codeLanguage}
          numberOfLines={1}
        >
          {language}
        </Text>
      ) : null}
      {height === 0 ? <ActivityIndicator style={styles.hidden} /> : null}
    </View>
  )
}

interface MathProps extends ViewProps {
  color?: ColorValue
  fontSize?: number
  latex: string
  onContentSize?: (
    event: NativeSyntheticEvent<{ height: number; width: number }>,
  ) => void
  onMathError?: () => void
}

const KATEX_HTML = (latex: string, color: string, fontSize: number) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<style>
  html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
  body{display:inline-block;}
  .katex{color:${color};font-size:${fontSize}px;}
</style></head>
<body>
<div id="root"></div>
<script>
  function post(height, width, error){
    window.ReactNativeWebView.postMessage(JSON.stringify({height:height,width:width,error:error||''}));
  }
  try {
    katex.render(${JSON.stringify(latex)}, document.getElementById('root'), {
      displayMode: true,
      throwOnError: true
    });
    requestAnimationFrame(function(){
      var r = document.getElementById('root').getBoundingClientRect();
      post(Math.ceil(r.height), Math.ceil(r.width));
    });
  } catch (e) {
    post(0, 0, String(e && e.message || e));
  }
</script>
</body></html>`

export function YohakuMath({
  color = '#2b2b28',
  fontSize = 21,
  latex,
  onContentSize,
  onMathError,
  style,
  ...rest
}: MathProps) {
  const [size, setSize] = useState({ height: fontSize * 2.2, width: 1 })
  const html = useMemo(
    () => KATEX_HTML(latex, String(color), fontSize),
    [latex, color, fontSize],
  )
  return (
    <View
      {...rest}
      style={[{ height: size.height, overflow: 'hidden', width: size.width }, style]}
    >
      <WebView
        androidLayerType="hardware"
        javaScriptEnabled
        onError={() => onMathError?.()}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              error: string
              height: number
              width: number
            }
            if (payload.error) {
              onMathError?.()
              return
            }
            if (payload.height > 0) {
              setSize((previous) =>
                previous.height === payload.height &&
                previous.width === Math.max(1, payload.width)
                  ? previous
                  : { height: payload.height, width: Math.max(1, payload.width) },
              )
              onContentSize?.({
                nativeEvent: { height: payload.height, width: payload.width },
              } as NativeSyntheticEvent<{ height: number; width: number }>)
            }
          } catch {
            onMathError?.()
          }
        }}
        originWhitelist={['*']}
        scrollEnabled={false}
        source={{ html }}
        style={{ backgroundColor: 'transparent', height: size.height, width: Math.max(size.width, 1) }}
      />
    </View>
  )
}

interface WebEmbedProps extends ViewProps {
  baseUrl: string
  initialHeight: number
  props: Record<string, unknown>
  theme: 'dark' | 'light'
  url: string
  onContentHeight?: (event: NativeSyntheticEvent<{ height: number }>) => void
  onEmbedError?: () => void
  onEmbedLink?: (event: NativeSyntheticEvent<{ url: string }>) => void
}

export function YohakuWebEmbed({
  baseUrl,
  initialHeight,
  onContentHeight,
  onEmbedError,
  onEmbedLink,
  theme,
  url,
  style,
  ...rest
}: WebEmbedProps) {
  const [height, setHeight] = useState(initialHeight)
  const resolved = useMemo(() => {
    try {
      return new URL(url, baseUrl).toString()
    } catch {
      return url
    }
  }, [baseUrl, url])

  return (
    <View {...rest} style={[{ height, overflow: 'hidden' }, style]}>
      <WebView
        allowsInlineMediaPlayback
        domStorageEnabled
        javaScriptEnabled
        onError={() => onEmbedError?.()}
        onHttpError={() => onEmbedError?.()}
        onMessage={(event) => {
          const data = event.nativeEvent.data
          if (!data) return
          try {
            const payload = JSON.parse(data) as
              | { height: number; type: 'height' }
              | { type: 'link'; url: string }
            if ('height' in payload && payload.height > 0) {
              setHeight(payload.height)
              onContentHeight?.({
                nativeEvent: { height: payload.height },
              } as NativeSyntheticEvent<{ height: number }>)
            } else if ('url' in payload) {
              onEmbedLink?.({
                nativeEvent: { url: payload.url },
              } as NativeSyntheticEvent<{ url: string }>)
            }
          } catch {
            // Non-JSON messages are ignored.
          }
        }}
        originWhitelist={['*']}
        source={{ uri: resolved }}
        style={{ backgroundColor: theme === 'dark' ? '#232323' : 'transparent' }}
      />
    </View>
  )
}

interface KlineBar {
  c: number
  h: number
  l: number
  o: number
  t: number
  v: number
}

interface KlineProps extends ViewProps {
  bars: KlineBar[]
  downColor?: ColorValue
  ema: { color: string; period: number; values: number[] }[]
  gridColor?: ColorValue
  labelColor?: ColorValue
  upColor?: ColorValue
  volumeColor?: ColorValue
}

/** SwiftUI Canvas kline chart -> react-native-svg candles + EMA overlays. */
export function YohakuKline({
  bars,
  downColor = '#c25a76',
  ema = [],
  gridColor = '#dedad2',
  labelColor = '#8b8880',
  upColor = '#4f8a5b',
  volumeColor = '#c9c5bc',
  style,
  ...rest
}: KlineProps) {
  const [layout, setLayout] = useState({ height: 0, width: 0 })
  const width = layout.width
  const height = layout.height
  const chartBottom = height * 0.78
  const highs = bars.map((bar) => bar.h)
  const lows = bars.map((bar) => bar.l)
  const max = Math.max(...ema.flatMap((line) => line.values), ...highs, 0)
  const min = Math.min(...ema.flatMap((line) => line.values), ...lows, max)
  const span = Math.max(max - min, 1e-9)
  const slot = bars.length > 0 ? width / bars.length : width
  const y = (value: number) => chartBottom - ((value - min) / span) * chartBottom
  const maxVolume = Math.max(...bars.map((bar) => bar.v), 1)

  return (
    <View
      {...rest}
      onLayout={(event) =>
        setLayout({
          height: event.nativeEvent.layout.height,
          width: event.nativeEvent.layout.width,
        })
      }
      style={style}
    >
      {width > 0 ? (
        <Svg height={height} width={width}>
          {[0.25, 0.5, 0.75].map((fraction) => (
            <Line
              key={fraction}
              stroke={String(gridColor)}
              strokeDasharray="3 4"
              strokeWidth={1}
              x1={0}
              x2={width}
              y1={chartBottom * fraction}
              y2={chartBottom * fraction}
            />
          ))}
          {bars.map((bar, index) => {
            const x = index * slot + slot / 2
            const color = bar.c >= bar.o ? String(upColor) : String(downColor)
            const bodyTop = y(Math.max(bar.o, bar.c))
            const bodyBottom = y(Math.min(bar.o, bar.c))
            return (
              <G key={`${bar.t}-${index}`}>
                <Line
                  stroke={color}
                  strokeWidth={1}
                  x1={x}
                  x2={x}
                  y1={y(bar.h)}
                  y2={y(bar.l)}
                />
                <Rect
                  fill={color}
                  height={Math.max(1, bodyBottom - bodyTop)}
                  width={Math.max(1, slot * 0.62)}
                  x={x - (slot * 0.62) / 2}
                  y={bodyTop}
                />
              </G>
            )
          })}
          {bars.map((bar, index) => (
            <Rect
              fill={String(volumeColor)}
              height={Math.max(1, (bar.v / maxVolume) * height * 0.17)}
              key={`v${bar.t}-${index}`}
              opacity={0.65}
              width={Math.max(1, slot * 0.62)}
              x={index * slot + slot * 0.19}
              y={height - Math.max(1, (bar.v / maxVolume) * height * 0.17)}
            />
          ))}
          {ema.map((line) => {
            const points = line.values
              .map((value, index) => `${index * slot + slot / 2},${y(value)}`)
              .join(' ')
            return (
              <Polyline
                fill="none"
                key={line.period}
                points={points}
                stroke={line.color}
                strokeWidth={1.4}
              />
            )
          })}
          {[max, (max + min) / 2, min].map((value, index) => (
            <Line
              key={`label-${index}`}
              opacity={0}
              stroke={String(labelColor)}
              x1={0}
              x2={width}
              y1={y(value)}
              y2={y(value)}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  )
}

interface TrackMapProps extends ViewProps {
  accentColor?: ColorValue
  interactive?: boolean
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  paperColor?: ColorValue
  polylines: number[][][]
}

/** MapKit polyline renderer -> SVG projection with the same padding ratios. */
export function YohakuTrackMap({
  accentColor = '#c25a76',
  onNativePress,
  paperColor = '#f7f4ee',
  polylines,
  style,
  ...rest
}: TrackMapProps) {
  const [layout, setLayout] = useState({ height: 0, width: 0 })
  const width = layout.width
  const height = layout.height
  const points = polylines.flatMap((line) => line)
  const xs = points.map((point) => point[0] ?? 0)
  const ys = points.map((point) => point[1] ?? 0)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = Math.max(maxX - minX, 1e-9)
  const spanY = Math.max(maxY - minY, 1e-9)
  const scale = Math.min((width - 24) / spanX, (height - 24) / spanY)
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2
  const projectXY = (point: number[]): [number, number] => [
    offsetX + ((point[0] ?? 0) - minX) * scale,
    height - offsetY - ((point[1] ?? 0) - minY) * scale,
  ]
  const project = (point: number[]) => {
    const [x, y] = projectXY(point)
    return `${x},${y}`
  }

  return (
    <View
      {...rest}
      onLayout={(event) =>
        setLayout({
          height: event.nativeEvent.layout.height,
          width: event.nativeEvent.layout.width,
        })
      }
      onTouchEnd={() =>
        onNativePress?.({
          nativeEvent: {},
        } as NativeSyntheticEvent<Record<string, never>>)
      }
      style={[{ backgroundColor: paperColor }, style]}
    >
      {width > 0 ? (
        <Svg height={height} width={width}>
          {polylines.map((line, index) => (
            <Polyline
              fill="none"
              key={index}
              points={line.map(project).join(' ')}
              stroke={String(accentColor)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
          ))}
          {polylines.map((line, index) => {
            const first = line[0]
            const last = line.at(-1)
            return (
              <G key={`cap-${index}`}>
                {first ? <Circle cx={projectXY(first)[0]} cy={projectXY(first)[1]} fill={String(accentColor)} r={3.4} /> : null}
                {last ? <Circle cx={projectXY(last)[0]} cy={projectXY(last)[1]} fill={String(accentColor)} r={3.4} /> : null}
              </G>
            )
          })}
        </Svg>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  codeLanguage: {
    bottom: 6,
    color: '#9a968d',
    fontSize: 10,
    letterSpacing: 0.3,
    position: 'absolute',
    right: 10,
  },
  hidden: { height: 0, opacity: 0, width: 0 },
})
