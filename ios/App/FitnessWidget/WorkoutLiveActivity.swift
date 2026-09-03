import WidgetKit
import SwiftUI
import ActivityKit

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            // Lock screen / banner UI
            HStack {
                ZStack {
                    Circle()
                        .fill(Color(hex: context.attributes.colorHex).opacity(0.2))
                        .frame(width: 48, height: 48)
                    Image(systemName: "figure.run")
                        .foregroundColor(Color(hex: context.attributes.colorHex))
                        .font(.system(size: 24, weight: .bold))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.workoutName)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    Text(context.state.currentExerciseName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                }
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(formatTime(context.state.elapsedSeconds))
                        .font(.system(size: 24, weight: .black, design: .monospaced))
                        .foregroundColor(Color(hex: context.attributes.colorHex))
                    Text(context.state.isPaused ? "PAUSED" : "ACTIVE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(context.state.isPaused ? .orange : .green)
                }
            }
            .padding()
            .background(Color(white: 0.1))
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "dumbbell.fill")
                            .foregroundColor(Color(hex: context.attributes.colorHex))
                        Text(context.attributes.workoutName)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(hex: context.attributes.colorHex))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(formatTime(context.state.elapsedSeconds))
                        .font(.system(size: 20, weight: .black, design: .monospaced))
                        .foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.currentExerciseName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Spacer()
                        if context.state.isPaused {
                            Text("PAUSED")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.orange)
                        } else {
                            // Progress bar
                            let progress = min(1.0, Double(context.state.elapsedSeconds) / Double(max(1, context.attributes.totalDurationMinutes * 60)))
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule()
                                        .fill(Color.white.opacity(0.2))
                                    Capsule()
                                        .fill(Color(hex: context.attributes.colorHex))
                                        .frame(width: geo.size.width * progress)
                                }
                            }
                            .frame(height: 8)
                        }
                        Spacer()
                    }
                    .padding(.top, 8)
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill")
                    .foregroundColor(Color(hex: context.attributes.colorHex))
            } compactTrailing: {
                Text(formatTime(context.state.elapsedSeconds))
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(hex: context.attributes.colorHex))
            } minimal: {
                Image(systemName: "dumbbell.fill")
                    .foregroundColor(Color(hex: context.attributes.colorHex))
            }
        }
    }
    
    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}

// Helper extension for hex colors if it doesn't exist in the widget target
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
