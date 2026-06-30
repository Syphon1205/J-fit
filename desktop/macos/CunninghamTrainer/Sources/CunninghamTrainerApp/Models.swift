import Foundation

struct TrainerMetricPayload: Codable, Identifiable {
    let protocolVersion: Int
    let athlete: Athlete
    let capturedAt: String
    let health: HealthSnapshot?
    let training: TrainingSnapshot
    let flags: [String]

    var id: String { athlete.id }

    static let preview = TrainerMetricPayload(
        protocolVersion: 1,
        athlete: Athlete(id: "local_user", name: "Cunningham Athlete", goal: "Build muscle", deviceId: "LOCAL-DEVICE"),
        capturedAt: ISO8601DateFormatter().string(from: Date()),
        health: HealthSnapshot(
            stepsToday: 8420,
            distanceKmToday: 5.8,
            activeCaloriesToday: 612,
            heartRateBpm: 88,
            restingHeartRateBpm: 54,
            hrvMs: 64,
            sleepHours: 7.2,
            sourceLabel: "Device Health",
            syncedAt: ISO8601DateFormatter().string(from: Date())
        ),
        training: TrainingSnapshot(
            workoutsCompleted: 4,
            weeklyWorkoutMinutes: [35, 0, 55, 45, 0, 62, 30],
            weeklySteps: [7100, 6400, 9200, 8300, 5400, 11200, 8420],
            weeklyCalories: [420, 310, 650, 590, 280, 710, 612],
            recentRuns: [
                RunSummary(date: "2026-05-30", distanceKm: 5.2, durationSeconds: 1810, avgPaceMinKm: 5.8, calories: 410),
                RunSummary(date: "2026-05-27", distanceKm: 8.1, durationSeconds: 2640, avgPaceMinKm: 5.4, calories: 620)
            ],
            recentWorkouts: [
                WorkoutSummary(date: "2026-06-12", title: "Upper Body Power", source: "Cunningham Fitness", durationMinutes: 45, calories: 320, type: "Strength"),
                WorkoutSummary(date: "2026-06-10", title: "Morning Yoga", source: "Apple Health", durationMinutes: 30, calories: 150, type: "Yoga"),
                WorkoutSummary(date: "2026-06-08", title: "HIIT Cardio", source: "Cunningham Fitness", durationMinutes: 30, calories: 400, type: "HIIT")
            ],
            weightHistory: [
                WeightPoint(date: "2026-05-01", kg: 78.2),
                WeightPoint(date: "2026-05-15", kg: 77.1),
                WeightPoint(date: "2026-05-31", kg: 76.4)
            ]
        ),
        flags: ["HRV stable", "Sleep usable", "Friday training gap"]
    )
}

struct Athlete: Codable {
    let id: String
    let name: String
    let goal: String
    let deviceId: String
}

struct HealthSnapshot: Codable {
    let stepsToday: Int
    let distanceKmToday: Double?
    let activeCaloriesToday: Int?
    let heartRateBpm: Int?
    let restingHeartRateBpm: Int?
    let hrvMs: Int?
    let sleepHours: Double?
    let sourceLabel: String
    let syncedAt: String
}

struct TrainingSnapshot: Codable {
    let workoutsCompleted: Int
    let weeklyWorkoutMinutes: [Int]
    let weeklySteps: [Int]
    let weeklyCalories: [Int]
    let recentRuns: [RunSummary]
    let recentWorkouts: [WorkoutSummary]
    let weightHistory: [WeightPoint]
}

struct WorkoutSummary: Codable, Identifiable {
    var id: String { "\(date)-\(title)" }
    let date: String
    let title: String
    let source: String
    let durationMinutes: Int
    let calories: Int
    let type: String
}

struct RunSummary: Codable, Identifiable {
    var id: String { "\(date)-\(distanceKm)" }
    let date: String
    let distanceKm: Double
    let durationSeconds: Int
    let avgPaceMinKm: Double
    let calories: Int
}

struct WeightPoint: Codable, Identifiable {
    var id: String { date }
    let date: String
    let kg: Double
}

struct CoachingRecommendation: Identifiable {
    let id = UUID()
    let title: String
    let detail: String
    let priority: Priority

    enum Priority: String {
        case high = "High"
        case medium = "Medium"
        case low = "Low"
    }
}
