import { Share } from 'react-native'

export function shareUrl(url: string, title?: string) {
  return Share.share(title ? { url, title } : { url })
}
