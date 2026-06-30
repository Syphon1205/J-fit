import SwiftUI
import Network
import Charts

@main
struct CunninghamTrainerApp: App {
    @AppStorage("themeAccentColor") private var themeAccentColor = "Teal"
    
    var body: some Scene {
        WindowGroup {
            MainView()
                .frame(minWidth: 800, minHeight: 600)
                .tint(colorForString(themeAccentColor))
        }
        
        Settings {
            SettingsView()
        }
    }
    
    private func colorForString(_ colorString: String) -> Color {
        switch colorString {
        case "Teal": return .teal
        case "Orange": return .orange
        case "Purple": return .purple
        case "Red": return .red
        default: return .teal
        }
    }
}

struct SettingsView: View {
    @AppStorage("themeAccentColor") private var themeAccentColor = "Teal"
    let colors = ["Teal", "Orange", "Purple", "Red"]
    
    var body: some View {
        TabView {
            Form {
                Picker("Accent Color", selection: $themeAccentColor) {
                    ForEach(colors, id: \.self) { color in
                        Text(color).tag(color)
                    }
                }
                .pickerStyle(.radioGroup)
            }
            .padding()
            .tabItem {
                Label("Appearance", systemImage: "paintpalette")
            }
        }
        .frame(width: 300, height: 150)
    }
}

enum SidebarItem: Hashable {
    case liveClient
}

struct MainView: View {
    @StateObject private var proximity = ProximitySession()
    @State private var selectedItem: SidebarItem? = .liveClient
    @State private var isScanning = false
    @State private var sessionNote = ""
    @State private var isDemoMode = false

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedItem) {
                Section("Live Sync") {
                    NavigationLink(value: SidebarItem.liveClient) {
                        HStack {
                            Label((proximity.activePayload.id == TrainerMetricPayload.preview.id && !isDemoMode) ? "No Client Connected" : proximity.activePayload.athlete.name, systemImage: "person.crop.circle.fill")
                            Spacer()
                            if isDemoMode {
                                Text("DEMO")
                                    .font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
                
                Section("Trainer Devices") {
                    if isScanning {
                        HStack {
                            ProgressView().controlSize(.small)
                            Text("Searching...")
                                .foregroundColor(.secondary)
                        }
                    }
                    ForEach(proximity.discoveredPeers, id: \.self) { peer in
                        HStack {
                            if case let .service(name, _, _, _) = peer.endpoint {
                                Label(name, systemImage: "iphone")
                            } else {
                                Label("Unknown Device", systemImage: "iphone")
                            }
                            Spacer()
                            Button("Invite") {
                                proximity.invite(peer)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                    if !isScanning && proximity.discoveredPeers.isEmpty {
                        Text("No devices found.")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Cunningham Trainer")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(isScanning ? "Stop Scanning" : "Scan for Devices") {
                        isScanning.toggle()
                        if isScanning {
                            proximity.findClients()
                        } else {
                            proximity.stop()
                        }
                    }
                }
            }
        } detail: {
            if let _ = selectedItem {
                if proximity.activePayload.id == TrainerMetricPayload.preview.id && !isDemoMode && !proximity.status.contains("synced") && proximity.status != "Idle" && !proximity.status.contains("Connected") {
                    VStack(spacing: 12) {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text(proximity.status)
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                } else if proximity.activePayload.id == TrainerMetricPayload.preview.id && !isDemoMode {
                    VStack(spacing: 16) {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text("No Client Connected")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Click 'Scan for Devices' to find a nearby client running Cunningham Fitness.")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                            
                        Button("Load Demo Client") {
                            isDemoMode = true
                            proximity.loadPreviewClient()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)
                        .padding(.top, 8)
                    }
                } else {
                    ClientDashboard(client: proximity.activePayload, note: $sessionNote) {
                        isDemoMode = false
                        proximity.loadPreviewClient()
                    }
                }
            } else {
                Text("Select an item")
            }
        }
    }
}

struct ClientDashboard: View {
    let client: TrainerMetricPayload
    @Binding var note: String
    var onEndSession: () -> Void
    
    var body: some View {
        Form {
            Section {
                LabeledContent("Device", value: client.athlete.deviceId)
                LabeledContent("Goal", value: client.athlete.goal)
                LabeledContent("Sync Time", value: client.capturedAt)
            } header: {
                Text(client.athlete.name)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.bottom, 8)
            }
            
            Section("Vitals") {
                HStack(spacing: 20) {
                    VitalBadge(icon: "flame.fill", color: .orange, value: "\(client.health?.activeCaloriesToday ?? 0)", label: "Active kcal")
                    VitalBadge(icon: "shoeprints.fill", color: .teal, value: "\(client.health?.stepsToday ?? 0)", label: "Steps")
                    VitalBadge(icon: "heart.fill", color: .red, value: "\(client.health?.restingHeartRateBpm ?? 0) bpm", label: "Resting HR")
                    VitalBadge(icon: "bed.double.fill", color: .purple, value: String(format: "%.1f hrs", client.health?.sleepHours ?? 0), label: "Sleep")
                }
                .padding(.vertical, 8)
            }
            
            Section("Training Load") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Weekly Calorie Burn")
                        .font(.headline)
                    
                    Chart {
                        ForEach(Array(client.training.weeklyCalories.enumerated()), id: \.offset) { index, kcal in
                            BarMark(
                                x: .value("Day", dayString(for: index)),
                                y: .value("Calories", kcal)
                            )
                            .foregroundStyle(Color.orange.gradient)
                            .cornerRadius(4)
                        }
                    }
                    .frame(height: 150)
                    
                    Divider().padding(.vertical, 8)
                    
                    Text("Weekly Steps")
                        .font(.headline)
                        
                    Chart {
                        ForEach(Array(client.training.weeklySteps.enumerated()), id: \.offset) { index, steps in
                            BarMark(
                                x: .value("Day", dayString(for: index)),
                                y: .value("Steps", steps)
                            )
                            .foregroundStyle(Color.teal.gradient)
                            .cornerRadius(4)
                        }
                    }
                    .frame(height: 150)
                }
                .padding(.vertical, 8)
            }
            
            Section("Recent Workouts") {
                if client.training.recentWorkouts.isEmpty {
                    Text("No recent workouts recorded.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(client.training.recentWorkouts) { workout in
                        HStack {
                            Image(systemName: iconForWorkoutType(workout.type))
                                .foregroundColor(colorForWorkoutType(workout.type))
                                .font(.title2)
                                .frame(width: 32)
                            
                            VStack(alignment: .leading) {
                                Text(workout.title)
                                    .fontWeight(.bold)
                                Text(workout.source)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("\(workout.calories) kcal")
                                    .fontWeight(.semibold)
                                Text("\(workout.durationMinutes) min")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
            
            Section("Trainer Notes") {
                TextEditor(text: $note)
                    .frame(minHeight: 150)
                    .font(.body)
            }
        }
        .formStyle(.grouped)
        .navigationTitle(client.athlete.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("End Session") {
                    onEndSession()
                }
                .buttonStyle(.bordered)
            }
        }
    }
    
    private func dayString(for index: Int) -> String {
        let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        guard index >= 0 && index < days.count else { return "?" }
        return days[index]
    }
    
    private func iconForWorkoutType(_ type: String) -> String {
        switch type {
        case "Strength": return "dumbbell.fill"
        case "Yoga": return "figure.yoga"
        case "HIIT": return "flame.fill"
        case "Cardio": return "figure.run"
        default: return "figure.run.circle.fill"
        }
    }
    
    private func colorForWorkoutType(_ type: String) -> Color {
        switch type {
        case "Strength": return .teal
        case "Yoga": return .purple
        case "HIIT": return .orange
        case "Cardio": return .red
        default: return .blue
        }
    }
}

struct VitalBadge: View {
    let icon: String
    let color: Color
    let value: String
    let label: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}
