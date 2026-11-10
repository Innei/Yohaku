import { Image } from 'expo-image'
import { useSyncExternalStore } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SymbolView } from 'expo-symbols'

import { usePalette } from '@/theme/palette'

import {
  closeImagePreview,
  getImagePreview,
  subscribeImagePreview,
} from '@/lib/image-preview-store'

/**
 * Android stand-in for the native SDWebImage preview controller used by
 * `presentImagePreview`. Mounted once at the root.
 */
export function ImagePreviewHost() {
  const request = useSyncExternalStore(subscribeImagePreview, getImagePreview)
  const palette = usePalette()
  const insets = useSafeAreaInsets()

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeImagePreview}
      statusBarTranslucent
      transparent
      visible={request !== null}
    >
      <View style={styles.backdrop}>
        {request ? (
          <>
            <Image
              contentFit={request.objectFit ?? 'contain'}
              source={
                request.siteReferer
                  ? { headers: { Referer: request.siteReferer }, uri: request.urls[request.index] ?? '' }
                  : { uri: request.urls[request.index] ?? '' }
              }
              style={styles.image}
            />
            <View style={[styles.chrome, { paddingTop: insets.top + 8 }]}>
              <Text style={styles.counter}>
                {request.index + 1} / {request.urls.length}
              </Text>
              <Pressable
                accessibilityLabel="close"
                hitSlop={12}
                onPress={closeImagePreview}
                style={[styles.close, { backgroundColor: palette.neutral[2] }]}
              >
                <SymbolView name="xmark" size={16} tintColor={palette.neutral[9]} />
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(12,12,11,0.94)',
    flex: 1,
  },
  chrome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 20,
    position: 'absolute',
    right: 20,
    top: 0,
  },
  close: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  counter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  image: {
    flex: 1,
  },
})
