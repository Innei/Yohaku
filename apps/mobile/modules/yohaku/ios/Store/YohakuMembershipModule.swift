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

    AsyncFunction("presentSubscriptionStore") { (appAccountToken: String, productIds: [String]) -> [String: String] in
      let result = try await MembershipStore.present(
        productIds: productIds,
        appAccountToken: try MembershipStore.accountToken(from: appAccountToken)
      )
      return [
        "status": result.status,
        "signedTransactionInfo": result.signedTransactionInfo,
      ]
    }

    AsyncFunction("currentEntitlementJws") { (appAccountToken: String, productIds: [String]) -> [String] in
      try await MembershipStore.currentEntitlementJws(
        productIds: productIds,
        appAccountToken: try MembershipStore.accountToken(from: appAccountToken)
      )
    }

    AsyncFunction("unfinishedMembershipTransactionJws") { (appAccountToken: String, productIds: [String]) -> [String] in
      try await MembershipStore.unfinishedTransactionJws(
        productIds: productIds,
        appAccountToken: try MembershipStore.accountToken(from: appAccountToken)
      )
    }

    AsyncFunction("finishMembershipTransaction") { (signedTransactionInfo: String) in
      await MembershipStore.finishTransaction(signedTransactionInfo: signedTransactionInfo)
    }

    AsyncFunction("showManageSubscriptions") {
      try await MembershipStore.showManageSubscriptions()
    }
  }
}
