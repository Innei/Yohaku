import ExpoModulesCore

struct YohakuListFabricMarkSpec: Record {
  @Field var compactT: Double = 0
  @Field var expandedT: Double = 0
  @Field var id: String = ""
  @Field var itemId: String = ""
  @Field var kind: String = "note"
  @Field var label: String = ""
  @Field var parentItemId: String = ""
  @Field var year: Int = 0
}

enum YohakuListFabricMetrics {
  static let compactWidth: CGFloat = 36
  static let expandedWidth: CGFloat = 88
  static let minHitWidth: CGFloat = 36
  static let snapThreshold: CGFloat = 0.5
  static let flingVelocity: CGFloat = 1.6
  /// Matches `springs.settle` in `apps/mobile/src/theme/motion.ts`.
  static let settleOmega: CGFloat = 18
}
