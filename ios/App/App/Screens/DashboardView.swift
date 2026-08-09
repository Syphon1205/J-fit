import SwiftUI
import CoreLocation
#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - Daily context

private struct DailySignal {
    let score: Int
    let label: String
    let summary: String
    let recommendation: String
    let tint: Color
}

private struct WeatherSignal {
    var temperature = 0
    var condition = "Weather unavailable"
    var trainingWindow = "Location is requested when you start an outdoor run"
    var symbol = "cloud.sun.fill"
}

private struct CoachContext {
    let hasVerifiedHealthData: Bool
    let readiness: Int
    let steps: Int
    let activeCalories: Int
    let sleepHours: Double
    let heartRate: Int
    let workoutsThisWeek: Int
    let nextWorkout: String

    var promptContext: String {
        """
        Data source: Apple Health, authorized and read by the app
        Readiness: \(readiness)/100
        Steps today: \(steps > 0 ? "\(steps)" : "unavailable")
        Active calories today: \(activeCalories > 0 ? "\(activeCalories)" : "unavailable")
        Sleep last night: \(sleepHours > 0 ? "\(String(format: "%.1f", sleepHours)) hours" : "unavailable")
        Latest heart rate: \(heartRate > 0 ? "\(heartRate) bpm" : "unavailable")
        Workouts this week: \(workoutsThisWeek)
        Next workout: \(nextWorkout)
        """
    }
}

// MARK: - Apple Intelligence coach

@MainActor
private final class OnDeviceCoach: ObservableObject {
    @Published var answer = ""
    @Published var isThinking = false
    @Published var modelAvailable = false
    @Published var sourceLabel = "Checking Apple Intelligence"

    init() {
        refreshAvailability()
    }

    func refreshAvailability() {
#if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                modelAvailable = true
                sourceLabel = "Apple Intelligence · On device"
                return
            }
        }
#endif
        modelAvailable = false
        sourceLabel = "Apple Intelligence unavailable"
    }

    func ask(_ question: String, context: CoachContext) {
        guard !question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        guard context.hasVerifiedHealthData else {
            answer = "Connect Apple Health before requesting personalized guidance. No response was generated."
            return
        }
        guard modelAvailable else {
            answer = "Apple Intelligence isn’t available on this device. No substitute or simulated response was generated."
            return
        }
        isThinking = true
        answer = ""

        Task {
            answer = await generate(question: question, context: context)
            isThinking = false
        }
    }

    private func generate(question: String, context: CoachContext) async -> String {
#if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            if case .available = model.availability {
                do {
                    let session = LanguageModelSession(
                        model: model,
                        instructions: """
                        You are Pulse, a concise fitness planning assistant. Use only the health
                        summary supplied by the app. Give practical, conservative suggestions,
                        never diagnose a condition, and never invent measurements. If a request
                        implies pain, injury, illness, or danger, recommend stopping and seeking
                        qualified medical help. Respond in at most three short sentences.
                        """
                    )
                    let response = try await session.respond(
                        to: "Health summary:\n\(context.promptContext)\n\nQuestion: \(question)"
                    )
                    return response.content
                } catch {
                    return "Apple Intelligence couldn’t complete that request. No substitute response was generated."
                }
            }
        }
#endif
        return "Apple Intelligence isn’t available on this device. No substitute response was generated."
    }
}

// MARK: - Location

private final class DashboardLocation: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    @Published var coordinate: CLLocationCoordinate2D?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func refreshIfAuthorized() {
        // Home should never interrupt the first-run experience just to decorate
        // a card with weather. The run flow owns the location permission prompt.
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        coordinate = locations.last?.coordinate
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }
}

// MARK: - Dashboard

struct DashboardView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var workouts: WorkoutStore
    @EnvironmentObject private var nutrition: NutritionStore
    @EnvironmentObject private var health: HealthStore

    @Binding var rootTab: Tab
    @Binding var coachRequested: Bool
    @StateObject private var coach = OnDeviceCoach()
    @StateObject private var location = DashboardLocation()
    @State private var weather = WeatherSignal()
    @State private var showCoach = false
    @State private var selectedPrompt = ""

    private var firstName: String {
        auth.user?.name.components(separatedBy: " ").first ?? "Athlete"
    }

    private var nextWorkout: WorkoutTemplate? { workouts.templates.first }

    private var hasVerifiedHealthData: Bool {
        health.authorized && (
            health.stepsToday > 0 ||
            health.activeCaloriesToday > 0 ||
            health.heartRate > 0 ||
            health.sleepHoursLastNight > 0
        )
    }

    private var liveSteps: Int {
        health.stepsToday
    }

    private var signal: DailySignal {
        guard hasVerifiedHealthData else {
            return DailySignal(
                score: 0,
                label: "Not connected",
                summary: "Your daily signal is off",
                recommendation: "Connect Apple Health to calculate it from real data.",
                tint: theme.primary
            )
        }
        let movement = min(Double(liveSteps) / 10_000, 1)
        let training = min(Double(health.workoutsCountThisWeek) / 4.0, 1)
        let sleep = min(health.sleepHoursLastNight / 8, 1)
        var weightedScore = 0.0
        var availableWeight = 0.0
        if liveSteps > 0 {
            weightedScore += movement * 0.25
            availableWeight += 0.25
        }
        if health.workoutsCountThisWeek > 0 {
            weightedScore += training * 0.35
            availableWeight += 0.35
        }
        if health.sleepHoursLastNight > 0 {
            weightedScore += sleep * 0.40
            availableWeight += 0.40
        }
        let score = availableWeight > 0
            ? Int((weightedScore / availableWeight * 100).rounded())
            : 0

        if score >= 78 {
            return DailySignal(
                score: score,
                label: "PRIMED",
                summary: "Your recovery and workload are aligned.",
                recommendation: "A strong day for quality work.",
                tint: theme.primary
            )
        } else if score >= 58 {
            return DailySignal(
                score: score,
                label: "BALANCED",
                summary: "You’re ready, with some fatigue in the mix.",
                recommendation: "Train as planned, keep a little in reserve.",
                tint: theme.secondary
            )
        }
        return DailySignal(
            score: score,
            label: "RESTORE",
            summary: "Your recent signals favor a lighter day.",
            recommendation: "Choose easy movement and extra recovery.",
            tint: AppColors.tertiary
        )
    }

    private var coachContext: CoachContext {
        CoachContext(
            hasVerifiedHealthData: hasVerifiedHealthData,
            readiness: signal.score,
            steps: liveSteps,
            activeCalories: health.activeCaloriesToday,
            sleepHours: health.sleepHoursLastNight,
            heartRate: health.heartRate,
            workoutsThisWeek: health.workoutsCountThisWeek,
            nextWorkout: nextWorkout?.name ?? "Choose a workout"
        )
    }

    private var coachCardSubtitle: String {
        if !coach.modelAvailable {
            return "Apple Intelligence unavailable on this device"
        }
        if !hasVerifiedHealthData {
            return "Connect Apple Health for personalized guidance"
        }
        return "Private, on-device guidance"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 10) {
                header
                readinessHero
                metricStrip
                if !health.authorized {
                    connectHealthCard
                }
                coachCard
                nextWorkoutCard
            }
            .padding(.horizontal, 16)
            .padding(.top, 6)
            .padding(.bottom, 150)
        }
        .background(background)
        .onAppear {
            coach.refreshAvailability()
            health.sync()
            location.refreshIfAuthorized()
        }
        .onChange(of: location.coordinate?.latitude) { _ in
            guard let coordinate = location.coordinate else { return }
            fetchWeather(latitude: coordinate.latitude, longitude: coordinate.longitude)
        }
        .onChange(of: coachRequested) { _ in
            selectedPrompt = ""
            showCoach = true
        }
        .sheet(isPresented: $showCoach) {
            CoachSheet(
                coach: coach,
                context: coachContext,
                initialPrompt: selectedPrompt
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private var background: some View {
        AppColors.background.ignoresSafeArea()
    }

    private var header: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(Date.now.formatted(.dateTime.weekday(.wide).month(.wide).day()))
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppColors.textTertiary)
                Text("Move well, \(firstName)")
                    .font(.system(size: 24, weight: .semibold))
                    .tracking(-0.2)
                    .foregroundColor(AppColors.textPrimary)
            }
            Spacer()
            Button { rootTab = .profile } label: {
                ZStack {
                    Circle().fill(AppColors.elevated)
                    Circle().stroke(AppColors.border, lineWidth: 1)
                    Text(auth.user?.avatarLetter ?? "A")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                }
                .frame(width: 40, height: 40)
            }
            .accessibilityLabel("Open profile")
        }
    }

    private var readinessHero: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Label("Readiness", systemImage: "waveform.path.ecg")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(signal.tint)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(hasVerifiedHealthData ? "\(signal.score)" : "—")
                            .font(.system(size: 44, weight: .regular))
                            .tracking(-1.2)
                        if hasVerifiedHealthData {
                            Text("/100")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(AppColors.textSecondary)
                        }
                    }
                    .foregroundColor(AppColors.textPrimary)
                }
                Spacer()
                Label(
                    signal.label.capitalized,
                    systemImage: hasVerifiedHealthData ? "checkmark.circle.fill" : "link.badge.plus"
                )
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(signal.tint)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(signal.summary)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                Text(signal.recommendation)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(AppColors.textSecondary)
            }

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(AppColors.surfaceLight)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [signal.tint.opacity(0.55), signal.tint],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: proxy.size.width * CGFloat(signal.score) / 100)
                }
            }
            .frame(height: 5)
        }
        .padding(14)
        .elevatedSurface()
    }

    private var metricStrip: some View {
        HStack(spacing: 0) {
            SignalMetric(
                icon: "moon.stars.fill",
                value: health.sleepHoursLastNight > 0 ? String(format: "%.1f", health.sleepHoursLastNight) : "—",
                unit: "hr",
                label: "Sleep",
                tint: theme.secondary
            )
            SignalMetric(
                icon: "heart.fill",
                value: health.heartRate > 0 ? "\(health.heartRate)" : "—",
                unit: "bpm",
                label: "Heart",
                tint: AppColors.tertiary
            )
            SignalMetric(
                icon: "figure.walk",
                value: liveSteps > 0 ? compact(liveSteps) : "—",
                unit: "",
                label: "Steps",
                tint: theme.primary
            )
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 0)
        .elevatedSurface()
    }

    private var coachCard: some View {
        Button {
            selectedPrompt = "What should I focus on today?"
            showCoach = true
        } label: {
            HStack(alignment: .center, spacing: 12) {
                DepthIcon(symbol: "sparkles", tint: theme.primary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Coach")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text(coachCardSubtitle)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(AppColors.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppColors.textTertiary)
                    .frame(width: 20, height: 20)
            }
            .padding(.horizontal, 14)
            .frame(minHeight: 56)
            .elevatedSurface()
        }
        .buttonStyle(.plain)
    }

    private var connectHealthCard: some View {
        Button {
            health.requestAuthorization()
        } label: {
            HStack(alignment: .center, spacing: 12) {
                DepthIcon(symbol: "heart.text.square.fill", tint: AppColors.tertiary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Connect Apple Health")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text("Use sleep, heart, and activity signals")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(AppColors.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppColors.textTertiary)
                    .frame(width: 20, height: 20)
            }
            .padding(.horizontal, 14)
            .frame(minHeight: 56)
            .elevatedSurface()
        }
        .buttonStyle(.plain)
    }

    private var nextWorkoutCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Up Next")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppColors.textSecondary)
                Spacer()
                HStack(alignment: .center, spacing: 6) {
                    Text(weather.temperature == 0 ? "—" : "\(weather.temperature)°")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                    Image(systemName: weather.symbol)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(theme.secondary)
                }
            }

            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(nextWorkout?.name ?? "Choose your session")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text(nextWorkout.map { "\($0.durationMinutes) min · \($0.exercises.count) moves · \($0.difficulty)" } ?? weather.trainingWindow)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(AppColors.textSecondary)
                }
                Spacer()
                Button {
                    rootTab = .workouts
                } label: {
                    Image(systemName: "play.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(theme.primary)
                        .frame(width: 40, height: 40)
                        .background(AppColors.surfaceLight)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(AppColors.border, lineWidth: 0.75))
                        .shadow(color: Color.black.opacity(0.10), radius: 6, y: 3)
                }
                .accessibilityLabel("Open workouts")
            }
        }
        .padding(14)
        .elevatedSurface()
    }

    private func compact(_ value: Int) -> String {
        value >= 1_000 ? String(format: "%.1fk", Double(value) / 1_000) : "\(value)"
    }

    private func fetchWeather(latitude: Double, longitude: Double) {
        let urlString = "https://api.open-meteo.com/v1/forecast?latitude=\(latitude)&longitude=\(longitude)&current=temperature_2m,weather_code&temperature_unit=fahrenheit"
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard
                let data,
                let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let current = root["current"] as? [String: Any],
                let temp = current["temperature_2m"] as? Double
            else { return }

            let code = current["weather_code"] as? Int ?? 0
            let (condition, symbol) = weatherDescription(code)
            DispatchQueue.main.async {
                weather.temperature = Int(temp.rounded())
                weather.condition = condition
                weather.symbol = symbol
                weather.trainingWindow = condition.contains("Rain")
                    ? "Indoor training is the smoother option"
                    : "Outdoor conditions support an easy session"
            }
        }.resume()
    }

    private func weatherDescription(_ code: Int) -> (String, String) {
        switch code {
        case 0: return ("Clear", "sun.max.fill")
        case 1...3: return ("Cloud cover", "cloud.sun.fill")
        case 51...82: return ("Rain nearby", "cloud.rain.fill")
        case 95...99: return ("Storm risk", "cloud.bolt.rain.fill")
        default: return ("Good conditions", "cloud.sun.fill")
        }
    }
}

// MARK: - Supporting views

private struct SignalMetric: View {
    let icon: String
    let value: String
    let unit: String
    let label: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(tint)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 19, weight: .semibold))
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(AppColors.textTertiary)
                }
            }
            .foregroundColor(AppColors.textPrimary)
            Text(label)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 14)
    }
}

private struct DepthIcon: View {
    let symbol: String
    let tint: Color

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 17, weight: .semibold))
            .foregroundColor(tint)
            .frame(width: 38, height: 38)
            .background(
                LinearGradient(
                    colors: [AppColors.elevated, AppColors.surfaceLight],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(AppColors.border))
            .shadow(color: Color.black.opacity(0.10), radius: 7, y: 3)
    }
}

private extension View {
    func elevatedSurface(cornerRadius: CGFloat = AppRadius.card) -> some View {
        self
            .background(AppColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(AppColors.border, lineWidth: 0.75)
            )
            .shadow(color: Color.black.opacity(0.07), radius: 12, y: 5)
    }
}

private struct CoachSheet: View {
    @ObservedObject var coach: OnDeviceCoach
    let context: CoachContext
    let initialPrompt: String
    @Environment(\.dismiss) private var dismiss
    @State private var question = ""
    @FocusState private var isFocused: Bool

    private let prompts = [
        "What should I train?",
        "Should I take it easy?",
        "Help me recover tonight"
    ]

    private var canAsk: Bool {
        coach.modelAvailable && context.hasVerifiedHealthData
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    DepthIcon(symbol: "sparkles", tint: AppColors.primary)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Coach")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                        Text(coach.sourceLabel)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(AppColors.textSecondary)
                    }
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(AppColors.textSecondary)
                            .frame(width: 32, height: 32)
                            .background(AppColors.surfaceLight)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }

                if !coach.modelAvailable {
                    coachStatus(
                        symbol: "apple.intelligence",
                        title: "Apple Intelligence unavailable",
                        detail: "This simulator can’t run Apple’s on-device model. The app won’t display a substitute response."
                    )
                } else if !context.hasVerifiedHealthData {
                    coachStatus(
                        symbol: "heart.text.square",
                        title: "Health data needed",
                        detail: "Connect Apple Health to ground personalized guidance in measurements from your device."
                    )
                } else if coach.isThinking {
                    HStack(spacing: 10) {
                        ProgressView().tint(AppColors.primary)
                        Text("Generating on device…")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppColors.textSecondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 88)
                } else if !coach.answer.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Apple Intelligence")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(AppColors.textTertiary)
                        Text(coach.answer)
                            .font(.system(size: 15, weight: .regular))
                            .foregroundColor(AppColors.textPrimary)
                            .lineSpacing(3)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .elevatedSurface(cornerRadius: 16)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Suggestions")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppColors.textTertiary)
                        ForEach(prompts, id: \.self) { prompt in
                            Button {
                                question = prompt
                                coach.ask(prompt, context: context)
                            } label: {
                                HStack {
                                    Text(prompt)
                                        .font(.system(size: 14, weight: .regular))
                                        .foregroundColor(AppColors.textPrimary)
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(AppColors.textTertiary)
                                }
                                .padding(.horizontal, 14)
                                .frame(height: 44)
                                .elevatedSurface(cornerRadius: 14)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Spacer()

                if canAsk {
                    HStack(spacing: 8) {
                        TextField("Ask about today", text: $question)
                            .focused($isFocused)
                            .font(.system(size: 14, weight: .regular))
                            .padding(.horizontal, 14)
                            .frame(height: 44)
                            .background(AppColors.surfaceLight)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .submitLabel(.send)
                            .onSubmit { send() }
                        Button(action: send) {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(AppColors.background)
                                .frame(width: 40, height: 40)
                                .background(AppColors.primary)
                                .clipShape(Circle())
                                .shadow(color: Color.black.opacity(0.12), radius: 7, y: 3)
                        }
                        .disabled(question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || coach.isThinking)
                    }
                }

                Text("Generated guidance is not medical advice.")
                    .font(.system(size: 10, weight: .regular))
                    .foregroundColor(AppColors.textTertiary)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(16)
            .background(AppColors.background.ignoresSafeArea())
            .onAppear {
                coach.refreshAvailability()
                guard canAsk, !initialPrompt.isEmpty, coach.answer.isEmpty else { return }
                question = initialPrompt
                coach.ask(initialPrompt, context: context)
            }
        }
    }

    private func send() {
        coach.ask(question, context: context)
        isFocused = false
    }

    private func coachStatus(symbol: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(AppColors.textSecondary)
                .frame(width: 32, height: 32)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                Text(detail)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(AppColors.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedSurface(cornerRadius: 16)
    }
}
