import Foundation
import ActivityKit

// MARK: - Workout Live Activity Attributes
struct WorkoutAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about the active workout
        var elapsedSeconds: Int
        var currentExerciseName: String
        var isPaused: Bool
    }

    // Fixed non-changing properties about the active workout
    var workoutName: String
    var workoutCategory: String
    var colorHex: String
    var totalDurationMinutes: Int
}
