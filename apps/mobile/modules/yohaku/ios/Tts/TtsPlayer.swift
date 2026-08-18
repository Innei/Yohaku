import AVFoundation
import ExpoModulesCore
import MediaPlayer

struct TtsLoadPayload: Record {
  @Field var artist: String = ""
  @Field var rate: Double = 1
  @Field var title: String = ""
  @Field var url: String = ""
}

final class TtsPlayer {
  var emit: (String, [String: Any]) -> Void = { _, _ in }

  private var current: AVPlayer?
  private var next: AVPlayer?
  private var timeObserver: Any?
  private var endObserver: NSObjectProtocol?
  private var failObserver: NSObjectProtocol?
  private var interruptObserver: NSObjectProtocol?
  private var rate: Float = 1
  private var title = ""
  private var artist = ""
  private var commandsBound = false

  func load(payload: TtsLoadPayload) {
    guard let url = URL(string: payload.url) else {
      emit("onTtsError", ["message": "invalid url"])
      return
    }
    rate = Float(payload.rate)
    title = payload.title
    artist = payload.artist
    bindRemoteCommands()
    if let next, sameURL(next, url) {
      install(next)
      self.next = nil
    } else {
      install(AVPlayer(url: url))
    }
    updateNowPlaying(playing: false)
  }

  func play() {
    activateSession()
    current?.play()
    current?.rate = rate
    updateNowPlaying(playing: true)
  }

  func pause() {
    current?.pause()
    updateNowPlaying(playing: false)
  }

  func stop() {
    detachCurrent()
    current?.pause()
    current?.replaceCurrentItem(with: nil)
    next?.replaceCurrentItem(with: nil)
    current = nil
    next = nil
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: .notifyOthersOnDeactivation
    )
  }

  func setRate(_ value: Double) {
    rate = Float(value)
    if current?.timeControlStatus == .playing {
      current?.rate = rate
    }
    updateNowPlaying(playing: current?.timeControlStatus == .playing)
  }

  func preload(urlString: String) {
    guard let url = URL(string: urlString) else { return }
    if let next, sameURL(next, url) { return }
    next = AVPlayer(url: url)
  }

  private func install(_ player: AVPlayer) {
    detachCurrent()
    current = player
    player.automaticallyWaitsToMinimizeStalling = true
    let interval = CMTime(seconds: 0.25, preferredTimescale: 600)
    timeObserver = player.addPeriodicTimeObserver(
      forInterval: interval,
      queue: .main
    ) { [weak self] _ in
      self?.emitTime()
    }
    if let item = player.currentItem {
      endObserver = NotificationCenter.default.addObserver(
        forName: .AVPlayerItemDidPlayToEndTime,
        object: item,
        queue: .main
      ) { [weak self] _ in
        self?.emit("onTtsEnded", [:])
      }
      failObserver = NotificationCenter.default.addObserver(
        forName: .AVPlayerItemFailedToPlayToEndTime,
        object: item,
        queue: .main
      ) { [weak self] _ in
        self?.emit("onTtsError", ["message": "playback failed"])
      }
    }
  }

  private func detachCurrent() {
    if let timeObserver, let current {
      current.removeTimeObserver(timeObserver)
    }
    timeObserver = nil
    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }
    if let failObserver {
      NotificationCenter.default.removeObserver(failObserver)
    }
    endObserver = nil
    failObserver = nil
  }

  private func emitTime() {
    guard let item = current?.currentItem else { return }
    let elapsed = item.currentTime().seconds
    let duration = item.duration.seconds
    emit("onTtsTime", [
      "elapsed": elapsed.isFinite ? elapsed : 0,
      "duration": duration.isFinite ? duration : 0,
    ])
    updateNowPlaying(playing: current?.timeControlStatus == .playing)
  }

  private func activateSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .spokenAudio)
      try session.setActive(true)
    } catch {
      emit("onTtsError", ["message": error.localizedDescription])
    }
    if interruptObserver == nil {
      interruptObserver = NotificationCenter.default.addObserver(
        forName: AVAudioSession.interruptionNotification,
        object: session,
        queue: .main
      ) { [weak self] notification in
        self?.handleInterruption(notification)
      }
    }
  }

  private func handleInterruption(_ notification: Notification) {
    let info = notification.userInfo
    let typeValue = info?[AVAudioSessionInterruptionTypeKey] as? UInt
    guard let typeValue, let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }
    if type == .began {
      current?.pause()
      updateNowPlaying(playing: false)
      emit("onTtsInterrupted", ["shouldResume": false])
      return
    }
    let optionsValue = info?[AVAudioSessionInterruptionOptionKey] as? UInt
    let shouldResume =
      optionsValue.map { AVAudioSession.InterruptionOptions(rawValue: $0).contains(.shouldResume) }
      ?? false
    if shouldResume {
      play()
    }
    emit("onTtsInterrupted", ["shouldResume": shouldResume])
  }

  private func bindRemoteCommands() {
    if commandsBound { return }
    commandsBound = true
    let center = MPRemoteCommandCenter.shared()
    center.nextTrackCommand.isEnabled = false
    center.previousTrackCommand.isEnabled = false
    center.skipForwardCommand.isEnabled = false
    center.skipBackwardCommand.isEnabled = false
    center.changePlaybackPositionCommand.isEnabled = false
    center.playCommand.isEnabled = true
    center.pauseCommand.isEnabled = true
    center.stopCommand.isEnabled = true
    center.playCommand.addTarget { [weak self] _ in
      self?.play()
      self?.emit("onTtsRemote", ["action": "play"])
      return .success
    }
    center.pauseCommand.addTarget { [weak self] _ in
      self?.pause()
      self?.emit("onTtsRemote", ["action": "pause"])
      return .success
    }
    center.stopCommand.addTarget { [weak self] _ in
      self?.stop()
      self?.emit("onTtsRemote", ["action": "stop"])
      return .success
    }
  }

  private func updateNowPlaying(playing: Bool) {
    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    info[MPMediaItemPropertyTitle] = title
    info[MPMediaItemPropertyArtist] = artist
    if let item = current?.currentItem {
      let elapsed = item.currentTime().seconds
      let duration = item.duration.seconds
      info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = elapsed.isFinite ? elapsed : 0
      info[MPMediaItemPropertyPlaybackDuration] = duration.isFinite ? duration : 0
    }
    info[MPNowPlayingInfoPropertyPlaybackRate] = playing ? rate : 0
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  private func sameURL(_ player: AVPlayer, _ url: URL) -> Bool {
    guard let current = player.currentItem?.asset as? AVURLAsset else { return false }
    return current.url.absoluteString == url.absoluteString
  }
}
