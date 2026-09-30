import { useRouter } from 'expo-router'
import { Dimensions } from 'react-native'

import { presentArticleToc, tocHeadingOffset, tocHref } from '@/lib/article-toc'
import type { LexicalHeading } from '@/lib/lexical-headings'

import { buildTocPresence } from './presence-map'

export function useOpenArticleToc(
  headings: LexicalHeading[],
  presenceSnapshot: () => { contentHeight: number; readers: number[]; self: number },
) {
  const router = useRouter()
  return () => {
    presentArticleToc(
      headings,
      Dimensions.get('window').height,
      buildTocPresence({
        ...presenceSnapshot(),
        headings,
        offsetFor: tocHeadingOffset,
      }),
    )
    router.push(tocHref())
  }
}
