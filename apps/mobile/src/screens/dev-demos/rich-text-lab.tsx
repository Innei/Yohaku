import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import type { RichTextBlock, RichTextHighlight } from '@/rich/inline-runs'
import type { RichTextMenuActionEvent } from '@/rich/rich-text-view'
import { RichTextView } from '@/rich/rich-text-view'
import { usePalette } from '@/theme/palette'

import { LabScreen } from './lab-screen'

const segmentA: RichTextBlock[] = [
  {
    id: 'h1',
    role: 'heading',
    level: 2,
    runs: [{ text: '原生正文：一个 TextView 承载一段' }],
  },
  {
    id: 'p1',
    role: 'paragraph',
    runs: [
      { text: '这一段和下面几段都在同一个 UITextView 里，所以可以' },
      { text: '跨段落自由选取', bold: true },
      { text: '。行内支持 ' },
      { text: '斜体', italic: true },
      { text: '、' },
      { text: '删除线', strike: true },
      { text: '、' },
      { text: '下划线', underline: true },
      { text: '、' },
      { text: 'inline code', code: true },
      { text: '、上标 H' },
      { text: '2', sub: true },
      { text: 'O 与 x' },
      { text: '2', sup: true },
      { text: '，以及 ' },
      { text: '链接到 innei.in', href: 'https://innei.in' },
      { text: '。' },
    ],
  },
  {
    id: 'p2',
    role: 'paragraph',
    runs: [
      { text: '这里有一处已有的范围评论高亮，点它会触发 onHighlightPress。' },
      { text: '这一句藏在 spoiler 里，点一下揭开。', spoiler: true },
    ],
  },
  {
    id: 'q1',
    role: 'quote',
    runs: [
      {
        text: '引用：没有编辑态，文本层就应该是一个统一的原生 TextView 抽象。',
      },
    ],
  },
  {
    id: 'pa',
    role: 'paragraph',
    runs: [{ text: '引用后的普通段落 A，不该有竖线。' }],
  },
  {
    id: 'pb',
    role: 'paragraph',
    runs: [{ text: '普通段落 B，同样不该有竖线。' }],
  },
  { id: 'q2', role: 'quote', runs: [{ text: '第二段引用。' }] },
  { id: 'pc', role: 'paragraph', runs: [{ text: '引用后的普通段落 C。' }] },
  {
    id: 'l1',
    role: 'listItem',
    listType: 'bullet',
    runs: [
      {
        text: '无序列表第一项，足够长以便换行观察 headIndent 是否对齐到文字起点而不是圆点。',
      },
    ],
  },
  {
    id: 'l2',
    role: 'listItem',
    listType: 'bullet',
    depth: 1,
    runs: [{ text: '嵌套子项' }],
  },
  {
    id: 'l3',
    role: 'listItem',
    listType: 'number',
    index: 1,
    runs: [{ text: '有序列表第一条' }],
  },
  {
    id: 'l4',
    role: 'listItem',
    listType: 'number',
    index: 2,
    runs: [{ text: '第二条，带 ' }, { text: '加粗', bold: true }],
  },
  {
    id: 'l5',
    role: 'listItem',
    listType: 'check',
    checked: true,
    runs: [{ text: '已完成的任务' }],
  },
  { id: 'hr1', role: 'hr', runs: [] },
  {
    id: 'p3',
    role: 'paragraph',
    runs: [
      {
        text: '分割线之后的段落。下方是一个 RN 视图块（占位图），它会切断 segment。',
      },
    ],
  },
]

const segmentB: RichTextBlock[] = [
  { id: 'h2', role: 'heading', level: 3, runs: [{ text: '第二段 segment' }] },
  {
    id: 'p4',
    role: 'paragraph',
    runs: [
      {
        text: '选取无法跨过上面的图片块，这是 v1 的已知边界。长按任意文字，编辑菜单里会出现「评论」与「评论此段」两个自定义项。',
      },
    ],
  },
]

const highlights: RichTextHighlight[] = [
  { id: 'c1', blockId: 'p2', start: 6, end: 14, kind: 'comment' },
]

export function RichTextLab() {
  const palette = usePalette()
  const [lastAction, setLastAction] = useState<RichTextMenuActionEvent | null>(
    null,
  )
  const [events, setEvents] = useState<string[]>([])
  const log = (line: string) => setEvents((prev) => [...prev.slice(-4), line])

  return (
    <LabScreen
      intro="RichTextView POC：段内跨段落选取、编辑菜单、高亮、spoiler。"
      title="原生正文"
    >
      <RichTextView
        blocks={segmentA}
        highlights={highlights}
        menuItems={[
          { id: 'comment', label: '评论', icon: 'text.bubble' },
          { id: 'comment-block', label: '评论此段', icon: 'text.quote' },
        ]}
        onHighlightPress={(id) => log(`highlight ${id}`)}
        onLinkPress={(href) => log(`link ${href}`)}
        onMenuAction={setLastAction}
      />
      <View
        style={[
          styles.imagePlaceholder,
          { backgroundColor: palette.neutral[3] },
        ]}
      >
        <AppText variant="meta">RN 视图块（图片占位）</AppText>
      </View>
      <RichTextView
        blocks={segmentB}
        menuItems={[{ id: 'comment', label: '评论', icon: 'text.bubble' }]}
        onMenuAction={setLastAction}
      />
      <View style={[styles.log, { backgroundColor: palette.neutral[2] }]}>
        <AppText variant="meta">events: {events.join(' | ') || '—'}</AppText>
        <AppText variant="meta">
          menu:{' '}
          {lastAction
            ? `${lastAction.id} ${lastAction.start.blockId}:${lastAction.start.offset} → ${lastAction.end.blockId}:${lastAction.end.offset} “${lastAction.text}”`
            : '—'}
        </AppText>
      </View>
    </LabScreen>
  )
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    height: 160,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  log: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
})
