import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Share, StyleSheet, View } from 'react-native'

import type { ArticleSkillRef } from '@/api/article-meta'
import { AppText, SinkPressable } from '@/components/ui'
import type { Translator } from '@/i18n'
import { siteHref } from '@/lib/site-url'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

function skillPromptUrl(name: string) {
  return siteHref(`/skills/${encodeURIComponent(name)}/SKILL.md`)
}

export function ArticleSkillRow({
  skill,
  t,
}: {
  skill: ArticleSkillRef
  t: Translator<'notice'>
}) {
  const palette = usePalette()
  const router = useRouter()
  return (
    <View style={styles.item}>
      <View style={styles.body}>
        <View style={styles.head}>
          <SinkPressable
            haptic={false}
            style={styles.nameHit}
            onPress={() =>
              router.push({
                pathname: '/skills/[name]',
                params: { name: skill.name, description: skill.description },
              })
            }
          >
            <AppText
              color={palette.neutral[9]}
              style={styles.name}
              variant="secondary"
            >
              {skill.name}
            </AppText>
          </SinkPressable>
          <SinkPressable
            haptic={false}
            style={styles.action}
            onPress={() =>
              void Share.share({
                message: `${t('skillPromptText', {
                  url: skillPromptUrl(skill.name),
                })}\n\n`,
              })
            }
          >
            <SymbolView
              name="wand.and.stars"
              size={13}
              tintColor={palette.accent}
            />
            <AppText color={palette.accent} variant="meta">
              {t('skillCopyPrompt')}
            </AppText>
          </SinkPressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameHit: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...fonts.sansMedium,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
})
