import ExpoModulesCore
import StoreKit
import SwiftUI
import UIKit

struct MembershipProductIdsPayload: Record {
  @Field var productIds: [String] = []
}

enum MembershipStore {
  enum StoreError: Error, LocalizedError {
    case missingProductIds
    case noWindowScene
    case productsUnavailable

    var errorDescription: String? {
      switch self {
      case .missingProductIds:
        return "presentSubscriptionStore requires productIds"
      case .noWindowScene:
        return "No window scene is available"
      case .productsUnavailable:
        return "StoreKit could not load subscription products"
      }
    }
  }

  @MainActor
  static func present(productIds: [String]) async throws -> [String: Any] {
    let ids = productIds.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    guard !ids.isEmpty else { throw StoreError.missingProductIds }
    let products = try await Product.products(for: Set(ids))
    guard !products.isEmpty else { throw StoreError.productsUnavailable }
    return try await Presenter(productIds: Set(ids)).present()
  }

  static func currentEntitlementJws(productIds: [String]) async -> [String] {
    let allowed = Set(productIds)
    var tokens: [String] = []
    for await entitlement in Transaction.currentEntitlements {
      guard case .verified(let transaction) = entitlement else { continue }
      guard allowed.contains(transaction.productID) else { continue }
      guard let token = String(data: transaction.jsonRepresentation, encoding: .utf8) else {
        continue
      }
      tokens.append(token)
    }
    return tokens
  }

  @MainActor
  static func showManageSubscriptions() async throws {
    try await AppStore.showManageSubscriptions(in: keyWindowScene())
  }

  @MainActor
  static func keyWindowScene() throws -> UIWindowScene {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    if let active = scenes.first(where: { $0.activationState == .foregroundActive }) {
      return active
    }
    if let first = scenes.first {
      return first
    }
    throw StoreError.noWindowScene
  }

  @MainActor
  private static func keyPresenter() throws -> UIViewController {
    let scene = try keyWindowScene()
    let window = scene.keyWindow ?? scene.windows.first { $0.isKeyWindow } ?? scene.windows.first
    guard var top = window?.rootViewController else { throw StoreError.noWindowScene }
    while let presented = top.presentedViewController {
      top = presented
    }
    return top
  }

  @MainActor
  private final class Presenter: NSObject, UIAdaptivePresentationControllerDelegate {
    private var continuation: CheckedContinuation<[String: Any], Error>?
    private var host: UIHostingController<MembershipSubscriptionSheet>?
    private let productIds: Set<String>
    private var updatesTask: Task<Void, Never>?

    init(productIds: Set<String>) {
      self.productIds = productIds
    }

    func present() async throws -> [String: Any] {
      try await withCheckedThrowingContinuation { continuation in
        self.continuation = continuation
        let sheet = MembershipSubscriptionSheet(
          productIDs: Array(productIds),
          onPurchase: { [weak self] result in
            self?.handlePurchase(result)
          }
        )
        let host = UIHostingController(rootView: sheet)
        host.modalPresentationStyle = .pageSheet
        host.presentationController?.delegate = self
        self.host = host
        updatesTask = Task { [weak self] in
          await self?.listenForUpdates()
        }
        do {
          try MembershipStore.keyPresenter().present(host, animated: true)
        } catch {
          finish(error: error)
        }
      }
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
      finish(payload: ["status": "cancelled"])
    }

    private func handlePurchase(_ result: Product.PurchaseResult) {
      switch result {
      case .success(let verification):
        guard case .verified(let transaction) = verification else { return }
        guard let token = String(data: transaction.jsonRepresentation, encoding: .utf8) else {
          return
        }
        Task { await transaction.finish() }
        finish(payload: [
          "signedTransactionInfo": token,
          "status": "purchased",
        ])
      case .pending, .userCancelled:
        break
      @unknown default:
        break
      }
    }

    private func listenForUpdates() async {
      for await update in Transaction.updates {
        guard case .verified(let transaction) = update else { continue }
        guard productIds.contains(transaction.productID) else { continue }
        guard let token = String(data: transaction.jsonRepresentation, encoding: .utf8) else {
          continue
        }
        await transaction.finish()
        await MainActor.run {
          self.finish(payload: [
            "signedTransactionInfo": token,
            "status": "restored",
          ])
        }
      }
    }

    private func finish(payload: [String: Any]) {
      guard let continuation else { return }
      self.continuation = nil
      updatesTask?.cancel()
      updatesTask = nil
      let host = self.host
      self.host = nil
      host?.dismiss(animated: true)
      continuation.resume(returning: payload)
    }

    private func finish(error: Error) {
      guard let continuation else { return }
      self.continuation = nil
      updatesTask?.cancel()
      updatesTask = nil
      self.host = nil
      continuation.resume(throwing: error)
    }
  }
}

private struct MembershipSubscriptionSheet: View {
  let productIDs: [String]
  let onPurchase: (Product.PurchaseResult) -> Void

  var body: some View {
    SubscriptionStoreView(productIDs: productIDs)
      .storeButton(.visible, for: .restorePurchases)
      .onInAppPurchaseCompletion { _, result in
        if case .success(let purchase) = result {
          onPurchase(purchase)
        }
      }
  }
}
