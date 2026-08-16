'use client'

import type {
  ChatMessage,
  ChatParticipant,
  ChatParticipantKind,
  ChatRendererProps,
} from '@haklex/rich-ext-chat/node'
import Markdown from 'markdown-to-jsx'
import type { FC } from 'react'

const UNKNOWN: ChatParticipant = {
  id: '__unknown__',
  kind: 'user',
  name: 'Unknown',
}

function defaultName(kind: ChatParticipantKind): string {
  return kind === 'agent' ? 'Assistant' : 'User'
}

function resolveParticipant(
  participants: ChatParticipant[],
  participantId: string,
): ChatParticipant {
  return participants.find((p) => p.id === participantId) ?? UNKNOWN
}

const MessageMarkdown: FC<{ content: string }> = ({ content }) => (
  <Markdown>{content}</Markdown>
)

const NamedTurn: FC<{
  name: string
  content: string
  tone: 'accent' | 'neutral'
  align?: 'left' | 'right'
}> = ({ name, content, tone, align = 'left' }) => (
  <div
    className="rich-chat-yohaku-turn"
    data-align={align === 'right' ? 'right' : undefined}
  >
    <span className="rich-chat-yohaku-name">
      <span aria-hidden className="rich-chat-yohaku-dot" data-tone={tone} />
      {name}
    </span>
    <div className="rich-chat-yohaku-body prose">
      <MessageMarkdown content={content} />
    </div>
  </div>
)

const UserAgentUserTurn: FC<{ content: string }> = ({ content }) => (
  <div
    className="rich-chat-yohaku-turn rich-chat-yohaku-userbody"
    data-align="right"
  >
    <div className="rich-chat-yohaku-body">
      <MessageMarkdown content={content} />
    </div>
  </div>
)

const UserAgentRow: FC<{
  message: ChatMessage
  participants: ChatParticipant[]
}> = ({ message, participants }) => {
  const participant = resolveParticipant(participants, message.participantId)
  if (participant.kind === 'agent') {
    return (
      <NamedTurn
        align="left"
        content={message.content}
        name={participant.name ?? defaultName('agent')}
        tone="accent"
      />
    )
  }
  return <UserAgentUserTurn content={message.content} />
}

const UserUserRow: FC<{
  message: ChatMessage
  participants: ChatParticipant[]
  isRight: boolean
}> = ({ message, participants, isRight }) => {
  const participant = resolveParticipant(participants, message.participantId)
  return (
    <NamedTurn
      align={isRight ? 'right' : 'left'}
      content={message.content}
      name={participant.name ?? defaultName(participant.kind)}
      tone={isRight ? 'accent' : 'neutral'}
    />
  )
}

function isRightSide(
  message: ChatMessage,
  participants: ChatParticipant[],
): boolean {
  return participants.findIndex((p) => p.id === message.participantId) === 1
}

export const LexicalChatOverride: FC<ChatRendererProps> = ({
  variant,
  participants,
  messages,
}) => {
  if (messages.length === 0) {
    return (
      <div className="rich-chat-yohaku">
        <div className="rich-chat-yohaku-empty">Empty chat</div>
      </div>
    )
  }
  return (
    <div className="rich-chat-yohaku">
      {messages.map((message) =>
        variant === 'user-agent' ? (
          <UserAgentRow
            key={message.id}
            message={message}
            participants={participants}
          />
        ) : (
          <UserUserRow
            isRight={isRightSide(message, participants)}
            key={message.id}
            message={message}
            participants={participants}
          />
        ),
      )}
    </div>
  )
}
