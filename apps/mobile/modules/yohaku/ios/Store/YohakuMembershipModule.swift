import ExpoModulesCore
import StoreKit

public class YohakuMembershipModule: Module {
  private var membershipUpdatesTask: Task<Void, Never>?

  public override func didStartListening(event: String) {
    guard event == "onMembershipTransaction" else { return }
    membershipUpdatesTask?.cancel()
    membershipUpdatesTask = Task { [weak self] in
      for await result in Transaction.updates {
        guard !Task.isCancelled else { return }
        guard case .verified(let transaction) = result else { continue }
        self?.sendEvent("onMembershipTransaction", [
          "productId": transaction.productID,
          "signedTransactionInfo": result.jwsRepresentation,
        ])
      }
    }
  }

  public override func didStopListening(event: String) {
    guard event == "onMembershipTransaction" else { return }
    membershipUpdatesTask?.cancel()
    membershipUpdatesTask = nil
  }

  public override func willDestroy() {
    membershipUpdatesTask?.cancel()
    membershipUpdatesTask = nil
  }

  public func definition() -> ModuleDefinition {
    Name("YohakuMembership")

    Events("onMembershipTransaction")

    AsyncFunction("presentSubscriptionStore") { (payload: MembershipProductIdsPayload) in
      try await self.presentSubscriptionStore(payload)
    }.runOnQueue(.main)

    AsyncFunction("currentEntitlementJws") { (payload: MembershipProductIdsPayload) in
      try await self.currentEntitlementJws(payload)
    }

    AsyncFunction("unfinishedMembershipTransactionJws") { (payload: MembershipProductIdsPayload) in
      try await self.unfinishedMembershipTransactionJws(payload)
    }

    AsyncFunction("finishMembershipTransaction") { (signedTransactionInfo: String) in
      await MembershipStore.finishTransaction(signedTransactionInfo: signedTransactionInfo)
    }

    AsyncFunction("showManageSubscriptions") {
      try await MembershipStore.showManageSubscriptions()
    }.runOnQueue(.main)
  }

  @MainActor
  private func presentSubscriptionStore(
    _ payload: MembershipProductIdsPayload
  ) async throws -> MembershipCheckoutResult {
    try await MembershipStore.present(
      productIds: payload.productIds,
      appAccountToken: try MembershipStore.accountToken(from: payload.appAccountToken)
    )
  }

  private func currentEntitlementJws(
    _ payload: MembershipProductIdsPayload
  ) async throws -> [String] {
    await MembershipStore.currentEntitlementJws(
      productIds: payload.productIds,
      appAccountToken: try MembershipStore.accountToken(from: payload.appAccountToken)
    )
  }

  private func unfinishedMembershipTransactionJws(
    _ payload: MembershipProductIdsPayload
  ) async throws -> [String] {
    await MembershipStore.unfinishedTransactionJws(
      productIds: payload.productIds,
      appAccountToken: try MembershipStore.accountToken(from: payload.appAccountToken)
    )
  }
}
