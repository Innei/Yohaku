import * as Haptics from 'expo-haptics'

export function openDevTools(router: { push: (href: '/dev') => void }) {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  router.push('/dev')
}
