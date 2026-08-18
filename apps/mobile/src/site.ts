import { siteOverlay } from 'yohaku-mobile-overlay'

import { mergeSite, type SiteConfig } from '@/site-config'

export type { SiteConfig, SiteOverlay } from '@/site-config'
export {
  hostsForSiteUrl,
  mergeSite,
  privacyUrlFrom,
  publicSite,
} from '@/site-config'

export const site: SiteConfig = mergeSite(siteOverlay)
