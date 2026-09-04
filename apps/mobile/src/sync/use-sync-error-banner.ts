import { useEffect, useRef } from 'react'

import { dismissBanner, showBanner } from '@/components/ui/banner-store'
import { t } from '@/i18n'

import { syncAll } from './engine'
import { type SyncStatus, useSyncStatus } from './status'
import { syncBannerTransition } from './sync-banner-transition'

export function useSyncErrorBanner() {
  const status = useSyncStatus()
  const previous = useRef<SyncStatus>('idle')

  useEffect(() => {
    const command = syncBannerTransition(previous.current, status)
    previous.current = status
    if (command === 'show') {
      showBanner({
        action: {
          title: t('list', 'syncRetry'),
          onPress: () => {
            void syncAll({ force: true })
          },
        },
        message: t('list', 'syncFailedMessage'),
        title: t('list', 'syncFailedTitle'),
      })
      return
    }
    if (command === 'dismiss') dismissBanner()
  }, [status])
}
