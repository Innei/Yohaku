import { radius } from '@yohaku/design-system/tokens'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { type ReactNode, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { AppText, MarkdownBody, NativePressable } from '@/components/ui'
import { stripSkillFrontmatter } from '@/lib/skill-markdown'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { CodeCard, CopyCodeButton } from './code-block'
import { useBoneColor } from './skeleton'
import {
  foldSource,
  isMarkdownPath,
  type SourceFile,
  sourcePathLine,
} from './source-card-model'

const PREVIEW_COLLAPSED_HEIGHT = 12 * 21

type Mode = 'preview' | 'source'

export interface SourceCardProps {
  chip?: string
  files: SourceFile[] | null
  glyph: SymbolViewProps['name']
  href: string
  owner?: string
  subtitle?: string
  title: string
}

export function SourceCard(props: SourceCardProps) {
  const palette = usePalette()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.neutral[1],
          borderColor: palette.neutral[3],
        },
      ]}
    >
      {props.files ? (
        <LoadedSource {...props} files={props.files} />
      ) : (
        <>
          <Header {...props} />
          <BodySkeleton />
        </>
      )}
    </View>
  )
}

function BodySkeleton() {
  return <View style={[styles.skeleton, { backgroundColor: useBoneColor() }]} />
}

function LoadedSource(props: SourceCardProps & { files: SourceFile[] }) {
  const palette = usePalette()
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<Mode>('preview')
  const [previewHeight, setPreviewHeight] = useState(0)
  const file = props.files[Math.min(active, props.files.length - 1)]
  if (!file) return <Header {...props} />

  const markdown = isMarkdownPath(file.name)
  const previewing = markdown && mode === 'preview'
  const folded = foldSource(file.content, expanded)
  const collapsible = previewing
    ? previewHeight > PREVIEW_COLLAPSED_HEIGHT
    : folded.collapsible

  return (
    <>
      <Header
        {...props}
        subtitle={sourcePathLine({
          chip: props.chip,
          markdown,
          subtitle: props.subtitle,
        })}
        trailing={
          markdown ? (
            <ModeSwitch mode={mode} onChange={setMode} />
          ) : (
            <>
              {props.chip ? <Chip label={props.chip} /> : null}
              <CopyCodeButton code={file.content} />
            </>
          )
        }
      />
      {props.files.length > 1 ? (
        <ScrollView
          horizontal
          contentContainerStyle={styles.tabs}
          showsHorizontalScrollIndicator={false}
          style={[styles.tabBar, { borderBottomColor: palette.neutral[3] }]}
        >
          {props.files.map((entry, index) => {
            const selected = entry === file
            return (
              <NativePressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                haptic={false}
                hitSlop={{ bottom: 10, top: 10 }}
                key={entry.name}
                onPress={() => {
                  setActive(index)
                  setExpanded(false)
                }}
              >
                <AppText
                  color={selected ? palette.neutral[9] : palette.neutral[6]}
                  style={[
                    styles.tab,
                    fonts.mono,
                    selected && { borderBottomColor: palette.neutral[9] },
                  ]}
                >
                  {entry.name}
                </AppText>
              </NativePressable>
            )
          })}
        </ScrollView>
      ) : null}
      {previewing ? (
        <View
          style={[
            styles.preview,
            !expanded && collapsible && { maxHeight: PREVIEW_COLLAPSED_HEIGHT },
          ]}
        >
          <View
            onLayout={(event) =>
              setPreviewHeight(event.nativeEvent.layout.height)
            }
          >
            <MarkdownBody
              fontSize={14}
              lineHeight={23}
              markdown={stripSkillFrontmatter(file.content)}
            />
          </View>
        </View>
      ) : (
        <CodeCard bare code={folded.code} language={file.language} />
      )}
      {collapsible ? (
        <NativePressable
          haptic={false}
          onPress={() => setExpanded((value) => !value)}
        >
          <View style={[styles.expand, { borderTopColor: palette.neutral[3] }]}>
            <AppText color={palette.neutral[7]} variant="secondary">
              {expanded
                ? '收起'
                : previewing
                  ? '展开全部'
                  : `展开全部 · ${folded.total} 行`}
            </AppText>
            <SymbolView
              name={expanded ? 'chevron.up' : 'chevron.down'}
              size={10}
              tintColor={palette.neutral[7]}
            />
          </View>
        </NativePressable>
      ) : null}
    </>
  )
}

function Header({
  chip,
  glyph,
  href,
  owner,
  subtitle,
  title,
  trailing,
}: SourceCardProps & { trailing?: ReactNode }) {
  const doc = useRichDocument()
  const palette = usePalette()
  return (
    <View style={styles.header}>
      <NativePressable
        haptic={false}
        style={styles.headerMain}
        onPress={() => doc.onLinkPress?.(href)}
      >
        <View style={styles.titleRow}>
          <SymbolView name={glyph} size={14} tintColor={palette.neutral[6]} />
          <AppText numberOfLines={1} style={styles.title}>
            {owner ? (
              <AppText color={palette.neutral[6]} style={styles.owner}>
                {owner} /{' '}
              </AppText>
            ) : null}
            {title}
          </AppText>
        </View>
        {subtitle ? (
          <AppText
            color={palette.neutral[6]}
            numberOfLines={1}
            style={[styles.subtitle, fonts.mono]}
          >
            {subtitle}
          </AppText>
        ) : null}
      </NativePressable>
      <View style={styles.trailing}>
        {trailing ?? (chip ? <Chip label={chip} /> : null)}
      </View>
    </View>
  )
}

function Chip({ label }: { label: string }) {
  const palette = usePalette()
  return (
    <View style={[styles.chip, { backgroundColor: palette.surface.desk }]}>
      <AppText color={palette.neutral[7]} style={[styles.chipText, fonts.mono]}>
        {label}
      </AppText>
    </View>
  )
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (mode: Mode) => void
}) {
  const palette = usePalette()
  const options: [Mode, string][] = [
    ['preview', '预览'],
    ['source', '源码'],
  ]
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.segment, { backgroundColor: palette.surface.desk }]}
    >
      {options.map(([value, label]) => {
        const selected = value === mode
        return (
          <NativePressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            haptic={false}
            hitSlop={{ bottom: 8, top: 8 }}
            key={value}
            style={[
              styles.segmentItem,
              selected && { backgroundColor: palette.surface.paper },
            ]}
            onPress={() => onChange(value)}
          >
            <AppText
              color={selected ? palette.neutral[9] : palette.neutral[6]}
              style={styles.segmentText}
            >
              {label}
            </AppText>
          </NativePressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: 1,
    marginVertical: 12,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingTop: 8,
  },
  headerMain: { flex: 1, gap: 2, minWidth: 0, paddingVertical: 2 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { flexShrink: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  owner: { fontWeight: '400' },
  subtitle: { fontSize: 11, lineHeight: 16 },
  trailing: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  chipText: { fontSize: 11, lineHeight: 16 },
  segment: { borderRadius: 8, flexDirection: 'row', gap: 2, padding: 2 },
  segmentItem: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  segmentText: { fontSize: 11, lineHeight: 16 },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  tabs: {
    gap: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: 6,
  },
  preview: {
    overflow: 'hidden',
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  skeleton: { borderRadius: 8, height: 12 * 21, margin: 12 },
  expand: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
  },
})
