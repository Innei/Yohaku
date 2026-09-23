import ExpoModulesCore
import MapKit
import UIKit

private final class TrackEndpoint: NSObject, MKAnnotation {
  let coordinate: CLLocationCoordinate2D
  let isStart: Bool

  init(coordinate: CLLocationCoordinate2D, isStart: Bool) {
    self.coordinate = coordinate
    self.isStart = isStart
  }
}

final class YohakuTrackMapView: ExpoView, MKMapViewDelegate {
  let onNativePress = EventDispatcher()

  private static let casingTitle = "casing"
  private static let fitPadding = UIEdgeInsets(top: 28, left: 28, bottom: 28, right: 28)
  private static let minimumSpanMeters = 400.0

  private let mapView = MKMapView()
  private let tapRecognizer = UITapGestureRecognizer()
  private var segments: [[CLLocationCoordinate2D]] = []
  private var accentColor = UIColor(red: 197 / 255, green: 100 / 255, blue: 115 / 255, alpha: 1)
  private var paperColor = UIColor(red: 253 / 255, green: 252 / 255, blue: 249 / 255, alpha: 1)
  private var fittedSize: CGSize = .zero
  private var isInteractive = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true

    let configuration = MKStandardMapConfiguration(emphasisStyle: .muted)
    configuration.pointOfInterestFilter = .excludingAll
    mapView.preferredConfiguration = configuration
    mapView.delegate = self
    mapView.showsScale = false
    addSubview(mapView)

    tapRecognizer.addTarget(self, action: #selector(handleTap))
    addGestureRecognizer(tapRecognizer)
    setInteractive(false)
  }

  func setPolylines(_ value: [[[Double]]]) {
    segments = value
      .map { line in
        line.compactMap { tuple in
          tuple.count >= 2 ? CLLocationCoordinate2D(latitude: tuple[0], longitude: tuple[1]) : nil
        }
      }
      .filter { !$0.isEmpty }
    rebuild()
    fittedSize = .zero
    setNeedsLayout()
  }

  func setAccentColor(_ color: UIColor?) {
    guard let color else { return }
    accentColor = color
    rebuild()
  }

  func setPaperColor(_ color: UIColor?) {
    guard let color else { return }
    paperColor = color
    rebuild()
  }

  func setInteractive(_ interactive: Bool) {
    isInteractive = interactive
    mapView.isUserInteractionEnabled = interactive
    mapView.showsCompass = interactive
    tapRecognizer.isEnabled = !interactive
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    mapView.frame = bounds
    guard bounds.width > 0, bounds.height > 0, bounds.size != fittedSize else { return }
    guard !isInteractive || fittedSize == .zero else { return }
    fittedSize = bounds.size
    fitToTrack()
  }

  @objc private func handleTap() {
    onNativePress([:])
  }

  private func rebuild() {
    mapView.removeOverlays(mapView.overlays)
    mapView.removeAnnotations(mapView.annotations)
    guard let first = segments.first?.first, let last = segments.last?.last else { return }

    let lines = segments.map { MKPolyline(coordinates: $0, count: $0.count) }
    let casings = segments.map { coordinates in
      let casing = MKPolyline(coordinates: coordinates, count: coordinates.count)
      casing.title = Self.casingTitle
      return casing
    }
    mapView.addOverlays(casings, level: .aboveRoads)
    mapView.addOverlays(lines, level: .aboveRoads)
    mapView.addAnnotations([
      TrackEndpoint(coordinate: first, isStart: true),
      TrackEndpoint(coordinate: last, isStart: false),
    ])
  }

  private func fitToTrack() {
    let points = segments.flatMap { $0 }.map(MKMapPoint.init)
    guard let first = points.first else { return }
    var rect = points.dropFirst().reduce(MKMapRect(origin: first, size: MKMapSize(width: 0, height: 0))) {
      $0.union(MKMapRect(origin: $1, size: MKMapSize(width: 0, height: 0)))
    }
    let minimumSide = Self.minimumSpanMeters * MKMapPointsPerMeterAtLatitude(first.coordinate.latitude)
    rect = rect.insetBy(
      dx: -max(0, (minimumSide - rect.width) / 2),
      dy: -max(0, (minimumSide - rect.height) / 2)
    )
    mapView.setVisibleMapRect(rect, edgePadding: Self.fitPadding, animated: false)
  }

  func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
    guard let polyline = overlay as? MKPolyline else { return MKOverlayRenderer(overlay: overlay) }
    let renderer = MKPolylineRenderer(polyline: polyline)
    let isCasing = polyline.title == Self.casingTitle
    renderer.strokeColor = isCasing ? paperColor : accentColor
    renderer.lineWidth = isCasing ? 7 : 3.5
    renderer.lineCap = .round
    renderer.lineJoin = .round
    return renderer
  }

  func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
    guard let endpoint = annotation as? TrackEndpoint else { return nil }
    let view = MKAnnotationView(annotation: endpoint, reuseIdentifier: nil)
    view.image = endpointImage(isStart: endpoint.isStart)
    view.isEnabled = false
    return view
  }

  private func endpointImage(isStart: Bool) -> UIImage {
    let ringWidth: CGFloat = isStart ? 3 : 2.5
    let fill = isStart ? paperColor : accentColor
    let ring = isStart ? accentColor : paperColor
    let side = 12 + ringWidth
    return UIGraphicsImageRenderer(size: CGSize(width: side, height: side)).image { _ in
      let circle = UIBezierPath(ovalIn: CGRect(x: ringWidth / 2, y: ringWidth / 2, width: 12, height: 12))
      circle.lineWidth = ringWidth
      fill.setFill()
      ring.setStroke()
      circle.fill()
      circle.stroke()
    }
  }
}
