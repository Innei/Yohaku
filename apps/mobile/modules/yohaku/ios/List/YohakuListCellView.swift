import ExpoModulesCore
import UIKit

final class YohakuListCellView: ExpoView {
  private(set) var itemId = ""
  weak var list: YohakuListView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = false
    backgroundColor = .clear
  }

  // Fabric positions this view via center/bounds at its Yoga origin inside
  // the list column, but it lives reparented inside a collection cell, so
  // the origin is pinned to zero and only Yoga's size is kept.
  override var center: CGPoint {
    get { super.center }
    set { super.center = CGPoint(x: bounds.width / 2, y: bounds.height / 2) }
  }

  override var bounds: CGRect {
    didSet { super.center = CGPoint(x: bounds.width / 2, y: bounds.height / 2) }
  }

  func setItemId(_ id: String) {
    guard itemId != id else { return }
    itemId = id
    list?.attachHost(self)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard !itemId.isEmpty, bounds.height > 1 else { return }
    list?.reportHostHeight(itemId, bounds.height)
  }
}
