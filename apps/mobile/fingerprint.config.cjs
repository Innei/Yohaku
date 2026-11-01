// CNG keeps ios/ out of git, so native inputs that config plugins copy into the
// project at prebuild are invisible to the default fingerprint and would ship as OTA.
module.exports = {
  extraSources: [
    { type: 'dir', filePath: 'targets', reasons: ['appleTargets'] },
    {
      type: 'dir',
      filePath: 'assets/notifications',
      reasons: ['notificationLocalizations'],
    },
  ],
}
