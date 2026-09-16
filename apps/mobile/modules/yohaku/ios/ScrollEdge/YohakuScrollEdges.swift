import UIKit

enum YohakuScrollEdges {
  static func navigation(_ scrollView: UIScrollView) {
    guard #available(iOS 26.0, *) else { return }
    scrollView.topEdgeEffect.isHidden = false
    scrollView.topEdgeEffect.style = .soft
    floatingControls(scrollView)
  }

  static func hideTop(_ scrollView: UIScrollView) {
    guard #available(iOS 26.0, *) else { return }
    scrollView.topEdgeEffect.isHidden = true
    floatingControls(scrollView)
  }

  static func floatingControls(_ scrollView: UIScrollView) {
    guard #available(iOS 26.0, *) else { return }
    scrollView.bottomEdgeEffect.isHidden = false
    scrollView.bottomEdgeEffect.style = .soft
  }
}
