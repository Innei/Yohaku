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
