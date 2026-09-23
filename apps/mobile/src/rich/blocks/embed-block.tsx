import { UnsupportedBlock } from './card-blocks'
import { TweetBlock } from './tweet-block'
import { type BlockProps, str } from './types'

export function EmbedBlock(props: BlockProps) {
  switch (str(props.node.source)) {
    case 'tweet': {
      return <TweetBlock {...props} />
    }
    default: {
      return <UnsupportedBlock {...props} />
    }
  }
}
