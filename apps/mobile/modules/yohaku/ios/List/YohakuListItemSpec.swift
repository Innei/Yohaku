import ExpoModulesCore

struct YohakuListItemSpec: Record {
  @Field var categoryName: String = ""
  @Field var categorySlug: String = ""
  @Field var date: String = ""
  @Field var estimatedHeight: Double = 88
  @Field var hiddenTagCount: Int = 0
  @Field var id: String = ""
  @Field var tags: [String] = []
  @Field var title: String = ""
  @Field var type: String = ""
}
