import { UnsupportedBlock } from './card-blocks'
import { parseGithubFileUrl } from './github-file'
import { GithubFileBlock } from './github-file-block'
import { TweetBlock } from './tweet-block'
import { type BlockProps, str } from './types'

export function EmbedBlock(props: BlockProps) {
  const source = str(props.node.source)
  switch (source) {
    case 'tweet': {
      return <TweetBlock {...props} />
    }
    case 'github-file': {
      return <GithubFileBlock {...props} />
    }
    default: {
      if (!source && parseGithubFileUrl(str(props.node.url))) {
        return <GithubFileBlock {...props} />
      }
      return <UnsupportedBlock {...props} />
    }
  }
}
