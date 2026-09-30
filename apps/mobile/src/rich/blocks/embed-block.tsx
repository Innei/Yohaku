import { UnsupportedBlock } from './card-blocks'
import { GistBlock } from './gist-block'
import { parseGithubFileUrl } from './github-file'
import { GithubFileBlock } from './github-file-block'
import { parseGistUrl } from './source-card-model'
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
    case 'github-gist': {
      return <GistBlock {...props} />
    }
    default: {
      const url = str(props.node.url)
      if (!source && parseGithubFileUrl(url)) {
        return <GithubFileBlock {...props} />
      }
      if (!source && parseGistUrl(url)) return <GistBlock {...props} />
      return <UnsupportedBlock {...props} />
    }
  }
}
