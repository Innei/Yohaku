import { type as typeScale } from '@yohaku/design-system/tokens'
import { type Href, Link } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import type { TextRole } from '@/components/ui'
import {
  AppText,
  Button,
  Paper,
  PillButton,
  Segment,
  SinkPressable,
  SlotText,
  WellInput,
} from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { FileNodeLab } from './file-node-lab'
import { SplashReplayControls, useSplashReplay } from './splash-replay'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow">{title}</AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function LabEntry({
  chevronColor,
  hint,
  href,
  title,
}: {
  chevronColor: string
  hint: string
  href: Href
  title: string
}) {
  return (
    <Link asChild href={href}>
      <SinkPressable accessibilityRole="link">
        <Paper style={styles.paperCard}>
          <View style={styles.entryHead}>
            <AppText variant="entryTitle">{title}</AppText>
            <SymbolView
              name="chevron.right"
              size={13}
              tintColor={chevronColor}
            />
          </View>
          <AppText variant="secondary">{hint}</AppText>
        </Paper>
      </SinkPressable>
    </Link>
  )
}

const textRoles: { role: TextRole; sample: string }[] = [
  { role: 'largeTitle', sample: '大标题 · 板块页头' },
  { role: 'largeTitleSans', sample: '大标题 Sans · 博文页头' },
  { role: 'entryTitle', sample: '条目标题 · 纸卡上的文章名' },
  { role: 'entryTitleSans', sample: '条目标题 Sans · 博文卡片' },
  { role: 'letterTitle', sample: '手记标题 · 编年条目' },
  { role: 'body', sample: '正文 UI · 评论与表单用这个字号' },
  { role: 'secondary', sample: '次要文字 · 摘要、说明' },
  { role: 'meta', sample: '元信息 · 三天前 · 4200 字' },
  { role: 'eyebrow', sample: '眉标 · 前端' },
]

export function DevDemos() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [likes, setLikes] = useState(42)
  const [liked, setLiked] = useState(false)
  const { start: startSplash, overlay: splashOverlay } = useSplashReplay()

  return (
    <View style={styles.screen}>
      <EdgeEffectScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 44 },
        ]}
        style={[styles.screen, { backgroundColor: palette.surface.desk }]}
      >
        <AppText variant="largeTitle">组件目录</AppText>
        <AppText style={styles.intro} variant="secondary">
          纸上桌面基调的全部基础组件与状态,供真机调校。
        </AppText>

        <Section title="PRINT">
          <LabEntry
            chevronColor={palette.neutral[5]}
            hint="屏幕渲染、打印、Export PDF"
            href="/dev-demos/print"
            title="打印稿全节点示例"
          />
        </Section>

        <Section title="TEXT">
          {textRoles.map(({ role, sample }) => (
            <AppText key={role} variant={role}>
              {sample}
            </AppText>
          ))}
        </Section>

        <Section title="TOAST">
          <View style={styles.row}>
            <Button
              label="弹出 Toast"
              onPress={() => showToast('已复制链接')}
            />
            <Button
              label="弹出一组"
              variant="paper"
              onPress={() => {
                showToast('已复制链接')
                showToast('缓存已清除')
                showToast('更改已保存')
              }}
            />
          </View>
        </Section>

        <Section title="BUTTON">
          <View style={styles.row}>
            <Button label="发送评论" />
            <Button label="纸卡按钮" variant="paper" />
            <Button label="安静按钮" variant="quiet" />
          </View>
          <View style={styles.row}>
            <Button disabled label="禁用态" />
            <Button disabled label="禁用纸卡" variant="paper" />
          </View>
        </Section>

        <Section title="PILL / SLOT TEXT">
          <View style={styles.row}>
            <PillButton
              active={liked}
              icon={
                <SymbolView
                  name={liked ? 'heart.fill' : 'heart'}
                  size={15}
                  tintColor={liked ? palette.accent : palette.neutral[6]}
                />
              }
              onPress={() => {
                setLiked(!liked)
                setLikes((count) => (liked ? count - 1 : count + 1))
              }}
            >
              <SlotText
                value={likes}
                textStyle={{
                  ...fonts.sansMedium,
                  fontSize: typeScale.copy14.size,
                  lineHeight: typeScale.copy14.lineHeight,
                  color: liked ? palette.accent : palette.neutral[8],
                }}
              />
            </PillButton>
            <PillButton>评论 7</PillButton>
          </View>
        </Section>

        <Section title="INPUT">
          <WellInput placeholder="说点什么…" />
          <WellInput defaultValue="已输入的内容" />
        </Section>

        <Section title="SEGMENT">
          <Segment
            index={segmentIndex}
            options={['全部', '博文', '手记', '思考']}
            onChange={setSegmentIndex}
          />
        </Section>

        <Section title="PAPER">
          <Paper style={styles.paperCard}>
            <AppText variant="eyebrow">前端</AppText>
            <AppText style={styles.paperTitle} variant="entryTitle">
              升级 Motion 13 的踩坑记录
            </AppText>
            <AppText numberOfLines={2} variant="secondary">
              从 12 到 13 的 breaking changes 远比 changelog
              里写的多,这篇记录每一个坑。
            </AppText>
            <View style={styles.paperFooter}>
              <AppText variant="meta">三天前 · 4200 字</AppText>
              <AppText variant="meta">♥ 42</AppText>
            </View>
          </Paper>
        </Section>

        <Section title="MARKDOWN">
          <LabEntry
            chevronColor={palette.neutral[5]}
            hint="加粗、斜体、代码、表格、图片"
            href="/dev-demos/markdown"
            title="评论正文渲染"
          />
        </Section>

        <Section title="FILE NODE">
          <FileNodeLab />
        </Section>

        <Section title="SPLASH">
          <SplashReplayControls onStart={startSplash} />
        </Section>
      </EdgeEffectScrollView>
      {splashOverlay}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  intro: {
    marginTop: 4,
  },
  section: {
    marginTop: 32,
    gap: 12,
  },
  sectionBody: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  paperCard: {
    padding: 18,
    gap: 5,
  },
  entryHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paperTitle: {
    marginTop: 2,
  },
  paperFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
})
