import Foundation

enum CoachingEngine {
    static func recommendations(for payload: TrainerMetricPayload) -> [CoachingRecommendation] {
        var output: [CoachingRecommendation] = []
        let health = payload.health
        let weeklyMinutes = payload.training.weeklyWorkoutMinutes.reduce(0, +)
        let avgSteps = average(payload.training.weeklySteps)

        if let sleep = health?.sleepHours, sleep < 6.5 {
            output.append(.init(
                title: "Reduce load until sleep rebounds",
                detail: "Sleep is under 6.5 hours. Bias technique, Zone 2, mobility, and earlier wind-down habits.",
                priority: .high
            ))
        }

        if let hrv = health?.hrvMs, hrv < 45 {
            output.append(.init(
                title: "Watch recovery stress",
                detail: "HRV is suppressed. Avoid max effort work and ask about soreness, stress, and hydration.",
                priority: .high
            ))
        }

        if weeklyMinutes < 150 {
            output.append(.init(
                title: "Build weekly training base",
                detail: "Weekly workout minutes are below the growth floor. Add two 30-minute structured sessions.",
                priority: .medium
            ))
        }

        if avgSteps < 7_000 {
            output.append(.init(
                title: "Raise daily movement",
                detail: "Average steps are low. Set a simple walking target before adding more intense conditioning.",
                priority: .medium
            ))
        }

        if payload.training.recentRuns.isEmpty {
            output.append(.init(
                title: "Add aerobic baseline",
                detail: "No recent runs are present. Start with short easy intervals or incline walks.",
                priority: .low
            ))
        }

        if output.isEmpty {
            output.append(.init(
                title: "Progress carefully",
                detail: "Core markers look usable. Add one small progression and monitor sleep, HRV, and soreness next sync.",
                priority: .low
            ))
        }

        return output
    }

    private static func average(_ values: [Int]) -> Int {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / values.count
    }
}
