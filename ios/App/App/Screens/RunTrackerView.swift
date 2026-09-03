import SwiftUI
import MapKit
import CoreLocation

// MARK: - Run Tracker Location Manager
class RunLocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = RunLocationManager()
    private let manager = CLLocationManager()

    @Published var location: CLLocation?
    @Published var authStatus: CLAuthorizationStatus = .notDetermined
    @Published var route: [CLLocationCoordinate2D] = []

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        manager.distanceFilter = 5
    }

    func requestPermission() { manager.requestWhenInUseAuthorization() }

    func startTracking() {
        route = []
        manager.startUpdatingLocation()
    }

    func stopTracking() { manager.stopUpdatingLocation() }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        DispatchQueue.main.async {
            self.location = loc
            self.route.append(loc.coordinate)
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async { self.authStatus = manager.authorizationStatus }
    }
}

// MARK: - Live Map View (iOS 13+)
struct LiveRunMapView: UIViewRepresentable {
    @Binding var route: [CLLocationCoordinate2D]
    @Binding var userLocation: CLLocation?

    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: LiveRunMapView
        init(_ parent: LiveRunMapView) { self.parent = parent }

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let r = MKPolylineRenderer(polyline: polyline)
                r.strokeColor = UIColor(Color(hex: "00E5C7"))
                r.lineWidth = 5
                r.lineCap = .round
                return r
            }
            return MKOverlayRenderer(overlay: overlay)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate = context.coordinator
        map.showsUserLocation = true
        map.userTrackingMode = .follow
        map.mapType = .standard
        return map
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.removeOverlays(mapView.overlays)
        guard route.count > 1 else { return }
        let polyline = MKPolyline(coordinates: route, count: route.count)
        mapView.addOverlay(polyline)
    }
}

// MARK: - Run Tracker View
struct RunTrackerView: View {
    @EnvironmentObject private var theme: ThemeStore
    @StateObject private var locationManager = RunLocationManager.shared
    @EnvironmentObject private var runStore: RunStore
    @Environment(\.presentationMode) private var presentationMode

    @State private var isRunning = false
    @State private var isPaused = false
    @State private var elapsedSeconds: Int = 0
    @State private var timer: Timer?
    @State private var distance: Double = 0
    @State private var lastLocation: CLLocation?
    @State private var showFinishAlert = false
    @State private var showDiscardAlert = false

    var formattedTime: String {
        let m = elapsedSeconds / 60
        let s = elapsedSeconds % 60
        return String(format: "%02d:%02d", m, s)
    }

    var distanceMiles: Double { distance * 0.000621371 }

    var pace: String {
        guard distanceMiles > 0.05 else { return "--:--" }
        let totalMinutes = Double(elapsedSeconds) / 60.0
        let pacePerMile = totalMinutes / distanceMiles
        let paceMin = Int(pacePerMile)
        let paceSec = Int((pacePerMile - Double(paceMin)) * 60)
        return String(format: "%d:%02d/mi", paceMin, paceSec)
    }

    var calories: Int { Int(distanceMiles * 90) }

    var gpsStatusText: String {
        switch locationManager.authStatus {
        case .notDetermined: return "Tap Start to enable GPS"
        case .denied, .restricted: return "GPS permission needed"
        case .authorizedWhenInUse, .authorizedAlways:
            if locationManager.location == nil { return "Getting GPS fix..." }
            return isRunning ? "GPS locked" : "GPS ready"
        @unknown default: return "GPS unknown"
        }
    }

    var gpsStatusColor: Color {
        locationManager.location != nil ? theme.primary : theme.tertiary
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // MAP
            LiveRunMapView(
                route: Binding(get: { locationManager.route }, set: { _ in }),
                userLocation: Binding(get: { locationManager.location }, set: { _ in })
            )
            .ignoresSafeArea()

            // Top bar
            VStack {
                HStack {
                    Button { handleBack() } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(AppColors.textPrimary)
                            .frame(width: 44, height: 44)
                            .background(AppColors.surface)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(AppColors.border))
                    }

                    Spacer()

                    HStack(spacing: 6) {
                        Circle().fill(gpsStatusColor).frame(width: 8, height: 8)
                        Text(gpsStatusText)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(AppColors.textPrimary)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(AppColors.surface)
                    .cornerRadius(999)
                    .overlay(RoundedRectangle(cornerRadius: 999).stroke(AppColors.border))

                    Spacer()
                    // Spacer button for layout balance
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 18)
                .padding(.top, 60)
                Spacer()
            }

            // Stats + controls panel
            VStack(spacing: 0) {
                LinearGradient(colors: [theme.primary, theme.secondary], startPoint: .leading, endPoint: .trailing)
                    .frame(height: 3)
                    .cornerRadius(999)
                    .padding(.horizontal, 40)
                    .padding(.top, 20)

                Text(formattedTime)
                    .font(.system(size: 64, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                    
                    .padding(.top, 16)

                HStack(spacing: 0) {
                    statBlock(value: String(format: "%.2f", distanceMiles), unit: "mi")
                    Divider().frame(width: 1).background(AppColors.border)
                    statBlock(value: pace, unit: "pace")
                    Divider().frame(width: 1).background(AppColors.border)
                    statBlock(value: "\(calories)", unit: "kcal")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)

                HStack(spacing: 14) {
                    if !isRunning && !isPaused {
                        Button { startRun() } label: {
                            Text("START RUN")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(AppColors.background)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(theme.primary)
                                .cornerRadius(999)
                        }
                    } else if isRunning {
                        Button { pauseRun() } label: {
                            Label("Pause", systemImage: "pause.fill")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(AppColors.surfaceLight)
                                .cornerRadius(999)
                        }
                        Button { showFinishAlert = true } label: {
                            Label("Finish", systemImage: "flag.checkered")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppColors.background)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(theme.primary)
                                .cornerRadius(999)
                        }
                    } else if isPaused {
                        Button { resumeRun() } label: {
                            Label("Resume", systemImage: "play.fill")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppColors.background)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(theme.primary)
                                .cornerRadius(999)
                        }
                        Button { showFinishAlert = true } label: {
                            Label("Finish", systemImage: "flag.checkered")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(AppColors.surfaceLight)
                                .cornerRadius(999)
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 44)
            }
            .background(AppColors.surface.cornerRadius(32))
        }
        .background(AppColors.background.ignoresSafeArea())
        .navigationBarHidden(true)
        .alert(isPresented: $showFinishAlert) {
            Alert(
                title: Text("Save Run?"),
                message: Text("\(String(format: "%.2f", distanceMiles)) mi · \(formattedTime)"),
                primaryButton: .default(Text("Save")) { finishRun() },
                secondaryButton: .destructive(Text("Discard")) { discardRun() }
            )
        }
    }

    @ViewBuilder
    func statBlock(value: String, unit: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 26, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
                
            Text(unit)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    func startRun() {
        locationManager.requestPermission()
        locationManager.startTracking()
        isRunning = true
        isPaused = false
        elapsedSeconds = 0
        distance = 0
        lastLocation = nil
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            guard self.isRunning else { return }
            self.elapsedSeconds += 1
            if let prev = self.lastLocation, let curr = self.locationManager.location {
                self.distance += curr.distance(from: prev)
            }
            self.lastLocation = self.locationManager.location
        }
    }

    func pauseRun() {
        isRunning = false
        isPaused = true
        timer?.invalidate()
        locationManager.stopTracking()
    }

    func resumeRun() {
        isRunning = true
        isPaused = false
        locationManager.startTracking()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            guard self.isRunning else { return }
            self.elapsedSeconds += 1
            if let prev = self.lastLocation, let curr = self.locationManager.location {
                self.distance += curr.distance(from: prev)
            }
            self.lastLocation = self.locationManager.location
        }
    }

    func finishRun() {
        timer?.invalidate()
        locationManager.stopTracking()
        guard distanceMiles > 0.05 else { presentationMode.wrappedValue.dismiss(); return }
        
        // Save to HealthKit
        HealthStore.shared.saveWorkout(duration: Double(elapsedSeconds), distance: distance, calories: Double(calories))
        
        let newRun = SavedRun(
            id: UUID().uuidString,
            name: "My Run",
            date: Date(),
            distanceMiles: distanceMiles,
            durationMinutes: elapsedSeconds / 60,
            avgPacePerMile: pace,
            calories: calories,
            city: "Current Location",
            route: locationManager.route.map { Coordinate(lat: $0.latitude, lng: $0.longitude) }
        )
        runStore.runs.insert(newRun, at: 0)
        runStore.save()
        presentationMode.wrappedValue.dismiss()
    }

    func discardRun() {
        timer?.invalidate()
        locationManager.stopTracking()
        presentationMode.wrappedValue.dismiss()
    }

    func handleBack() {
        if isRunning || isPaused {
            showDiscardAlert = true
        } else {
            presentationMode.wrappedValue.dismiss()
        }
    }
}
