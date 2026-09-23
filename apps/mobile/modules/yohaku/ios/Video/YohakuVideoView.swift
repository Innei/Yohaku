import AVFoundation
import AVKit
import ExpoModulesCore
import UIKit

private final class YohakuFullScreenPlayerController: AVPlayerViewController {
  var onDismiss: (() -> Void)?

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    if isBeingDismissed { onDismiss?() }
  }
}

final class YohakuVideoView: ExpoView, AVPlayerViewControllerDelegate {
  let onNaturalSize = EventDispatcher()

  private let playerController = AVPlayerViewController()
  private let posterView = UIImageView()
  private let playButton = UIButton(type: .custom)
  private let fullScreenButton = UIButton(type: .custom)
  private let durationPill = UIView()
  private let durationLabel = UILabel()
  private var src: String?
  private var asset: AVURLAsset?
  private var loadTask: Task<Void, Never>?
  private var readyObservation: NSKeyValueObservation?
  private var playbackObservation: NSKeyValueObservation?
  private var isFullScreen = false
  private var posterURL: URL?
  private var posterImage: UIImage?
  private var posterTask: Task<Void, Never>?
  private var loops = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true

    playerController.showsPlaybackControls = false
    playerController.videoGravity = .resizeAspect
    playerController.delegate = self
    addSubview(playerController.view)

    posterView.contentMode = .scaleAspectFit
    if let overlay = playerController.contentOverlayView {
      posterView.frame = overlay.bounds
      posterView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      overlay.addSubview(posterView)
    }

    playButton.backgroundColor = UIColor(red: 253 / 255, green: 252 / 255, blue: 249 / 255, alpha: 0.92)
    playButton.layer.cornerRadius = 28
    playButton.layer.shadowColor = UIColor(red: 20 / 255, green: 19 / 255, blue: 18 / 255, alpha: 1).cgColor
    playButton.layer.shadowOpacity = 0.25
    playButton.layer.shadowRadius = 8
    playButton.layer.shadowOffset = CGSize(width: 0, height: 6)
    playButton.setImage(
      UIImage(
        systemName: "play.fill",
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 20, weight: .regular)
      ),
      for: .normal
    )
    playButton.tintColor = UIColor(red: 36 / 255, green: 35 / 255, blue: 31 / 255, alpha: 1)
    playButton.accessibilityLabel = "播放视频"
    playButton.addTarget(self, action: #selector(playInline), for: .touchUpInside)
    addSubview(playButton)

    fullScreenButton.setImage(
      UIImage(
        systemName: "arrow.up.left.and.arrow.down.right",
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
      ),
      for: .normal
    )
    fullScreenButton.tintColor = UIColor(red: 253 / 255, green: 252 / 255, blue: 249 / 255, alpha: 1)
    fullScreenButton.accessibilityLabel = "全屏播放"
    fullScreenButton.addTarget(self, action: #selector(presentFullScreen), for: .touchUpInside)
    addSubview(fullScreenButton)

    durationPill.backgroundColor = UIColor(red: 20 / 255, green: 19 / 255, blue: 18 / 255, alpha: 0.62)
    durationPill.isHidden = true
    durationLabel.font = .monospacedDigitSystemFont(ofSize: 12, weight: .regular)
    durationLabel.textColor = UIColor(red: 253 / 255, green: 252 / 255, blue: 249 / 255, alpha: 1)
    durationPill.addSubview(durationLabel)
    addSubview(durationPill)
  }

  deinit {
    loadTask?.cancel()
    posterTask?.cancel()
  }

  func setSrc(_ value: String) {
    guard value != src else { return }
    src = value
    reset()
    guard let url = URL(string: value) else { return }
    let asset = AVURLAsset(url: url)
    self.asset = asset
    loadTask = Task { [weak self] in
      await self?.loadMetadata(asset)
    }
    startLoopingIfVisible()
  }

  func setPoster(_ value: String?) {
    let url = value.flatMap { URL(string: $0) }
    guard url != posterURL else { return }
    posterURL = url
    posterImage = nil
    posterView.image = nil
    posterTask?.cancel()
    guard let url else { return }
    posterTask = Task { [weak self] in
      guard let (data, _) = try? await URLSession.shared.data(from: url),
        let image = UIImage(data: data)
      else { return }
      await MainActor.run {
        guard let self, self.posterURL == url else { return }
        self.posterImage = image
        self.posterView.image = image
      }
    }
  }

  func setLoop(_ value: Bool) {
    guard value != loops else { return }
    loops = value
    playButton.isHidden = value
    fullScreenButton.isHidden = value
    if value { durationPill.isHidden = true }
    startLoopingIfVisible()
  }

  func setBackdropColor(_ color: UIColor?) {
    backgroundColor = color
    playerController.view.backgroundColor = color
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    playerController.view.frame = bounds
    playButton.frame = CGRect(x: bounds.midX - 28, y: bounds.midY - 28, width: 56, height: 56)
    fullScreenButton.frame = CGRect(x: bounds.maxX - 50, y: 6, width: 44, height: 44)
    let labelSize = durationLabel.sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: 16))
    let pillSize = CGSize(width: ceil(labelSize.width) + 16, height: 22)
    durationPill.frame = CGRect(
      x: bounds.maxX - 12 - pillSize.width,
      y: bounds.maxY - 12 - pillSize.height,
      width: pillSize.width,
      height: pillSize.height
    )
    durationPill.layer.cornerRadius = pillSize.height / 2
    durationLabel.frame = durationPill.bounds.insetBy(dx: 8, dy: 3)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      guard !isFullScreen else { return }
      playerController.player?.pause()
      deactivateAudioSessionIfIdle()
      playerController.willMove(toParent: nil)
      playerController.removeFromParent()
      return
    }
    if playerController.parent == nil, let host = hostViewController {
      host.addChild(playerController)
      playerController.didMove(toParent: host)
    }
    startLoopingIfVisible()
  }

  func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    isFullScreen = true
  }

  func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      if !context.isCancelled { self?.isFullScreen = false }
    }
  }

  @objc private func playInline() {
    let player = ensurePlayer()
    enterPlaybackState()
    try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
    player.play()
  }

  @objc private func presentFullScreen() {
    guard let host = hostViewController, host.presentedViewController == nil else { return }
    let player = ensurePlayer()
    let controller = YohakuFullScreenPlayerController()
    controller.player = player
    controller.modalPresentationStyle = .fullScreen
    controller.onDismiss = { [weak self] in
      self?.isFullScreen = false
      self?.enterPlaybackState()
      self?.deactivateAudioSessionIfIdle()
    }
    isFullScreen = true
    try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
    host.present(controller, animated: true) {
      player.play()
    }
  }

  private var hostViewController: UIViewController? {
    var responder: UIResponder? = next
    while let current = responder {
      if let controller = current as? UIViewController { return controller }
      responder = current.next
    }
    return nil
  }

  private func ensurePlayer() -> AVPlayer {
    if let player = playerController.player { return player }
    let player = AVPlayer(playerItem: asset.map { AVPlayerItem(asset: $0) })
    playerController.player = player
    readyObservation = playerController.observe(\.isReadyForDisplay, options: [.initial, .new]) {
      [weak self] controller, _ in
      guard controller.isReadyForDisplay else { return }
      DispatchQueue.main.async { self?.posterView.isHidden = true }
    }
    playbackObservation = player.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
      guard player.timeControlStatus == .paused else { return }
      DispatchQueue.main.async { self?.deactivateAudioSessionIfIdle() }
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playbackDidEnd),
      name: .AVPlayerItemDidPlayToEndTime,
      object: player.currentItem
    )
    return player
  }

  @objc private func playbackDidEnd() {
    if loops, let player = playerController.player {
      player.seek(to: .zero)
      player.play()
      return
    }
    deactivateAudioSessionIfIdle()
  }

  private func startLoopingIfVisible() {
    guard loops, window != nil, asset != nil else { return }
    let player = ensurePlayer()
    player.isMuted = true
    player.actionAtItemEnd = .none
    player.preventsDisplaySleepDuringVideoPlayback = false
    player.play()
  }

  private func deactivateAudioSessionIfIdle() {
    guard !loops, playerController.player?.timeControlStatus != .playing else { return }
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func enterPlaybackState() {
    playerController.showsPlaybackControls = true
    playButton.isHidden = true
    fullScreenButton.isHidden = true
    durationPill.isHidden = true
  }

  private func reset() {
    loadTask?.cancel()
    loadTask = nil
    readyObservation = nil
    playbackObservation = nil
    NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
    playerController.player?.pause()
    playerController.player = nil
    playerController.showsPlaybackControls = false
    asset = nil
    posterView.image = posterImage
    posterView.isHidden = false
    playButton.isHidden = loops
    fullScreenButton.isHidden = loops
    durationPill.isHidden = true
  }

  @MainActor
  private func loadMetadata(_ asset: AVURLAsset) async {
    if let track = try? await asset.loadTracks(withMediaType: .video).first,
      let geometry = try? await track.load(.naturalSize, .preferredTransform)
    {
      let rect = CGRect(origin: .zero, size: geometry.0).applying(geometry.1)
      guard !Task.isCancelled, asset === self.asset else { return }
      if rect.width != 0, rect.height != 0 {
        onNaturalSize(["width": abs(rect.width), "height": abs(rect.height)])
      }
    }

    if let duration = try? await asset.load(.duration), duration.seconds.isFinite {
      guard !Task.isCancelled, asset === self.asset else { return }
      durationLabel.text = formatDuration(duration.seconds)
      durationPill.isHidden = playerController.showsPlaybackControls || loops
      setNeedsLayout()
    }

    guard posterURL == nil else { return }
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.maximumSize = CGSize(width: 1280, height: 1280)
    if let frame = try? await generator.image(at: .zero) {
      guard !Task.isCancelled, asset === self.asset else { return }
      posterView.image = UIImage(cgImage: frame.image)
    }
  }

  private func formatDuration(_ seconds: Double) -> String {
    let total = Int(seconds.rounded())
    let hours = total / 3600
    let minutes = total % 3600 / 60
    let secs = total % 60
    return hours > 0
      ? String(format: "%d:%02d:%02d", hours, minutes, secs)
      : String(format: "%d:%02d", minutes, secs)
  }
}
