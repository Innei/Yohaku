import Charts
import ExpoModulesCore
import SwiftUI
import UIKit

struct KlineBar: Record {
  @Field var t: Double = 0
  @Field var o: Double = 0
  @Field var h: Double = 0
  @Field var l: Double = 0
  @Field var c: Double = 0
  @Field var v: Double = 0
}

struct KlineEma: Record {
  @Field var period: Int = 0
  @Field var values: [Double] = []
  @Field var color: UIColor?
}

final class KlineModel: ObservableObject {
  @Published var bars: [KlineBar] = []
  @Published var emas: [KlineEma] = []
  @Published var upColor = Color.clear
  @Published var downColor = Color.clear
  @Published var gridColor = Color.clear
  @Published var labelColor = Color.clear
  @Published var volumeColor = Color.clear
}

struct KlineChart: View {
  @ObservedObject var model: KlineModel

  private static let axisWidth: CGFloat = 40
  private static let bodyHalfWidth = 0.32
  private static let labelFont = Font.system(size: 9.5, design: .monospaced)
  private static let dateTime: DateFormatter = {
    let formatter = DateFormatter()
    formatter.setLocalizedDateFormatFromTemplate("MdHHmm")
    return formatter
  }()
  private static let dateOnly: DateFormatter = {
    let formatter = DateFormatter()
    formatter.setLocalizedDateFormatFromTemplate("Md")
    return formatter
  }()

  private var xDomain: ClosedRange<Double> {
    -0.5...(Double(max(model.bars.count, 1)) - 0.5)
  }

  private var priceDomain: ClosedRange<Double> {
    let lows = model.bars.map(\.l) + model.emas.flatMap(\.values)
    let highs = model.bars.map(\.h) + model.emas.flatMap(\.values)
    guard let low = lows.min(), let high = highs.max() else { return 0...1 }
    let pad = max((high - low) * 0.06, abs(high) * 0.001, 0.01)
    return (low - pad)...(high + pad)
  }

  private var labelIndices: [Int] {
    let count = model.bars.count
    guard count > 2 else { return Array(0..<count) }
    return [0, (count - 1) / 2, count - 1]
  }

  var body: some View {
    VStack(spacing: 4) {
      priceChart
      volumeChart.frame(height: 36 + 16)
    }
  }

  private var priceChart: some View {
    let bodyMin = (priceDomain.upperBound - priceDomain.lowerBound) * 0.004
    return Chart {
      ForEach(Array(model.bars.enumerated()), id: \.offset) { index, bar in
        let color = bar.c >= bar.o ? model.upColor : model.downColor
        let x = Double(index)
        RuleMark(x: .value("i", x), yStart: .value("l", bar.l), yEnd: .value("h", bar.h))
          .lineStyle(StrokeStyle(lineWidth: 1))
          .foregroundStyle(color)
        RectangleMark(
          xStart: .value("s", x - Self.bodyHalfWidth),
          xEnd: .value("e", x + Self.bodyHalfWidth),
          yStart: .value("o", min(bar.o, bar.c)),
          yEnd: .value("c", max(max(bar.o, bar.c), min(bar.o, bar.c) + bodyMin))
        )
        .cornerRadius(1)
        .foregroundStyle(color)
      }
      ForEach(Array(model.emas.enumerated()), id: \.offset) { _, ema in
        ForEach(Array(ema.values.enumerated()), id: \.offset) { index, value in
          LineMark(
            x: .value("i", Double(index)),
            y: .value("ema", value),
            series: .value("period", ema.period)
          )
          .lineStyle(StrokeStyle(lineWidth: 1.4, lineJoin: .round))
          .foregroundStyle(Color(ema.color ?? .clear))
        }
      }
    }
    .chartXScale(domain: xDomain)
    .chartYScale(domain: priceDomain)
    .chartXAxis(.hidden)
    .chartYAxis {
      AxisMarks(position: .trailing, values: .automatic(desiredCount: 4)) { value in
        AxisGridLine(stroke: StrokeStyle(lineWidth: 1, dash: [2, 3]))
          .foregroundStyle(model.gridColor)
        AxisValueLabel {
          if let price = value.as(Double.self) {
            Text(price, format: .number.precision(.fractionLength(0...2)).grouping(.never))
              .font(Self.labelFont)
              .foregroundStyle(model.labelColor)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
              .frame(width: Self.axisWidth, alignment: .leading)
          }
        }
      }
    }
  }

  private var volumeChart: some View {
    Chart {
      ForEach(Array(model.bars.enumerated()), id: \.offset) { index, bar in
        RectangleMark(
          xStart: .value("s", Double(index) - Self.bodyHalfWidth),
          xEnd: .value("e", Double(index) + Self.bodyHalfWidth),
          yStart: .value("v0", 0.0),
          yEnd: .value("v", bar.v)
        )
        .cornerRadius(1)
        .foregroundStyle(model.volumeColor)
      }
    }
    .chartXScale(domain: xDomain)
    .chartXAxis {
      AxisMarks(values: labelIndices.map(Double.init)) { value in
        AxisValueLabel(anchor: anchor(value.index, of: value.count)) {
          if let index = value.as(Double.self) {
            Text(timeLabel(Int(index)))
              .font(Self.labelFont)
              .foregroundStyle(model.labelColor)
          }
        }
      }
    }
    .chartYAxis {
      AxisMarks(position: .trailing, values: [0.0]) { _ in
        AxisValueLabel {
          Color.clear.frame(width: Self.axisWidth, height: 1)
        }
      }
    }
  }

  private func anchor(_ position: Int, of count: Int) -> UnitPoint {
    if position == 0 { return .topLeading }
    return position == count - 1 ? .topTrailing : .top
  }

  private func timeLabel(_ index: Int) -> String {
    let bars = model.bars
    let date = Date(timeIntervalSince1970: bars[index].t / 1000)
    let daily = bars.count > 1 && bars[1].t - bars[0].t >= 86_400_000
    return (daily ? Self.dateOnly : Self.dateTime).string(from: date)
  }
}

final class YohakuKlineView: ExpoView {
  private let model = KlineModel()
  private lazy var hosting: UIHostingController<KlineChart> = {
    let controller = UIHostingController(rootView: KlineChart(model: model))
    controller.view.backgroundColor = .clear
    controller.safeAreaRegions = []
    return controller
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    addSubview(hosting.view)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hosting.view.frame = bounds
  }

  func setBars(_ value: [KlineBar]) {
    model.bars = value
  }

  func setEma(_ value: [KlineEma]) {
    model.emas = value
  }

  func setUpColor(_ color: UIColor?) {
    model.upColor = Color(color ?? .clear)
  }

  func setDownColor(_ color: UIColor?) {
    model.downColor = Color(color ?? .clear)
  }

  func setGridColor(_ color: UIColor?) {
    model.gridColor = Color(color ?? .clear)
  }

  func setLabelColor(_ color: UIColor?) {
    model.labelColor = Color(color ?? .clear)
  }

  func setVolumeColor(_ color: UIColor?) {
    model.volumeColor = Color(color ?? .clear)
  }
}
