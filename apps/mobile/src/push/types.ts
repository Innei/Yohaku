export type PushPreferences = {
  commentReplied: boolean
  contentNote: boolean
  contentPost: boolean
  contentRecently: boolean
}

export const DEFAULT_PUSH_PREFERENCES: Readonly<PushPreferences> =
  Object.freeze({
    contentPost: true,
    contentNote: true,
    contentRecently: true,
    commentReplied: true,
  })

export type ApnsEnvironment = 'development' | 'production'

export type PushActivation = {
  bindingId: string
  enabled: true
  relayUrl: string
}

export type PushInstallationCredential = {
  appId: string
  bindingId?: string | null
  installationId: string
  installationSecret: string
  relayUrl: string
}

export type RegisterInstallationRequest = {
  app_id: string
  apns_environment: ApnsEnvironment
  apns_token: string
}

export type UpdateInstallationTokenRequest = {
  apns_environment: ApnsEnvironment
  apns_token: string
}

export type RelayInstallationResponse = {
  installation_id: string
  installation_secret: string
}

export type RelayActivationTicketResponse = {
  expires_at: string
  ticket: string
}

export type RelayBindingPreferences = {
  comment_replied: boolean
  content_note: boolean
  content_post: boolean
  content_recently: boolean
}

export type RelayBinding = {
  binding_id: string
  installation_id: string
  preferences: PushPreferences
  reader_id: string | null
  source_id: string
}

export function relayPreferencesToApp(
  preferences: RelayBindingPreferences,
): PushPreferences {
  return {
    contentPost: preferences.content_post,
    contentNote: preferences.content_note,
    contentRecently: preferences.content_recently,
    commentReplied: preferences.comment_replied,
  }
}

export function appPreferencesToRelay(
  patch: Partial<PushPreferences>,
): Partial<RelayBindingPreferences> {
  const relay: Partial<RelayBindingPreferences> = {}
  if (patch.contentPost !== undefined) relay.content_post = patch.contentPost
  if (patch.contentNote !== undefined) relay.content_note = patch.contentNote
  if (patch.contentRecently !== undefined) {
    relay.content_recently = patch.contentRecently
  }
  if (patch.commentReplied !== undefined) {
    relay.comment_replied = patch.commentReplied
  }
  return relay
}

export type PushConfig =
  | { configured: false }
  | {
      appId: string
      configured: true
      environment: ApnsEnvironment
      relayUrl: string
    }
