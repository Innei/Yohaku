import ExpoModulesCore
import UIKit

/// Telegram-style self-drawn top edge: variableBlur r=1 @ scale 0.5 with a
/// compact, nonlinear mask. Progress remains screen-owned and drives alpha.
final class VariableBlurEdgeView: ExpoView {
  private let blurHost = UIView()
  private let maskSource = UIImageView()
  private let readabilityView = UIView()
  private let readabilityMaskSource = UIImageView()
  private var backdrop: CALayer?
  private var blurFilter: NSObject?
  private var progress: CGFloat = 0
  private var lastMaskSize = CGSize.zero
  private var navigationForegroundColor: UIColor?
  private weak var managedNavigationBar: UINavigationBar?
  private weak var managedTitleView: NavigationHeaderTitleView?
  private var managedBarButtonItems: [(item: UIBarButtonItem, tint: UIColor?)] = []
  private var originalNavigationTintColor: UIColor?
  private var originalStatusBarStyle: UIStatusBarStyle?
  private var navigationContrastActive = false
  private let usesLayerMaskSource = {
    if #available(iOS 26.0, *) { return true }
    return false
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    backgroundColor = .clear
    isOpaque = false
    isUserInteractionEnabled = false
    clipsToBounds = false

    blurHost.backgroundColor = .clear
    blurHost.isOpaque = false
    blurHost.isUserInteractionEnabled = false
    blurHost.clipsToBounds = false
    blurHost.alpha = 0
    addSubview(blurHost)

    maskSource.contentMode = .scaleToFill
    maskSource.layer.name = "mask_source"

    readabilityView.backgroundColor = .systemBackground
    readabilityView.isOpaque = false
    readabilityView.isUserInteractionEnabled = false
    readabilityView.alpha = 0
    readabilityMaskSource.contentMode = .scaleToFill
    readabilityView.mask = readabilityMaskSource
    addSubview(readabilityView)

    guard
      !UIAccessibility.isReduceTransparencyEnabled,
      let backdrop = makeBackdropLayer(),
      let filter = makeVariableBlurFilter()
    else { return }

    filter.setValue(SystemEdgeBlur.radius as NSNumber, forKey: "inputRadius")
    filter.setValue(true, forKey: "inputNormalizeEdges")
    if usesLayerMaskSource {
      filter.setValue("mask_source", forKey: "inputSourceSublayerName")
    }

    backdrop.filters = [filter]
    backdrop.setValue(SystemEdgeBlur.backdropScale, forKey: "scale")
    blurHost.layer.addSublayer(backdrop)
    backdrop.addSublayer(maskSource.layer)
    self.backdrop = backdrop
    blurFilter = filter
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    blurHost.frame = bounds
    blurHost.frame.size.height = max(
      SystemEdgeBlur.edgeSize,
      bounds.height - SystemEdgeBlur.blurBottomInset
    )
    backdrop?.frame = blurHost.bounds
    maskSource.frame = blurHost.bounds
    readabilityView.frame = bounds
    readabilityMaskSource.frame = readabilityView.bounds
    refreshMaskIfNeeded()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      clearNavigationContrast()
    } else {
      updateNavigationContrast()
    }
  }

  func setProgress(_ value: Double) {
    let next = min(1, max(0, CGFloat(value)))
    guard next != progress else { return }
    progress = next
    applyProgress()
  }

  func setReadabilityColor(_ color: UIColor?) {
    readabilityView.backgroundColor = color ?? .systemBackground
  }

  func setNavigationForegroundColor(_ color: UIColor?) {
    navigationForegroundColor = color
    updateNavigationContrast()
  }

  private func applyProgress() {
    let hidden =
      backdrop == nil
      || UIAccessibility.isReduceTransparencyEnabled
      || progress <= 0.001
    blurHost.isHidden = hidden
    blurHost.alpha = hidden ? 0 : progress
    readabilityView.isHidden = hidden
    readabilityView.alpha = hidden
      ? 0
      : progress * SystemEdgeBlur.readabilityTintAlpha
    updateNavigationContrast()
  }

  private func updateNavigationContrast() {
    guard let foregroundColor = navigationForegroundColor else {
      clearNavigationContrast()
      return
    }
    let shouldApply = navigationContrastActive
      ? progress >= SystemEdgeBlur.navigationContrastOffProgress
      : progress >= SystemEdgeBlur.navigationContrastOnProgress
    guard shouldApply, let navigationBar = findNavigationBar() else {
      clearNavigationContrast()
      return
    }

    if managedNavigationBar !== navigationBar {
      clearNavigationContrast()
      managedNavigationBar = navigationBar
      originalNavigationTintColor = navigationBar.tintColor
    }
    navigationContrastActive = true
    navigationBar.tintColor = foregroundColor
    if managedBarButtonItems.isEmpty, let item = navigationBar.topItem {
      managedBarButtonItems = barButtonItems(in: item).map { ($0, $0.tintColor) }
    }
    for entry in managedBarButtonItems {
      entry.item.tintColor = foregroundColor
    }
    if originalStatusBarStyle == nil {
      originalStatusBarStyle = UIApplication.shared.statusBarStyle
    }
    UIApplication.shared.statusBarStyle = traitCollection.userInterfaceStyle == .dark
      ? .lightContent
      : .darkContent

    let titleView = findTitleView(in: navigationBar)
    if managedTitleView !== titleView {
      managedTitleView?.setNavigationForegroundColor(nil)
      managedTitleView = titleView
    }
    titleView?.setNavigationForegroundColor(foregroundColor)
  }

  private func clearNavigationContrast() {
    managedTitleView?.setNavigationForegroundColor(nil)
    managedTitleView = nil
    for entry in managedBarButtonItems {
      entry.item.tintColor = entry.tint
    }
    managedBarButtonItems = []
    if let navigationBar = managedNavigationBar {
      navigationBar.tintColor = originalNavigationTintColor
    }
    if let statusBarStyle = originalStatusBarStyle {
      UIApplication.shared.statusBarStyle = statusBarStyle
    }
    managedNavigationBar = nil
    originalNavigationTintColor = nil
    originalStatusBarStyle = nil
    navigationContrastActive = false
  }

  private func findNavigationBar() -> UINavigationBar? {
    var responder: UIResponder? = self
    while let current = responder {
      if let controller = current as? UIViewController,
        let navigationBar = controller.navigationController?.navigationBar
      {
        return navigationBar
      }
      responder = current.next
    }
    return nil
  }

  private func findTitleView(in view: UIView) -> NavigationHeaderTitleView? {
    if let titleView = view as? NavigationHeaderTitleView { return titleView }
    for subview in view.subviews {
      if let titleView = findTitleView(in: subview) { return titleView }
    }
    return nil
  }

  private func barButtonItems(in item: UINavigationItem) -> [UIBarButtonItem] {
    var items = (item.leftBarButtonItems ?? []) + (item.rightBarButtonItems ?? [])
    if #available(iOS 16.0, *) {
      let groups = item.leadingItemGroups + item.centerItemGroups
        + item.trailingItemGroups + [item.pinnedTrailingGroup].compactMap { $0 }
      for group in groups {
        items += group.barButtonItems
        if let representativeItem = group.representativeItem {
          items.append(representativeItem)
        }
      }
    }
    var seen = Set<ObjectIdentifier>()
    return items.filter { seen.insert(ObjectIdentifier($0)).inserted }
  }

  private func refreshMaskIfNeeded() {
    let size = blurHost.bounds.size
    guard size.width > 0, size.height > 0, size != lastMaskSize else { return }
    lastMaskSize = size

    if usesLayerMaskSource {
      let image = SystemEdgeBlur.gradientMaskImage()
      maskSource.image = image
      readabilityMaskSource.image = image
    } else {
      let image = SystemEdgeBlur.legacyMaskImage(size: size)
      maskSource.image = image
      blurFilter?.setValue(image.cgImage, forKey: "inputMaskImage")
      readabilityMaskSource.image = SystemEdgeBlur.gradientMaskImage()
    }
  }
}

private enum SystemEdgeBlur {
  static let radius: CGFloat = 1
  static let backdropScale: CGFloat = 0.5
  static let edgeSize: CGFloat = 64
  static let blurBottomInset: CGFloat = 14
  static let gradientHeight: CGFloat = edgeSize - 4
  static let readabilityTintAlpha: CGFloat = 0.75
  static let navigationContrastOnProgress: CGFloat = 0.68
  static let navigationContrastOffProgress: CGFloat = 0.62

  // Telegram's measured top-edge curve. The values are deliberately not
  // replaced with a linear or Gaussian approximation: the long opaque shoulder
  // and compressed transparent tail are what keep the edge soft but compact.
  private static let gradientAlpha: [CGFloat] = [
    0.847_058_823_529_411_8, 0.843_137_254_901_960_8,
    0.839_215_686_274_509_8, 0.835_294_117_647_058_9,
    0.831_372_549_019_607_8, 0.827_450_980_392_156_8,
    0.823_529_411_764_705_8, 0.819_607_843_137_254_9,
    0.815_686_274_509_803_9, 0.811_764_705_882_352_9,
    0.807_843_137_254_902, 0.803_921_568_627_451, 0.8,
    0.796_078_431_372_549_1, 0.792_156_862_745_098,
    0.788_235_294_117_647, 0.784_313_725_490_196_1,
    0.780_392_156_862_745_1, 0.776_470_588_235_294_1,
    0.772_549_019_607_843_2, 0.768_627_450_980_392_1,
    0.764_705_882_352_941_1, 0.760_784_313_725_490_2,
    0.756_862_745_098_039_2, 0.752_941_176_470_588_2,
    0.749_019_607_843_137_3, 0.745_098_039_215_686_3,
    0.741_176_470_588_235_3, 0.737_254_901_960_784_4,
    0.733_333_333_333_333_4, 0.729_411_764_705_882_4,
    0.725_490_196_078_431_3, 0.721_568_627_450_980_4,
    0.717_647_058_823_529_4, 0.713_725_490_196_078_4,
    0.709_803_921_568_627_4, 0.701_960_784_313_725_4,
    0.694_117_647_058_823_5, 0.686_274_509_803_921_6,
    0.678_431_372_549_019_6, 0.670_588_235_294_117_7,
    0.658_823_529_411_764_7, 0.650_980_392_156_862_8,
    0.643_137_254_901_960_7, 0.631_372_549_019_607_8,
    0.623_529_411_764_705_9, 0.615_686_274_509_804,
    0.603_921_568_627_451, 0.596_078_431_372_549,
    0.588_235_294_117_647_1, 0.576_470_588_235_294_1,
    0.564_705_882_352_941_2, 0.552_941_176_470_588_3,
    0.541_176_470_588_235_4, 0.529_411_764_705_882_4,
    0.517_647_058_823_529_3, 0.505_882_352_941_176_4,
    0.494_117_647_058_823_55, 0.486_274_509_803_921_6,
    0.474_509_803_921_568_6, 0.462_745_098_039_215_7,
    0.454_901_960_784_313_8, 0.443_137_254_901_960_76,
    0.431_372_549_019_607_86, 0.419_607_843_137_254_85,
    0.411_764_705_882_352_9, 0.4, 0.388_235_294_117_647,
    0.376_470_588_235_294_1, 0.364_705_882_352_941_2,
    0.352_941_176_470_588_2, 0.341_176_470_588_235_3,
    0.329_411_764_705_882_4, 0.317_647_058_823_529_4,
    0.305_882_352_941_176_5, 0.294_117_647_058_823_5,
    0.282_352_941_176_470_6, 0.270_588_235_294_117_7,
    0.258_823_529_411_764_7, 0.243_137_254_901_960_8,
    0.231_372_549_019_607_8, 0.215_686_274_509_803_93,
    0.199_999_999_999_999_96, 0.180_392_156_862_745_12,
    0.160_784_313_725_490_18, 0.141_176_470_588_235_35,
    0.117_647_058_823_529_44, 0.090_196_078_431_372_56,
    0.047_058_823_529_411_82, 0,
  ]

  private static let gradientLocations: [CGFloat] = [
    0, 0.020_905_923_344_947_737, 0.059_233_449_477_351_915,
    0.087_108_013_937_282_24, 0.108_013_937_282_229_97,
    0.121_951_219_512_195_12, 0.132_404_181_184_668_98,
    0.142_857_142_857_142_85, 0.153_310_104_529_616_71,
    0.160_278_745_644_599_3, 0.170_731_707_317_073_18,
    0.181_184_668_989_547_05, 0.191_637_630_662_020_9,
    0.202_090_592_334_494_78, 0.209_059_233_449_477_36,
    0.212_543_554_006_968_64, 0.219_512_195_121_951_22,
    0.226_480_836_236_933_8, 0.233_449_477_351_916_37,
    0.236_933_797_909_407_66, 0.243_902_439_024_390_24,
    0.247_386_759_581_881_53, 0.254_355_400_696_864_13,
    0.257_839_721_254_355_4, 0.261_324_041_811_846_7,
    0.268_292_682_926_829_3, 0.271_777_003_484_320_55,
    0.275_261_324_041_811_86, 0.282_229_965_156_794_44,
    0.285_714_285_714_285_7, 0.289_198_606_271_777,
    0.292_682_926_829_268_3, 0.296_167_247_386_759_6,
    0.299_651_567_944_250_85, 0.303_135_888_501_742_17,
    0.306_620_209_059_233_43, 0.313_588_850_174_216,
    0.320_557_491_289_198_6, 0.327_526_132_404_181_16,
    0.334_494_773_519_163_8, 0.341_463_414_634_146_37,
    0.348_432_055_749_128_94, 0.355_400_696_864_111_5,
    0.362_369_337_979_094_1, 0.369_337_979_094_076_7,
    0.376_306_620_209_059_25, 0.379_790_940_766_550_5,
    0.386_759_581_881_533_1, 0.393_728_222_996_515_66,
    0.397_212_543_554_007, 0.404_181_184_668_989_56,
    0.411_149_825_783_972_13, 0.418_118_466_898_954_7,
    0.425_087_108_013_937_3, 0.432_055_749_128_919_86,
    0.439_024_390_243_902_44, 0.445_993_031_358_885,
    0.452_961_672_473_867_6, 0.456_445_993_031_358_9,
    0.463_414_634_146_341_5, 0.470_383_275_261_324_06,
    0.473_867_595_818_815_3, 0.480_836_236_933_797_9,
    0.487_804_878_048_780_5, 0.494_773_519_163_763_05,
    0.498_257_839_721_254_37, 0.505_226_480_836_236_9,
    0.512_195_121_951_219_5, 0.519_163_763_066_202,
    0.526_132_404_181_184_7, 0.533_101_045_296_167_2,
    0.540_069_686_411_149_8, 0.547_038_327_526_132_4,
    0.554_006_968_641_115, 0.560_975_609_756_097_6,
    0.567_944_250_871_080_1, 0.574_912_891_986_062_8,
    0.581_881_533_101_045_3, 0.588_850_174_216_027_9,
    0.599_303_135_888_501_7, 0.606_271_777_003_484_3,
    0.616_724_738_675_958_2, 0.627_177_700_348_432,
    0.641_114_982_578_397_2, 0.658_536_585_365_853_7,
    0.675_958_188_153_310_1, 0.696_864_111_498_257_9,
    0.728_222_996_515_679_5, 0.790_940_766_550_522_7, 1,
  ]

  static func gradientMaskImage() -> UIImage {
    let image = renderGradient(size: CGSize(width: 1, height: gradientHeight))
    return image.resizableImage(
      withCapInsets: UIEdgeInsets(
        top: 0,
        left: 0,
        bottom: gradientHeight,
        right: 0
      ),
      resizingMode: .stretch
    )
  }

  static func legacyMaskImage(size: CGSize) -> UIImage {
    let format = UIGraphicsImageRendererFormat()
    format.opaque = false
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    return renderer.image { context in
      let ctx = context.cgContext
      ctx.clear(CGRect(origin: .zero, size: size))
      ctx.setFillColor(UIColor.black.cgColor)
      let constantHeight = max(0, size.height - gradientHeight)
      ctx.fill(CGRect(x: 0, y: 0, width: size.width, height: constantHeight))
      renderGradient(size: CGSize(width: 1, height: gradientHeight)).draw(
        in: CGRect(
          x: 0,
          y: constantHeight,
          width: size.width,
          height: min(gradientHeight, size.height)
        )
      )
    }
  }

  private static func renderGradient(size: CGSize) -> UIImage {
    precondition(gradientAlpha.count == gradientLocations.count)
    let normalization = gradientAlpha.max() ?? 1
    let colors = gradientAlpha.map {
      UIColor(white: 0, alpha: $0 / normalization).cgColor
    }
    var locations = gradientLocations
    let gradient = CGGradient(
      colorsSpace: CGColorSpaceCreateDeviceRGB(),
      colors: colors as CFArray,
      locations: &locations
    )!
    let format = UIGraphicsImageRendererFormat()
    format.opaque = false
    format.scale = 1
    return UIGraphicsImageRenderer(size: size, format: format).image { context in
      let ctx = context.cgContext
      ctx.clear(CGRect(origin: .zero, size: size))
      ctx.drawLinearGradient(
        gradient,
        start: CGPoint(x: 0, y: 0),
        end: CGPoint(x: 0, y: size.height),
        options: []
      )
    }
  }
}

private func makeBackdropLayer() -> CALayer? {
  let name = ("CA" as NSString).appending("BackdropLayer")
  guard let cls = NSClassFromString(name) as? NSObject.Type else { return nil }
  return cls.init() as? CALayer
}

private func makeVariableBlurFilter() -> NSObject? {
  guard let filterClass = NSClassFromString("CAFilter") as? NSObject.Type else {
    return nil
  }
  for selectorName in ["filterWithName:", "filterWithType:"] {
    let selector = NSSelectorFromString(selectorName)
    if filterClass.responds(to: selector),
      let filter = filterClass.perform(selector, with: "variableBlur")?
        .takeUnretainedValue() as? NSObject
    {
      return filter
    }
  }
  return nil
}
