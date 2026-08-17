/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'notification-service',
  name: 'YohakuNotificationService',
  displayName: 'Yohaku Notification Service',
  bundleIdentifier: '.notification-service',
  deploymentTarget: '18.0',
  frameworks: ['UserNotifications', 'Intents'],
}
