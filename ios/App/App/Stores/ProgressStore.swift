import Foundation
import Combine

struct FitnessGoal: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var current: Double
    var target: Double
    var unit: String
    let createdAt: Date
}

struct ProgressNote: Identifiable, Codable, Equatable {
    let id: UUID
    let text: String
    let createdAt: Date
}

final class ProgressStore: ObservableObject {
    static let shared = ProgressStore()

    @Published var weeklySteps: [Int] = Array(repeating: 0, count: 7)
    @Published var weeklyCalories: [Int] = Array(repeating: 0, count: 7)
    @Published var weeklyWorkoutMinutes: [Int] = Array(repeating: 0, count: 7)
    @Published var goals: [FitnessGoal] = []
    @Published var notes: [ProgressNote] = []

    private let stepsKey = "cf_weekly_steps"
    private let caloriesKey = "cf_weekly_calories"
    private let minutesKey = "cf_weekly_minutes"
    private let goalsKey = "cf_fitness_goals"
    private let notesKey = "cf_progress_notes"

    private init() { load() }

    var totalWeeklySteps: Int { weeklySteps.reduce(0, +) }
    var totalWeeklyCalories: Int { weeklyCalories.reduce(0, +) }
    var totalWorkoutMinutes: Int { weeklyWorkoutMinutes.reduce(0, +) }
    var cardioProgressFraction: Double {
        min(Double(totalWorkoutMinutes) / 150.0, 1)
    }

    func updateToday(steps: Int? = nil, calories: Int? = nil) {
        let index = todayIndex
        if let steps { weeklySteps[index] = steps }
        if let calories { weeklyCalories[index] = calories }
        saveMetrics()
    }

    func setHealthWorkoutMinutes(_ values: [Int]) {
        guard values.count == 7 else { return }
        weeklyWorkoutMinutes = values
        saveMetrics()
    }

    func addGoal(title: String, target: Double, unit: String) {
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanUnit = unit.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanTitle.isEmpty, target > 0 else { return }
        goals.insert(
            FitnessGoal(
                id: UUID(),
                title: cleanTitle,
                current: 0,
                target: target,
                unit: cleanUnit.isEmpty ? "times" : cleanUnit,
                createdAt: Date()
            ),
            at: 0
        )
        saveJournal()
    }

    func advanceGoal(_ goal: FitnessGoal, by amount: Double) {
        guard let index = goals.firstIndex(where: { $0.id == goal.id }) else { return }
        goals[index].current = min(max(goals[index].current + amount, 0), goals[index].target)
        saveJournal()
    }

    func setGoalValue(_ goal: FitnessGoal, value: Double) {
        guard let index = goals.firstIndex(where: { $0.id == goal.id }) else { return }
        goals[index].current = min(max(value, 0), goals[index].target)
        saveJournal()
    }

    func removeGoal(_ goal: FitnessGoal) {
        goals.removeAll { $0.id == goal.id }
        saveJournal()
    }

    func addNote(_ text: String) {
        let cleanText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanText.isEmpty else { return }
        notes.insert(ProgressNote(id: UUID(), text: cleanText, createdAt: Date()), at: 0)
        saveJournal()
    }

    private var todayIndex: Int {
        let weekday = Calendar.current.component(.weekday, from: Date())
        return (weekday + 5) % 7
    }

    private func saveMetrics() {
        UserDefaults.standard.set(weeklySteps, forKey: stepsKey)
        UserDefaults.standard.set(weeklyCalories, forKey: caloriesKey)
        UserDefaults.standard.set(weeklyWorkoutMinutes, forKey: minutesKey)
    }

    private func saveJournal() {
        let encoder = JSONEncoder()
        if let goalsData = try? encoder.encode(goals) {
            UserDefaults.standard.set(goalsData, forKey: goalsKey)
        }
        if let notesData = try? encoder.encode(notes) {
            UserDefaults.standard.set(notesData, forKey: notesKey)
        }
    }

    private func load() {
        if let values = UserDefaults.standard.array(forKey: stepsKey) as? [Int], values.count == 7 {
            weeklySteps = values
        }
        if let values = UserDefaults.standard.array(forKey: caloriesKey) as? [Int], values.count == 7 {
            weeklyCalories = values
        }
        if let values = UserDefaults.standard.array(forKey: minutesKey) as? [Int], values.count == 7 {
            weeklyWorkoutMinutes = values
        }
        let decoder = JSONDecoder()
        if let data = UserDefaults.standard.data(forKey: goalsKey),
           let storedGoals = try? decoder.decode([FitnessGoal].self, from: data) {
            goals = storedGoals
        }
        if let data = UserDefaults.standard.data(forKey: notesKey),
           let storedNotes = try? decoder.decode([ProgressNote].self, from: data) {
            notes = storedNotes
        }
    }
}
