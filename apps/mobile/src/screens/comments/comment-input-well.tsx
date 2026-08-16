import { Pressable, StyleSheet, View } from 'react-native'

import { AppText, Button, WellInput } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { CommentLoginInline } from './comment-login-inline'

export const MAX_COMMENT_LENGTH = 500

export function CommentInputWell({
  busy,
  error,
  replyToName,
  signedIn,
  value,
  onCancelReply,
  onChangeText,
  onSend,
}: {
  busy: boolean
  error: string | null
  replyToName: string | null
  signedIn: boolean
  value: string
  onCancelReply: () => void
  onChangeText: (text: string) => void
  onSend: () => void
}) {
  const t = useTranslations('comment')
  const palette = usePalette()

  if (!signedIn) {
    return <CommentLoginInline />
  }

  const length = value.length

  return (
    <View style={styles.wrap}>
      {replyToName ? (
        <View style={styles.replyChip}>
          <AppText color={palette.neutral[7]} variant="meta">
            {t('replyingTo', { name: replyToName })}
          </AppText>
          <Pressable hitSlop={10} onPress={onCancelReply}>
            <AppText color={palette.neutral[6]} variant="meta">
              ✕
            </AppText>
          </Pressable>
        </View>
      ) : null}
      <WellInput
        multiline
        editable={!busy}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={replyToName ? t('replyPlaceholder') : t('placeholder')}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      <View style={styles.actionRow}>
        {error ? (
          <AppText
            color={palette.semantic.error}
            style={styles.error}
            variant="meta"
          >
            {error}
          </AppText>
        ) : length > MAX_COMMENT_LENGTH - 100 ? (
          <AppText color={palette.neutral[5]} variant="meta">
            {length}/{MAX_COMMENT_LENGTH}
          </AppText>
        ) : (
          <View />
        )}
        <Button
          disabled={busy || value.trim().length === 0}
          label={busy ? t('sending') : t('send')}
          style={styles.send}
          onPress={onSend}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  input: {
    minHeight: 72,
    maxHeight: 140,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  error: {
    flexShrink: 1,
  },
  send: {
    height: 36,
    paddingHorizontal: 18,
  },
})
