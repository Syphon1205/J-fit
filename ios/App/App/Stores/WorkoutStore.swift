//
//  WorkoutStore.swift
//  App
//
//  ObservableObject singleton managing workout templates, active workout sessions,
//  and workout logs. Pre-seeds 5 templates on first launch.
//

import Foundation
import Combine
import ActivityKit

// MARK: - Models

struct Exercise: Codable, Identifiable {
    var id: String = UUID().uuidString
    var name: String
    var sets: Int
    var reps: Int
    var weight: Double
    var unit: String  // "lbs" or "kg"
}

struct WorkoutTemplate: Codable, Identifiable {
    var id: String = UUID().uuidString
    var name: String
    var category: String  // "Strength" / "Cardio" / "HIIT"
    var exercises: [Exercise]
    var durationMinutes: Int
    var difficulty: String  // "Beginner" / "Intermediate" / "Advanced"
    var colorHex: String
}

struct WorkoutLog: Codable, Identifiable {
    var id: String = UUID().uuidString
    var templateId: String
    var templateName: String
    var date: Date
    var durationMinutes: Int
    var caloriesBurned: Int
}

// MARK: - WorkoutStore

final class WorkoutStore: ObservableObject {

    static let shared = WorkoutStore()

    @Published var templates: [WorkoutTemplate] = []
    @Published var logs: [WorkoutLog] = []
    @Published var activeWorkout: WorkoutTemplate?
    @Published var activeSeconds: Int = 0
    @Published var isWorkoutActive: Bool = false

    private let templatesKey = "cf_workout_templates"
    private let logsKey = "cf_workout_logs"

    private var timer: DispatchSourceTimer?
    private var liveActivity: Any? // Stores Activity<WorkoutAttributes>

    private init() {
        load()
    }

    // MARK: - Workout Session

    func startWorkout(_ template: WorkoutTemplate) {
        activeWorkout = template
        activeSeconds = 0
        isWorkoutActive = true
        startTimer()
        
        if #available(iOS 16.2, *) {
            if ActivityAuthorizationInfo().areActivitiesEnabled {
                let attributes = WorkoutAttributes(workoutName: template.name, workoutCategory: template.category, colorHex: template.colorHex, totalDurationMinutes: template.durationMinutes)
                let state = WorkoutAttributes.ContentState(elapsedSeconds: 0, currentExerciseName: template.exercises.first?.name ?? "Warmup", isPaused: false)
                do {
                    liveActivity = try Activity.request(attributes: attributes, content: ActivityContent(state: state, staleDate: nil))
                } catch {
                    print("Failed to start Live Activity: \(error.localizedDescription)")
                }
            }
        }
    }

    func endWorkout() {
        guard let active = activeWorkout else { return }
        stopTimer()

        let elapsed = max(activeSeconds / 60, 1)
        // Rough calorie estimate: ~7 cal/min for strength, ~10 for HIIT
        let calPerMin = active.category == "HIIT" ? 10 : 7
        let burned = elapsed * calPerMin

        let log = WorkoutLog(
            templateId: active.id,
            templateName: active.name,
            date: Date(),
            durationMinutes: elapsed,
            caloriesBurned: burned
        )
        logs.append(log)
        saveLogs()
        
        // Notifications
        NotificationManager.shared.cancelWorkoutReminder()
        NotificationManager.shared.sendWorkoutCompletionNotification(workoutName: active.name, durationMinutes: elapsed)
        
        // End Live Activity
        if #available(iOS 16.2, *) {
            if let activity = liveActivity as? Activity<WorkoutAttributes> {
                let state = WorkoutAttributes.ContentState(elapsedSeconds: activeSeconds, currentExerciseName: "Finished", isPaused: false)
                Task {
                    await activity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: .immediate)
                }
                liveActivity = nil
            }
        }
        
        clearActive()
    }

    func cancelWorkout() {
        stopTimer()
        
        if #available(iOS 16.2, *) {
            if let activity = liveActivity as? Activity<WorkoutAttributes> {
                let state = WorkoutAttributes.ContentState(elapsedSeconds: activeSeconds, currentExerciseName: "Cancelled", isPaused: false)
                Task {
                    await activity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: .immediate)
                }
                liveActivity = nil
            }
        }
        
        clearActive()
    }

    // MARK: - Persistence

    func save() {
        saveTemplates()
        saveLogs()
    }

    func load() {
        loadTemplates()
        loadLogs()
    }

    // MARK: - Private

    private func startTimer() {
        let queue = DispatchQueue.global(qos: .background)
        timer = DispatchSource.makeTimerSource(queue: queue)
        timer?.schedule(deadline: .now() + 1, repeating: 1.0)
        timer?.setEventHandler { [weak self] in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.activeSeconds += 1
                
                // Update live activity every 5 seconds to avoid rate limiting
                if self.activeSeconds % 5 == 0 {
                    if #available(iOS 16.2, *) {
                        if let activity = self.liveActivity as? Activity<WorkoutAttributes> {
                            let exerciseName = self.activeWorkout?.exercises.first?.name ?? "Active"
                            let state = WorkoutAttributes.ContentState(elapsedSeconds: self.activeSeconds, currentExerciseName: exerciseName, isPaused: false)
                            Task {
                                await activity.update(ActivityContent(state: state, staleDate: nil))
                            }
                        }
                    }
                }
            }
        }
        timer?.resume()
    }

    private func stopTimer() {
        timer?.cancel()
        timer = nil
    }

    private func clearActive() {
        activeWorkout = nil
        activeSeconds = 0
        isWorkoutActive = false
    }

    private func saveTemplates() {
        if let data = try? JSONEncoder().encode(templates) {
            UserDefaults.standard.set(data, forKey: templatesKey)
        }
    }

    private func saveLogs() {
        if let data = try? JSONEncoder().encode(logs) {
            UserDefaults.standard.set(data, forKey: logsKey)
        }
    }

    private func loadTemplates() {
        if let data = UserDefaults.standard.data(forKey: templatesKey),
           let decoded = try? JSONDecoder().decode([WorkoutTemplate].self, from: data) {
            self.templates = decoded
        } else {
            self.templates = Self.defaultTemplates()
            saveTemplates()
        }
    }

    private func loadLogs() {
        if let data = UserDefaults.standard.data(forKey: logsKey),
           let decoded = try? JSONDecoder().decode([WorkoutLog].self, from: data) {
            self.logs = decoded
        }
    }

    // MARK: - Default Templates

    private static func defaultTemplates() -> [WorkoutTemplate] {
        [
            WorkoutTemplate(
                name: "Upper Body Power",
                category: "Strength",
                exercises: [
                    Exercise(name: "Bench Press",     sets: 4, reps: 8,  weight: 185, unit: "lbs"),
                    Exercise(name: "Pull-Ups",        sets: 4, reps: 10, weight: 0,   unit: "lbs"),
                    Exercise(name: "Overhead Press",  sets: 3, reps: 10, weight: 95,  unit: "lbs"),
                    Exercise(name: "Barbell Row",     sets: 4, reps: 8,  weight: 135, unit: "lbs"),
                    Exercise(name: "Tricep Dips",     sets: 3, reps: 12, weight: 0,   unit: "lbs")
                ],
                durationMinutes: 45,
                difficulty: "Advanced",
                colorHex: "00E5C7"
            ),
            WorkoutTemplate(
                name: "Lower Body Blast",
                category: "Strength",
                exercises: [
                    Exercise(name: "Squat",               sets: 5, reps: 5,  weight: 225, unit: "lbs"),
                    Exercise(name: "Romanian Deadlift",   sets: 4, reps: 8,  weight: 185, unit: "lbs"),
                    Exercise(name: "Leg Press",           sets: 4, reps: 10, weight: 360, unit: "lbs"),
                    Exercise(name: "Calf Raises",         sets: 4, reps: 15, weight: 135, unit: "lbs")
                ],
                durationMinutes: 50,
                difficulty: "Advanced",
                colorHex: "A78BFA"
            ),
            WorkoutTemplate(
                name: "HIIT Cardio",
                category: "HIIT",
                exercises: [
                    Exercise(name: "Burpees",          sets: 4, reps: 20, weight: 0, unit: "lbs"),
                    Exercise(name: "Jump Rope",        sets: 4, reps: 60, weight: 0, unit: "lbs"),
                    Exercise(name: "Mountain Climbers",sets: 4, reps: 30, weight: 0, unit: "lbs"),
                    Exercise(name: "Box Jumps",        sets: 4, reps: 15, weight: 0, unit: "lbs")
                ],
                durationMinutes: 30,
                difficulty: "Intermediate",
                colorHex: "FF6B9D"
            ),
            WorkoutTemplate(
                name: "Push Day",
                category: "Strength",
                exercises: [
                    Exercise(name: "Bench Press",       sets: 4, reps: 10, weight: 175, unit: "lbs"),
                    Exercise(name: "Incline DB Press",  sets: 3, reps: 12, weight: 65,  unit: "lbs"),
                    Exercise(name: "Cable Fly",         sets: 3, reps: 15, weight: 0,   unit: "lbs"),
                    Exercise(name: "Tricep Pushdown",   sets: 3, reps: 15, weight: 0,   unit: "lbs"),
                    Exercise(name: "Lateral Raises",    sets: 3, reps: 15, weight: 25,  unit: "lbs")
                ],
                durationMinutes: 45,
                difficulty: "Intermediate",
                colorHex: "00E5C7"
            ),
            WorkoutTemplate(
                name: "Pull Day",
                category: "Strength",
                exercises: [
                    Exercise(name: "Deadlift",      sets: 3, reps: 5,  weight: 275, unit: "lbs"),
                    Exercise(name: "Barbell Row",   sets: 4, reps: 8,  weight: 155, unit: "lbs"),
                    Exercise(name: "Lat Pulldown",  sets: 4, reps: 10, weight: 140, unit: "lbs"),
                    Exercise(name: "Face Pulls",    sets: 3, reps: 15, weight: 0,   unit: "lbs"),
                    Exercise(name: "Hammer Curls",  sets: 3, reps: 12, weight: 40,  unit: "lbs")
                ],
                durationMinutes: 50,
                difficulty: "Advanced",
                colorHex: "A78BFA"
            )
        ]
    }
}
