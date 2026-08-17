/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins use CommonJS. */

const fs = require('node:fs')
const path = require('node:path')

const { IOSConfig, withXcodeProject } = require('expo/config-plugins')

const withNotificationLocalizations = (config) =>
  withXcodeProject(config, (config) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot,
    )
    const relativePath = path.join(projectName, 'Localizable.xcstrings')
    const outputPath = path.join(
      config.modRequest.platformProjectRoot,
      relativePath,
    )
    const sourcePath = path.join(
      config.modRequest.projectRoot,
      'assets',
      'notifications',
      'Localizable.xcstrings',
    )

    fs.copyFileSync(sourcePath, outputPath)
    if (!config.modResults.hasFile(relativePath)) {
      const target = IOSConfig.XcodeUtils.getApplicationNativeTarget({
        project: config.modResults,
        projectName,
      })
      config.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: relativePath,
        groupName: projectName,
        isBuildFile: true,
        project: config.modResults,
        targetUuid: target.uuid,
      })
    }
    return config
  })

module.exports = withNotificationLocalizations
