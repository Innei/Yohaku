import { StyleSheet, View } from 'react-native'

import { AppText, MarkdownBody } from '@/components/ui'
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
  name,
  tone,
}: {
  align: 'left' | 'right'
  content: string
  name?: string
  tone: 'accent' | 'neutral'
}) {
  const palette = usePalette()
  const doc = useRichDocument()
  const right = align === 'right'
  return (
    <View style={[styles.turn, right && styles.turnRight]}>
      {name ? (
        <View style={styles.name}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  tone === 'accent' ? palette.accent : palette.neutral[6],
              },
            ]}
          />
          <AppText color={palette.neutral[6]} variant="eyebrow">
            {name}
          </AppText>
        </View>
      ) : null}
      <View
        style={[
          styles.body,
          right && !name && { backgroundColor: `${palette.accent}24` },
        ]}
      >
        <MarkdownBody
          fontSize={15}
          lineHeight={25}
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
                align="left"
                content={message.content}
                key={message.id}
                name={participant.name ?? 'Assistant'}
                tone="accent"
              />
            )
          }
          return (
            <Turn
              align="right"
              content={message.content}
              key={message.id}
              tone="accent"
            />
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
            tone={right ? 'accent' : 'neutral'}
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
  body: { maxWidth: '100%', borderRadius: 4, paddingHorizontal: 2 },
  empty: { paddingVertical: 8, fontStyle: 'italic' },
})
