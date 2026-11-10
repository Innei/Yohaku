/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

const { withAppDelegate } = require('expo/config-plugins')

const kitImport = 'internal import YohakuKit\n'
const factoryStored = 'reactNativeFactory = factory\n'

// The plain rootViewFactory.view(withModuleName:) goes through expo-dev-launcher
// in Debug and boots a second JS runtime; superView reuses the running host.
const surfaceFactory = `    YohakuSurfaces.make = { [weak factory] name, props in
      guard let factory, let views = factory.rootViewFactory as? ExpoReactRootViewFactory else {
        return UIView()
      }
      let view = views.superView(
        withModuleName: name,
        initialProperties: props,
        launchOptions: [:],
        bundleConfiguration: RCTBundleConfiguration.default(),
        devMenuConfiguration: factory.devMenuConfiguration
      )
      if let host = view as? RCTSurfaceHostingProxyRootView {
        host.disableActivityIndicatorAutoHide(false)
        host.loadingView = UIView()
      }
      return view
    }
`

function applyDuoSurfaces(contents) {
  if (contents.includes('YohakuSurfaces.make')) return contents
  if (!contents.includes(factoryStored)) {
    throw new Error(
      'The Expo AppDelegate template changed; update the Duo surfaces transform.',
    )
  }
  // ExpoModulesProvider imports the kit as internal; a plain import is an ambiguous access level.
  const withImport = contents.includes(kitImport)
    ? contents
    : contents.replace('internal import Expo\n', `internal import Expo\n${kitImport}`)
  return withImport.replace(factoryStored, `${factoryStored}${surfaceFactory}`)
}

const withDuoSurfaces = (config) =>
  withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('The Duo surfaces plugin requires a Swift AppDelegate.')
    }
    config.modResults.contents = applyDuoSurfaces(config.modResults.contents)
    return config
  })

module.exports = withDuoSurfaces
module.exports.applyDuoSurfaces = applyDuoSurfaces
