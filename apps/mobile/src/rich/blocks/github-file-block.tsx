import { useQuery } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper } from '@/components/ui'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { UnsupportedBlock } from './card-blocks'
import { CodeBlock } from './code-block'
import { type GithubFileRef, parseGithubFileUrl } from './github-file'
import { useBoneColor } from './skeleton'
import { type BlockProps, str } from './types'

const COLLAPSED_LINES = 12

async function fetchFileText(rawUrl: string): Promise<string> {
  const res = await fetch(rawUrl)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.text()
}

function fileName(path: string): string {
  return path.split('/').pop() ?? path
}

function dirLabel(fileRef: GithubFileRef): string {
  const dir = fileRef.path.split('/').slice(0, -1).join('/')
  return dir
    ? `${fileRef.owner}/${fileRef.repo} · ${dir}`
    : `${fileRef.owner}/${fileRef.repo}`
}

function Header({ fileRef, url }: { fileRef: GithubFileRef; url: string }) {
  const doc = useRichDocument()
  const palette = usePalette()
  return (
    <NativePressable haptic={false} onPress={() => doc.onLinkPress?.(url)}>
      <View style={[styles.header, { borderBottomColor: palette.neutral[3] }]}>
        <SymbolView name="doc.text" size={16} tintColor={palette.neutral[6]} />
        <View style={styles.headerText}>
          <AppText numberOfLines={1} variant="secondary">
            {fileName(fileRef.path)}
          </AppText>
          <AppText color={palette.neutral[6]} numberOfLines={1} variant="meta">
            {dirLabel(fileRef)}
          </AppText>
        </View>
        <View style={[styles.pill, { backgroundColor: palette.neutral[3] }]}>
          <AppText color={palette.neutral[7]} variant="meta">
            {fileRef.ref}
          </AppText>
        </View>
      </View>
    </NativePressable>
  )
}

function BodySkeleton() {
  return <View style={[styles.skeleton, { backgroundColor: useBoneColor() }]} />
}

export function GithubFileBlock({ blockId, node }: BlockProps) {
  const palette = usePalette()
  const url = str(node.url)
  const ref = parseGithubFileUrl(url)
  const [expanded, setExpanded] = useState(false)

  const query = useQuery({
    enabled: ref !== null,
    queryFn: () => fetchFileText(ref!.rawUrl),
    queryKey: ['github-file', ref?.rawUrl],
    staleTime: Infinity,
  })

  if (ref === null) return <UnsupportedBlock blockId={blockId} node={node} />
  if (query.isPending) {
    return (
      <Paper style={styles.card}>
        <Header fileRef={ref} url={url} />
        <BodySkeleton />
      </Paper>
    )
  }
  if (query.isError || query.data === undefined) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const lines = query.data.split('\n')
  const collapsible = lines.length > COLLAPSED_LINES
  const code = expanded
    ? query.data
    : lines.slice(0, COLLAPSED_LINES).join('\n')

  return (
    <Paper style={styles.card}>
      <Header fileRef={ref} url={url} />
      <CodeBlock
        blockId={`${blockId}-code`}
        node={{ code, language: ref.language, type: 'code-block' }}
      />
      {collapsible ? (
        <NativePressable
          haptic={false}
          onPress={() => setExpanded((value) => !value)}
        >
          <View style={[styles.expand, { borderTopColor: palette.neutral[3] }]}>
            <AppText color={palette.accent} variant="secondary">
              {expanded ? '收起' : `展开全部 · ${lines.length} 行`}
            </AppText>
          </View>
        </NativePressable>
      ) : null}
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 12, padding: 0, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1, gap: 1, minWidth: 0 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  skeleton: { height: 12 * 20 + 24, margin: 12, borderRadius: 8 },
  expand: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
