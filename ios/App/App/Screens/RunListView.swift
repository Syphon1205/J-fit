import SwiftUI
import MapKit

// MARK: - Run List View
struct RunListView: View {
    @EnvironmentObject private var runs: RunStore
    @EnvironmentObject private var theme: ThemeStore
    @State private var selectedRun: SavedRun?
    @State private var showDetail = false
    @State private var showTracker = false

    var body: some View {
        NavigationView {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Runs")
                                .font(.system(size: 28, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                            Text("\(runs.runs.count) saved runs")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(AppColors.textSecondary)
                        }
                        Spacer()
                        Button { showTracker = true } label: {
                            Image(systemName: "play.fill")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(AppColors.background)
                                .frame(width: 52, height: 52)
                                .background(theme.primary)
                                .clipShape(Circle())
                        }
                    }

                    ForEach(runs.runs) { run in
                        RunRowCard(run: run) {
                            selectedRun = run
                            showDetail = true
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 60)
                .padding(.bottom, 150)
            }
            .background(AppColors.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .sheet(isPresented: $showDetail) {
                if let run = selectedRun {
                    RunDetailView(run: run)
                        .environmentObject(theme)
                }
            }
            .fullScreenCover(isPresented: $showTracker) {
                RunTrackerView()
                    .environmentObject(runs)
                    .environmentObject(theme)
            }
        }
    }
}

// MARK: - Run Row Card
struct RunRowCard: View {
    let run: SavedRun
    let onTap: () -> Void
    @EnvironmentObject private var theme: ThemeStore

    var formattedDate: String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: run.date)
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Mini map snapshot
                MiniMapView(route: run.route)
                    .frame(width: 90, height: 90)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(AppColors.border))

                VStack(alignment: .leading, spacing: 6) {
                    Text(run.name)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                        .lineLimit(1)
                    Text(run.city)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                    Text(formattedDate)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(AppColors.textTertiary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 6) {
                    Text(String(format: "%.1f mi", run.distanceMiles))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(theme.primary)
                    Text(run.avgPacePerMile)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)
                    Text("\(run.calories) kcal")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(AppColors.textTertiary)
                }
            }
            .padding(14)
            .background(AppColors.surface)
            .cornerRadius(AppRadius.card)
            .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
        }
    }
}

// MARK: - Mini Map (iOS 13+)
struct MiniMapView: UIViewRepresentable {
    let route: [Coordinate]

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.isUserInteractionEnabled = false
        map.mapType = .standard
        map.layer.cornerRadius = 16
        map.clipsToBounds = true
        return map
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.removeOverlays(mapView.overlays)
        guard !route.isEmpty else { return }
        let coords = route.map { CLLocationCoordinate2D(latitude: $0.lat, longitude: $0.lng) }
        let polyline = MKPolyline(coordinates: coords, count: coords.count)
        mapView.addOverlay(polyline)
        var region = MKCoordinateRegion(polyline.boundingMapRect)
        region.span.latitudeDelta *= 1.4
        region.span.longitudeDelta *= 1.4
        mapView.setRegion(region, animated: false)
    }
}

extension MiniMapView {
    class Coordinator: NSObject, MKMapViewDelegate {
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            guard let polyline = overlay as? MKPolyline else { return MKOverlayRenderer(overlay: overlay) }
            let r = MKPolylineRenderer(polyline: polyline)
            r.strokeColor = UIColor(Color(hex: "00E5C7"))
            r.lineWidth = 3
            return r
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }
}

// MARK: - Run Detail View
struct RunDetailView: View {
    let run: SavedRun
    @EnvironmentObject private var theme: ThemeStore
    @Environment(\.presentationMode) private var presentationMode

    var body: some View {
        VStack(spacing: 0) {
            // Map
            RunMapView(route: run.route)
                .frame(maxWidth: .infinity)
                .frame(height: UIScreen.main.bounds.height * 0.5)
                .ignoresSafeArea(edges: .top)

            // Stats sheet
            VStack(alignment: .leading, spacing: 0) {
                // Teal accent line at top
                LinearGradient(colors: [theme.primary, theme.secondary], startPoint: .leading, endPoint: .trailing)
                    .frame(height: 3)
                    .padding(.horizontal, 40)
                    .padding(.top, 18)

                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(run.name)
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                            Text(run.city)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(AppColors.textSecondary)
                        }
                        Spacer()
                        Button { presentationMode.wrappedValue.dismiss() } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(AppColors.textSecondary)
                                .frame(width: 36, height: 36)
                                .background(AppColors.surfaceLight)
                                .clipShape(Circle())
                        }
                    }

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                        runStat(label: "Distance", value: String(format: "%.2f mi", run.distanceMiles))
                        runStat(label: "Duration", value: "\(run.durationMinutes) min")
                        runStat(label: "Avg Pace", value: run.avgPacePerMile)
                        runStat(label: "Calories", value: "\(run.calories) kcal")
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 40)
            }
            .background(AppColors.surface)
            .cornerRadius(32, corners: [.topLeft, .topRight])
            .frame(maxWidth: .infinity)
        }
        .background(AppColors.background.ignoresSafeArea())
    }

    @ViewBuilder
    func runStat(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 26, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(AppColors.surfaceLight)
        .cornerRadius(AppRadius.input)
    }
}

// MARK: - Full Run Map (iOS 13+)
struct RunMapView: UIViewRepresentable {
    let route: [Coordinate]

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate = context.coordinator
        map.mapType = .standard
        map.showsUserLocation = false
        return map
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.removeOverlays(mapView.overlays)
        mapView.removeAnnotations(mapView.annotations)
        guard !route.isEmpty else { return }
        let coords = route.map { CLLocationCoordinate2D(latitude: $0.lat, longitude: $0.lng) }
        let polyline = MKPolyline(coordinates: coords, count: coords.count)
        mapView.addOverlay(polyline)
        // Start / end pins
        let startPin = MKPointAnnotation()
        startPin.coordinate = coords.first!
        startPin.title = "Start"
        let endPin = MKPointAnnotation()
        endPin.coordinate = coords.last!
        endPin.title = "Finish"
        mapView.addAnnotations([startPin, endPin])
        var region = MKCoordinateRegion(polyline.boundingMapRect)
        region.span.latitudeDelta *= 1.3
        region.span.longitudeDelta *= 1.3
        mapView.setRegion(region, animated: false)
    }

    class Coordinator: NSObject, MKMapViewDelegate {
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            guard let polyline = overlay as? MKPolyline else { return MKOverlayRenderer(overlay: overlay) }
            let r = MKPolylineRenderer(polyline: polyline)
            r.strokeColor = UIColor(Color(hex: "00E5C7"))
            r.lineWidth = 5
            r.lineCap = .round
            return r
        }
    }
}

// MARK: - Corner Radius helper
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

private struct RoundedCorner: Shape {
    var radius: CGFloat
    var corners: UIRectCorner

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
