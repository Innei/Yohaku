import { StyleSheet, View } from 'react-native'

import { AppText, MarkdownBody } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import type { BlockProps } from './types'

interface Participant {
  id: string
  kind?: 'agent' | 'user'
  name?: string
}

interface Message {
  content: string
  id: string
  participantId: string
}

function Turn({
  align,
  content,
  dot,
  name,
}: {
  align: 'left' | 'right'
  content: string
  dot?: boolean
  name?: string
}) {
  const palette = usePalette()
  const doc = useRichDocument()
  const right = align === 'right'
  return (
    <View style={[styles.turn, right && styles.turnRight]}>
      {name ? (
        <View style={styles.name}>
          {dot ? (
            <View style={[styles.dot, { backgroundColor: palette.accent }]} />
          ) : null}
          <AppText color={palette.neutral[6]} style={[styles.nameText, fonts.mono]}>
            {name}
          </AppText>
        </View>
      ) : null}
      <View
        style={
          right
            ? [styles.bubble, { backgroundColor: palette.neutral[2] }]
            : styles.body
        }
      >
        <MarkdownBody
          fontSize={15}
          lineHeight={right ? 24 : 25}
          markdown={content}
          onLinkPress={(url) => {
            doc.onLinkPress?.(url)
            return true
          }}
        />
      </View>
    </View>
  )
}

export function ChatBlock({ node }: BlockProps) {
  const palette = usePalette()
  const participants = (node.participants as Participant[] | undefined) ?? []
  const messages = (node.messages as Message[] | undefined) ?? []
  const variant = node.variant === 'user-agent' ? 'user-agent' : 'user-user'

  if (messages.length === 0) {
    return (
      <AppText color={palette.neutral[7]} style={styles.empty} variant="meta">
        Empty chat
      </AppText>
    )
  }

  return (
    <View style={styles.wrap}>
      {messages.map((message) => {
        const participant = participants.find(
          (item) => item.id === message.participantId,
        )
        if (variant === 'user-agent') {
          if (participant?.kind === 'agent') {
            return (
              <Turn
                dot
                align="left"
                content={message.content}
                key={message.id}
                name={participant.name ?? 'Assistant'}
              />
            )
          }
          return (
            <Turn align="right" content={message.content} key={message.id} />
          )
        }
        const right =
          participants.findIndex(
            (item) => item.id === message.participantId,
          ) === 1
        return (
          <Turn
            align={right ? 'right' : 'left'}
            content={message.content}
            key={message.id}
            name={
              participant?.name ??
              (participant?.kind === 'agent' ? 'Assistant' : 'User')
            }
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 24, gap: 22 },
  turn: { gap: 4, alignItems: 'flex-start' },
  turnRight: { alignItems: 'flex-end' },
  name: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  nameText: { fontSize: 10, letterSpacing: 1.2, lineHeight: 14 },
  body: { maxWidth: '100%' },
  bubble: {
    borderCurve: 'continuous',
    borderRadius: 14,
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: { paddingVertical: 8, fontStyle: 'italic' },
})
