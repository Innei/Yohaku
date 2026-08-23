import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  findNodeHandle,
  Keyboard,
  Pressable,
  type ScrollView,
  StyleSheet,
  View,
} from 'react-native'

import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import type { ApiComment, CommentRefType } from '@/api/types'
import { useSession } from '@/auth/session-store'
import { useTranslations } from '@/i18n'
import type { CommentAnchor } from '@/lib/comment-anchor'
import { commentDisplayName } from '@/lib/comment-thread'

import { CommentComposer } from './comment-composer'
import { commentAnchorsQueryKey, commentsQueryKey } from './use-comments'

export type ReplyTo = { id: string; name: string }

interface CommentComposeValue {
  composeRoot: () => void
  composing: boolean
  edit: (comment: ApiComment, anchor?: View | null) => void
  reply: (comment: ApiComment, anchor?: View | null) => void
  scrollBottomInset: number
}

const CommentComposeContext = createContext<CommentComposeValue | null>(null)

export function useCommentCompose(): CommentComposeValue {
  const value = use(CommentComposeContext)
  if (!value) {
    throw new Error('useCommentCompose must be used inside CommentComposeProvider')
  }
  return value
}

export function useOptionalCommentCompose(): CommentComposeValue | null {
  return use(CommentComposeContext)
}

export function CommentComposeHost({
  children,
  resetKey,
  ...props
}: {
  allowComment?: boolean
  anchor?: CommentAnchor | null
  autoFocus?: boolean
  children: (compose: CommentComposeValue) => ReactNode
  onRootSent?: () => void
  refId: string
  refType: CommentRefType
  resetKey?: string
  scrollRef?: RefObject<ScrollView | null>
}) {
  return (
    <CommentComposeProvider key={resetKey ?? 'compose'} {...props}>
      <CommentComposeHostInner>{children}</CommentComposeHostInner>
    </CommentComposeProvider>
  )
}

function CommentComposeHostInner({
  children,
}: {
  children: (compose: CommentComposeValue) => ReactNode
}) {
  return children(useCommentCompose())
}

function scrollAnchorIntoView(
  scrollRef: RefObject<ScrollView | null> | undefined,
  anchor: View | null | undefined,
) {
  const scroll = scrollRef?.current
  if (!scroll || !anchor) return
  const innerGetter = (
    scroll as ScrollView & { getInnerViewRef?: () => View }
  ).getInnerViewRef
  const inner = innerGetter?.()
  const relative = findNodeHandle(inner ?? scroll)
  if (typeof relative !== 'number') return
  anchor.measureLayout(
    relative,
    (_x, y) => {
      scroll.scrollTo({ animated: true, y: Math.max(0, y - 12) })
    },
    () => {},
  )
}

export function CommentComposeProvider({
  allowComment = true,
  anchor = null,
  autoFocus = false,
  children,
  onRootSent,
  refId,
  refType,
  scrollRef,
}: {
  allowComment?: boolean
  anchor?: CommentAnchor | null
  autoFocus?: boolean
  children: ReactNode
  onRootSent?: () => void
  refId: string
  refType: CommentRefType
  scrollRef?: RefObject<ScrollView | null>
}) {
  const t = useTranslations('comment')
  const tc = useTranslations('common')
  const session = useSession()
  const retainComposer = useRef(false)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [focused, setFocused] = useState(autoFocus)
  const [composerHeight, setComposerHeight] = useState(56)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  if (session === null && focused) setFocused(false)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates.height))
    })
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0)
      if (retainComposer.current) {
        retainComposer.current = false
        return
      }
      setFocused(false)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const send = useMutation({
    mutationFn: (vars: {
      editId: string | null
      parentId: string | null
      text: string
    }) =>
      vars.editId
        ? api.editComment(vars.editId, vars.text)
        : vars.parentId
          ? api.readerReply(vars.parentId, vars.text)
          : api.readerComment(refId, refType, vars.text, anchor),
    onSuccess: async (_data, vars) => {
      const wasReply = vars.parentId !== null || vars.editId !== null
      setDraft('')
      setReplyTo(null)
      setEditingId(null)
      setSendError(null)
      Keyboard.dismiss()
      setFocused(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsQueryKey(refId) }),
        queryClient.invalidateQueries({
          queryKey: commentAnchorsQueryKey(refId),
        }),
      ])
      if (!wasReply) onRootSent?.()
    },
    onError: (error) => {
      const fallback = t('sendFailed')
      setSendError(
        error instanceof ApiError
          ? (error.serverMessage ?? fallback)
          : fallback,
      )
    },
  })

  const keepComposer = useCallback(() => {
    retainComposer.current = true
  }, [])

  const dismissComposer = useCallback(() => {
    Keyboard.dismiss()
    if (keyboardHeight === 0) setFocused(false)
  }, [keyboardHeight])

  const composeRoot = useCallback(() => {
    if (!allowComment || session === null) return
    setReplyTo(null)
    setEditingId(null)
    setFocused(true)
  }, [allowComment, session])

  const reply = useCallback(
    (comment: ApiComment, anchorView?: View | null) => {
      if (!allowComment || session === null) return
      setReplyTo({ id: comment.id, name: commentDisplayName(comment) })
      setEditingId(null)
      setFocused(true)
      requestAnimationFrame(() => {
        scrollAnchorIntoView(scrollRef, anchorView)
      })
    },
    [allowComment, scrollRef, session],
  )

  const edit = useCallback(
    (comment: ApiComment, anchorView?: View | null) => {
      if (!allowComment || session === null) return
      setReplyTo(null)
      setEditingId(comment.id)
      setDraft(comment.text)
      setFocused(true)
      requestAnimationFrame(() => {
        scrollAnchorIntoView(scrollRef, anchorView)
      })
    },
    [allowComment, scrollRef, session],
  )

  const composing = focused && session !== null && allowComment
  const scrollBottomInset = composing ? composerHeight + keyboardHeight : 0

  const value = useMemo(
    () => ({ composing, composeRoot, edit, reply, scrollBottomInset }),
    [composeRoot, composing, edit, reply, scrollBottomInset],
  )

  return (
    <CommentComposeContext value={value}>
      <View style={styles.host}>
        {children}
        {composing ? (
          <>
            <Pressable
              accessibilityLabel={tc('close')}
              accessibilityRole="button"
              style={StyleSheet.absoluteFill}
              onPress={dismissComposer}
            />
            <CommentComposer
              busy={send.isPending}
              editing={editingId !== null}
              error={sendError}
              keyboardHeight={keyboardHeight}
              replyToName={replyTo?.name ?? null}
              value={draft}
              onChromePressIn={keepComposer}
              onHeight={setComposerHeight}
              onCancelReply={() => {
                setReplyTo(null)
                if (editingId !== null) {
                  setEditingId(null)
                  setDraft('')
                }
              }}
              onChangeText={(text) => {
                setDraft(text)
                if (sendError) setSendError(null)
              }}
              onSend={() =>
                send.mutate({
                  editId: editingId,
                  parentId: replyTo?.id ?? null,
                  text: draft.trim(),
                })
              }
            />
          </>
        ) : null}
      </View>
    </CommentComposeContext>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
})
