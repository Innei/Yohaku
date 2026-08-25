import CryptoKit
import Foundation
import ImageIO
import UIKit

enum SiteReferer {
  /// Matches `normalizeSiteReferer` in `site-referer.ts`: origin + trailing slash.
  static func normalized(_ origin: String?) -> String? {
    guard
      let trimmed = origin?.trimmingCharacters(in: .whitespacesAndNewlines),
      !trimmed.isEmpty,
      let url = URL(string: trimmed),
      let scheme = url.scheme?.lowercased(),
      scheme == "http" || scheme == "https",
      url.host != nil
    else {
      return nil
    }
    var components = URLComponents()
    components.scheme = url.scheme
    components.host = url.host
    components.port = url.port
    guard let value = components.string, !value.isEmpty else { return nil }
    return value.hasSuffix("/") ? value : value + "/"
  }
}

struct DomImageAssetSource: Hashable {
  let rawValue: String
  let remoteURL: URL?
  let referer: String?
  let cacheKey: String

  var request: URLRequest? {
    guard let remoteURL else { return nil }
    var request = URLRequest(url: remoteURL)
    if let referer {
      request.setValue(referer, forHTTPHeaderField: "Referer")
    }
    return request
  }

  static func resolve(_ rawValue: String, siteReferer: String? = nil) -> DomImageAssetSource? {
    if rawValue.hasPrefix("data:") {
      return DomImageAssetSource(
        rawValue: rawValue,
        remoteURL: nil,
        referer: nil,
        cacheKey: digest("inline\n\(rawValue)")
      )
    }

    guard let url = URL(string: rawValue) else { return nil }
    if url.scheme?.lowercased() == DomAssetSchemeHandler.scheme {
      return resolveAssetURL(url, rawValue: rawValue)
    }
    if url.isFileURL {
      guard isCachedFile(url) else { return nil }
      let file = url.standardizedFileURL
      return DomImageAssetSource(
        rawValue: rawValue,
        remoteURL: file,
        referer: nil,
        cacheKey: digest("file\n\(file.path)")
      )
    }
    guard url.scheme?.lowercased() == "https" else { return nil }
    let referer = SiteReferer.normalized(siteReferer)
    return DomImageAssetSource(
      rawValue: rawValue,
      remoteURL: url,
      referer: referer,
      cacheKey: digest("remote\n\(url.absoluteString)\n\(referer ?? "")")
    )
  }

  static func resolveAssetURL(_ url: URL, rawValue: String? = nil) -> DomImageAssetSource? {
    guard
      let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let targetValue = components.queryItems?.first(where: { $0.name == "u" })?.value,
      let targetURL = URL(string: targetValue),
      targetURL.scheme?.lowercased() == "https"
    else {
      return nil
    }
    let requestedReferer = components.queryItems?.first(where: { $0.name == "r" })?.value
    let referer = requestedReferer?.isEmpty == false ? requestedReferer : nil
    return DomImageAssetSource(
      rawValue: rawValue ?? url.absoluteString,
      remoteURL: targetURL,
      referer: referer,
      cacheKey: digest("remote\n\(targetURL.absoluteString)\n\(referer ?? "")")
    )
  }

  /// Insights mermaid writes PNGs into Caches. Preview used to only accept
  /// `data:` / `https`, so tapping a `file://` diagram did nothing.
  private static func isCachedFile(_ url: URL) -> Bool {
    let path = url.standardizedFileURL.path
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .standardizedFileURL.path
    return path == caches || path.hasPrefix(caches + "/")
  }

  private static func digest(_ value: String) -> String {
    SHA256.hash(data: Data(value.utf8))
      .map { String(format: "%02x", $0) }
      .joined()
  }
}

struct DomEncodedImageAsset {
  let source: DomImageAssetSource
  let data: Data
  let response: URLResponse
  let fileURL: URL
}

final class DomImageAssetLoadToken {
  private weak var store: DomImageAssetStore?
  private let cacheKey: String
  private let callbackID: UUID
  private var cancelled = false
  private let lock = NSLock()

  init(store: DomImageAssetStore, cacheKey: String, callbackID: UUID) {
    self.store = store
    self.cacheKey = cacheKey
    self.callbackID = callbackID
  }

  func cancel() {
    lock.lock()
    guard !cancelled else {
      lock.unlock()
      return
    }
    cancelled = true
    lock.unlock()
    store?.cancelLoad(cacheKey: cacheKey, callbackID: callbackID)
  }
}

final class DomImageAssetStore {
  static let shared = DomImageAssetStore()

  typealias LoadResult = Result<DomEncodedImageAsset, Error>
  typealias LoadCompletion = (LoadResult) -> Void

  private final class PendingLoad {
    var callbacks: [UUID: LoadCompletion]
    var task: URLSessionDataTask?

    init(callbackID: UUID, completion: @escaping LoadCompletion) {
      self.callbacks = [callbackID: completion]
    }
  }

  private static let errorDomain = "YohakuImageAsset"
  private static let previewMaxPixelSize = 4096
  private static let diskBudget = 200 * 1024 * 1024
  private static let prefetchLimit = 4

  private let stateLock = NSLock()
  private let workQueue = DispatchQueue(
    label: "com.yohaku.dom-image-assets",
    qos: .userInitiated
  )
  private let encodedCache = NSCache<NSString, NSData>()
  private let preparedCache = NSCache<NSString, UIImage>()
  private var pendingLoads: [String: PendingLoad] = [:]
  private var preparingKeys: Set<String> = []
  private var preparationWaiters: [String: [UUID: (UIImage?) -> Void]] = [:]
  private var prefetchQueue: [DomImageAssetSource] = []
  private var prefetchActive = 0
  private var clearGeneration = 0

  private init() {
    encodedCache.totalCostLimit = 48 * 1024 * 1024
    preparedCache.totalCostLimit = 72 * 1024 * 1024
  }

  @discardableResult
  func load(
    _ source: DomImageAssetSource,
    completion: @escaping LoadCompletion
  ) -> DomImageAssetLoadToken {
    let callbackID = UUID()
    var shouldStart = false

    stateLock.lock()
    if let pending = pendingLoads[source.cacheKey] {
      pending.callbacks[callbackID] = completion
    } else {
      pendingLoads[source.cacheKey] = PendingLoad(
        callbackID: callbackID,
        completion: completion
      )
      shouldStart = true
    }
    stateLock.unlock()

    if shouldStart {
      workQueue.async { [weak self] in
        self?.resolveEncodedAsset(source)
      }
    }

    return DomImageAssetLoadToken(
      store: self,
      cacheKey: source.cacheKey,
      callbackID: callbackID
    )
  }

  func preparedImage(for source: DomImageAssetSource) -> UIImage? {
    preparedCache.object(forKey: source.cacheKey as NSString)
  }

  func prepareImage(
    for source: DomImageAssetSource,
    completion: ((UIImage?) -> Void)? = nil
  ) {
    if let image = preparedImage(for: source) {
      if let completion {
        DispatchQueue.main.async { completion(image) }
      }
      return
    }

    if let completion {
      stateLock.lock()
      preparationWaiters[source.cacheKey, default: [:]][UUID()] = completion
      stateLock.unlock()
    }
    ensurePrepared(source: source, data: nil)
  }

  func prefetch(_ urls: [String], siteReferer: String? = nil) {
    let sources = urls.compactMap { DomImageAssetSource.resolve($0, siteReferer: siteReferer) }
    guard !sources.isEmpty else { return }
    stateLock.lock()
    prefetchQueue.append(contentsOf: sources)
    stateLock.unlock()
    pumpPrefetch()
  }

  func clear() {
    stateLock.lock()
    clearGeneration += 1
    prefetchQueue.removeAll()
    prefetchActive = 0
    preparingKeys.removeAll()
    let tasks = pendingLoads.values.compactMap(\.task)
    pendingLoads.removeAll()
    let waiters = preparationWaiters
    preparationWaiters.removeAll()
    stateLock.unlock()

    tasks.forEach { $0.cancel() }

    workQueue.sync {
      try? FileManager.default.removeItem(at: cacheDirectory)
    }

    encodedCache.removeAllObjects()
    preparedCache.removeAllObjects()

    guard !waiters.isEmpty else { return }
    DispatchQueue.main.async {
      for group in waiters.values {
        for waiter in group.values {
          waiter(nil)
        }
      }
    }
  }

  func diskBytes() -> Int64 {
    let files = (try? FileManager.default.contentsOfDirectory(
      at: cacheDirectory,
      includingPropertiesForKeys: [.fileSizeKey]
    )) ?? []
    return files.reduce(Int64(0)) { total, url in
      let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize).map(Int64.init) ?? 0
      return total + size
    }
  }

  private func pumpPrefetch() {
    while true {
      stateLock.lock()
      guard prefetchActive < Self.prefetchLimit, !prefetchQueue.isEmpty else {
        stateLock.unlock()
        return
      }
      let source = prefetchQueue.removeFirst()
      prefetchActive += 1
      stateLock.unlock()
      load(source) { [weak self] _ in
        guard let self else { return }
        self.stateLock.lock()
        self.prefetchActive -= 1
        self.stateLock.unlock()
        self.pumpPrefetch()
      }
    }
  }

  private func touch(_ url: URL) {
    try? FileManager.default.setAttributes(
      [.modificationDate: Date()],
      ofItemAtPath: url.path
    )
  }

  private func enforceDiskBudget() {
    let files = (try? FileManager.default.contentsOfDirectory(
      at: cacheDirectory,
      includingPropertiesForKeys: [.fileSizeKey, .contentModificationDateKey]
    )) ?? []
    let ranked = files.compactMap { url -> (URL, Int64, Date)? in
      let values = try? url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey])
      guard let size = values?.fileSize else { return nil }
      return (url, Int64(size), values?.contentModificationDate ?? .distantPast)
    }
    var total = ranked.reduce(Int64(0)) { $0 + $1.1 }
    guard total > Self.diskBudget else { return }
    for (url, size, _) in ranked.sorted(by: { $0.2 < $1.2 }) {
      guard total > Self.diskBudget else { break }
      try? FileManager.default.removeItem(at: url)
      total -= size
    }
  }

  fileprivate func cancelLoad(cacheKey: String, callbackID: UUID) {
    stateLock.lock()
    guard let pending = pendingLoads[cacheKey] else {
      stateLock.unlock()
      return
    }
    pending.callbacks[callbackID] = nil
    let shouldCancel = pending.callbacks.isEmpty
    let task = shouldCancel ? pending.task : nil
    if shouldCancel {
      pendingLoads[cacheKey] = nil
    }
    stateLock.unlock()
    task?.cancel()
  }

  private var cacheDirectory: URL {
    FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("DomImageAssets", isDirectory: true)
  }

  private func fileURL(for source: DomImageAssetSource) -> URL {
    cacheDirectory.appendingPathComponent("\(source.cacheKey).asset")
  }

  private func resolveEncodedAsset(_ source: DomImageAssetSource) {
    stateLock.lock()
    let cancelled = pendingLoads[source.cacheKey] == nil
    stateLock.unlock()
    guard !cancelled else { return }

    if let cached = encodedCache.object(forKey: source.cacheKey as NSString) {
      let data = cached as Data
      completeWithData(source: source, data: data, response: response(for: source, data: data))
      return
    }

    let destination = fileURL(for: source)
    if let data = try? Data(contentsOf: destination), !data.isEmpty {
      touch(destination)
      encodedCache.setObject(
        data as NSData,
        forKey: source.cacheKey as NSString,
        cost: data.count
      )
      completeWithData(source: source, data: data, response: response(for: source, data: data))
      return
    }

    if source.rawValue.hasPrefix("data:") {
      guard let data = Self.decodeDataURL(source.rawValue), !data.isEmpty else {
        complete(
          cacheKey: source.cacheKey,
          result: .failure(Self.error(code: 422, message: "Invalid image data URL"))
        )
        return
      }
      completeWithData(source: source, data: data, response: response(for: source, data: data))
      return
    }

    guard let request = source.request else {
      complete(
        cacheKey: source.cacheKey,
        result: .failure(Self.error(code: 400, message: "Unsupported image source"))
      )
      return
    }

    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self else { return }
      if let error {
        self.complete(cacheKey: source.cacheKey, result: .failure(error))
        return
      }
      let status = (response as? HTTPURLResponse)?.statusCode ?? 200
      guard
        (200..<300).contains(status),
        let data,
        !data.isEmpty,
        let response
      else {
        self.complete(
          cacheKey: source.cacheKey,
          result: .failure(Self.error(code: status, message: "Image request failed"))
        )
        return
      }
      self.completeWithData(source: source, data: data, response: response)
    }

    stateLock.lock()
    guard let pending = pendingLoads[source.cacheKey] else {
      stateLock.unlock()
      task.cancel()
      return
    }
    pending.task = task
    stateLock.unlock()
    task.resume()
  }

  private func completeWithData(
    source: DomImageAssetSource,
    data: Data,
    response: URLResponse
  ) {
    stateLock.lock()
    let generation = clearGeneration
    let valid = pendingLoads[source.cacheKey] != nil
    stateLock.unlock()
    guard valid else { return }

    encodedCache.setObject(
      data as NSData,
      forKey: source.cacheKey as NSString,
      cost: data.count
    )

    let asset = DomEncodedImageAsset(
      source: source,
      data: data,
      response: response,
      fileURL: fileURL(for: source)
    )
    complete(cacheKey: source.cacheKey, result: .success(asset))
    ensurePrepared(source: source, data: data)

    workQueue.async { [weak self] in
      self?.persist(data: data, to: asset.fileURL, generation: generation)
    }
  }

  private func complete(cacheKey: String, result: LoadResult) {
    stateLock.lock()
    let callbacks = pendingLoads.removeValue(forKey: cacheKey)?.callbacks.values.map { $0 } ?? []
    stateLock.unlock()
    guard !callbacks.isEmpty else { return }
    DispatchQueue.main.async {
      for callback in callbacks {
        callback(result)
      }
    }
  }

  private func persist(data: Data, to destination: URL, generation: Int) {
    stateLock.lock()
    let stale = clearGeneration != generation
    stateLock.unlock()
    guard !stale else { return }

    do {
      try FileManager.default.createDirectory(
        at: cacheDirectory,
        withIntermediateDirectories: true
      )
      if !FileManager.default.fileExists(atPath: destination.path) {
        try data.write(to: destination, options: .atomic)
      }
      stateLock.lock()
      let invalidated = clearGeneration != generation
      stateLock.unlock()
      if invalidated {
        try? FileManager.default.removeItem(at: destination)
        return
      }
      touch(destination)
      enforceDiskBudget()
    } catch {
      // The in-memory asset remains usable for the current presentation. A
      // later request can retry persistence without delaying WebKit's render.
    }
  }

  private func ensurePrepared(source: DomImageAssetSource, data: Data?) {
    if preparedImage(for: source) != nil {
      finishPreparation(cacheKey: source.cacheKey, image: preparedImage(for: source))
      return
    }

    stateLock.lock()
    let inserted = preparingKeys.insert(source.cacheKey).inserted
    stateLock.unlock()
    guard inserted else { return }

    if let data {
      decodePreparedImage(data: data, source: source)
      return
    }

    load(source) { [weak self] result in
      guard let self else { return }
      switch result {
      case .success(let asset):
        self.decodePreparedImage(data: asset.data, source: source)
      case .failure:
        self.finishPreparation(cacheKey: source.cacheKey, image: nil)
      }
    }
  }

  private func decodePreparedImage(data: Data, source: DomImageAssetSource) {
    stateLock.lock()
    let generation = clearGeneration
    stateLock.unlock()
    workQueue.async { [weak self] in
      guard let self else { return }
      let image = Self.makePreparedImage(data: data)
      self.stateLock.lock()
      let stale = self.clearGeneration != generation
      self.stateLock.unlock()
      guard !stale else { return }
      if let image {
        self.preparedCache.setObject(
          image,
          forKey: source.cacheKey as NSString,
          cost: Self.decodedCost(of: image)
        )
      }
      self.finishPreparation(cacheKey: source.cacheKey, image: image)
    }
  }

  private func finishPreparation(cacheKey: String, image: UIImage?) {
    stateLock.lock()
    preparingKeys.remove(cacheKey)
    let waiters = preparationWaiters.removeValue(forKey: cacheKey)?.values.map { $0 } ?? []
    stateLock.unlock()
    guard !waiters.isEmpty else { return }
    DispatchQueue.main.async {
      for waiter in waiters {
        waiter(image)
      }
    }
  }

  private func response(for source: DomImageAssetSource, data: Data) -> URLResponse {
    URLResponse(
      url: source.remoteURL ?? URL(string: "about:blank")!,
      mimeType: Self.inferMimeType(data: data, source: source),
      expectedContentLength: data.count,
      textEncodingName: nil
    )
  }

  private static func inferMimeType(data: Data, source: DomImageAssetSource) -> String {
    if let prefix = String(data: data.prefix(1024), encoding: .utf8),
      prefix.range(of: "<svg", options: .caseInsensitive) != nil {
      return "image/svg+xml"
    }
    if let imageSource = CGImageSourceCreateWithData(data as CFData, nil),
      let type = CGImageSourceGetType(imageSource) as String? {
      switch type {
      case let value where value.contains("jpeg"): return "image/jpeg"
      case let value where value.contains("png"): return "image/png"
      case let value where value.contains("gif"): return "image/gif"
      case let value where value.contains("heic") || value.contains("heif"): return "image/heic"
      case let value where value.contains("webp"): return "image/webp"
      default: break
      }
    }
    switch source.remoteURL?.pathExtension.lowercased() {
    case "png": return "image/png"
    case "gif": return "image/gif"
    case "webp": return "image/webp"
    case "heic", "heif": return "image/heic"
    case "svg": return "image/svg+xml"
    default: return "image/jpeg"
    }
  }

  private static func makePreparedImage(data: Data) -> UIImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: previewMaxPixelSize,
      kCGImageSourceShouldCache: true,
      kCGImageSourceShouldCacheImmediately: true,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
      return nil
    }
    return UIImage(cgImage: image)
  }

  private static func decodedCost(of image: UIImage) -> Int {
    guard let image = image.cgImage else { return 0 }
    return image.bytesPerRow * image.height
  }

  private static func decodeDataURL(_ rawValue: String) -> Data? {
    guard
      let comma = rawValue.firstIndex(of: ","),
      rawValue.starts(with: "data:")
    else {
      return nil
    }
    let metadata = rawValue[..<comma]
    let payload = String(rawValue[rawValue.index(after: comma)...])
    if metadata.lowercased().contains(";base64") {
      return Data(base64Encoded: payload, options: .ignoreUnknownCharacters)
    }
    guard let decoded = payload.removingPercentEncoding else { return nil }
    return Data(decoded.utf8)
  }

  private static func error(code: Int, message: String) -> NSError {
    NSError(
      domain: errorDomain,
      code: code,
      userInfo: [NSLocalizedDescriptionKey: message]
    )
  }
}
