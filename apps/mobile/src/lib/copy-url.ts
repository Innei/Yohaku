import * as Clipboard from 'expo-clipboard'

import { showToast } from '@/components/ui/toast-store'
import { t } from '@/i18n'

export async function copyUrl(url: string) {
  await Clipboard.setStringAsync(url)
  showToast(t('common', 'linkCopied'))
}
