import UIKit

enum YohakuToastOverlay {
  static let shared = Host()

  final class Host {
    fileprivate var window: PassThroughWindow?
    fileprivate let canvas = Canvas()

    func show(message: String) {
      attachIfNeeded()
      window?.isHidden = false
      canvas.enqueue(message)
      UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
  }

  fileprivate final class PassThroughWindow: UIWindow {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
      let hit = super.hitTest(point, with: event)
      if hit == self || hit == rootViewController?.view { return nil }
      return hit
    }
  }

  fileprivate final class Canvas: UIView {
    private var pills: [YohakuToastPillView] = []

    override init(frame: CGRect) {
      super.init(frame: frame)
      backgroundColor = .clear
      isOpaque = false
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    func enqueue(_ message: String) {
      let maxWidth = min(bounds.width - 32, 360)
      let pill = YohakuToastPillView(message: message, maxWidth: maxWidth)
      pill.onDismiss = { [weak self] item, towardIsland in
        self?.dismiss(item, towardIsland: towardIsland)
      }
      addSubview(pill)
      pills.append(pill)
      while pills.count > 3 {
        let oldest = pills.removeFirst()
        oldest.clearTimer()
        oldest.removeFromSuperview()
      }
      layoutPills(entering: pill)
    }

    override func layoutSubviews() {
      super.layoutSubviews()
      layoutPills(entering: nil)
    }

    private func layoutPills(entering: YohakuToastPillView?) {
      let reduced = UIAccessibility.isReduceMotionEnabled
      for (index, pill) in pills.reversed().enumerated() {
        let rest = restFrame(for: pill, index: index)
        let scale = 1 - CGFloat(index) * 0.05
        pill.isUserInteractionEnabled = index == 0
        pill.layer.zPosition = CGFloat(100 - index)
        if pill === entering {
          pill.bounds = CGRect(origin: .zero, size: rest.size)
          pill.center = CGPoint(x: rest.midX, y: rest.midY)
          if reduced {
            pill.transform = .identity
            pill.alpha = 1
          } else {
            pill.transform = islandTransform(for: rest)
            pill.alpha = 1
            UIView.animate(
              withDuration: 0.5,
              delay: 0,
              usingSpringWithDamping: 0.78,
              initialSpringVelocity: 0.6
            ) {
              pill.transform = CGAffineTransform(scaleX: scale, y: scale)
            }
          }
        } else if reduced {
          pill.bounds = CGRect(origin: .zero, size: rest.size)
          pill.center = CGPoint(x: rest.midX, y: rest.midY)
          pill.transform = CGAffineTransform(scaleX: scale, y: scale)
        } else {
          UIView.animate(
            withDuration: 0.42,
            delay: 0,
            usingSpringWithDamping: 0.82,
            initialSpringVelocity: 0.3
          ) {
            pill.bounds = CGRect(origin: .zero, size: rest.size)
            pill.center = CGPoint(x: rest.midX, y: rest.midY)
            pill.transform = CGAffineTransform(scaleX: scale, y: scale)
          }
        }
      }
    }

    private func dismiss(_ pill: YohakuToastPillView, towardIsland: Bool) {
      guard let index = pills.firstIndex(of: pill) else { return }
      pills.remove(at: index)
      pill.clearTimer()
      let reduced = UIAccessibility.isReduceMotionEnabled
      let finish = { [weak self] in
        pill.removeFromSuperview()
        if self?.pills.isEmpty == true {
          YohakuToastOverlay.shared.window?.isHidden = true
        }
      }
      if reduced {
        finish()
        layoutPills(entering: nil)
        return
      }
      UIView.animate(
        withDuration: towardIsland ? 0.28 : 0.22,
        delay: 0,
        options: .curveEaseIn
      ) {
        if towardIsland {
          pill.transform = self.islandTransform(for: pill.frame)
        } else {
          pill.alpha = 0
          pill.transform = pill.transform.translatedBy(x: 0, y: -12)
            .scaledBy(x: 0.92, y: 0.92)
        }
        pill.alpha = 0
      } completion: { _ in
        finish()
      }
      layoutPills(entering: nil)
    }

    private func restFrame(for pill: YohakuToastPillView, index: Int) -> CGRect {
      let size = pill.fittedSize()
      let island = islandRect()
      let x = (bounds.width - size.width) / 2
      let y = island.maxY + 8 + CGFloat(index) * 10
      return CGRect(origin: CGPoint(x: x, y: y), size: size)
    }

    private func islandRect() -> CGRect {
      let inset = safeAreaInsets.top
      let hasIsland = inset >= 59
      let size = hasIsland ? CGSize(width: 126, height: 37) : CGSize(width: 72, height: 24)
      let y: CGFloat = hasIsland ? 11 : 6
      return CGRect(
        x: (bounds.width - size.width) / 2,
        y: y,
        width: size.width,
        height: size.height
      )
    }

    private func islandTransform(for rest: CGRect) -> CGAffineTransform {
      let island = islandRect()
      guard rest.width > 0, rest.height > 0 else { return .identity }
      let scaleX = island.width / rest.width
      let scaleY = island.height / rest.height
      let dx = island.midX - rest.midX
      let dy = island.midY - rest.midY
      return CGAffineTransform(translationX: dx, y: dy)
        .scaledBy(x: scaleX, y: scaleY)
    }
  }
}

extension YohakuToastOverlay.Host {
  fileprivate func attachIfNeeded() {
    if window != nil { return }
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    guard
      let scene = scenes.first(where: { $0.activationState == .foregroundActive })
      ?? scenes.first
    else { return }
    let win = YohakuToastOverlay.PassThroughWindow(windowScene: scene)
    win.windowLevel = .alert + 1
    win.backgroundColor = .clear
    win.frame = scene.coordinateSpace.bounds
    let root = UIViewController()
    root.view.backgroundColor = .clear
    canvas.frame = win.bounds
    canvas.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    root.view.addSubview(canvas)
    win.rootViewController = root
    win.isHidden = false
    window = win
  }
}
