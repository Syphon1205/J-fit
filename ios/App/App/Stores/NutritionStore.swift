//
//  NutritionStore.swift
//  App
//
//  ObservableObject singleton managing daily nutrition tracking.
//  Auto-resets daily log on new day. Pre-seeds sample meals on first launch.
//

import Foundation
import Combine

// MARK: - Models

struct MealItem: Codable, Identifiable {
    var id: String = UUID().uuidString
    var name: String
    var mealType: String  // "Breakfast" / "Lunch" / "Dinner" / "Snack"
    var calories: Int
    var protein: Double
    var carbs: Double
    var fat: Double
    var date: Date
}

struct DailyGoals: Codable {
    var calories: Int = 2400
    var protein: Int = 180
    var carbs: Int = 220
    var fat: Int = 75
    var water: Int = 8
}

// MARK: - NutritionStore

final class NutritionStore: ObservableObject {

    static let shared = NutritionStore()

    @Published var allMeals: [MealItem] = []
    @Published var goals: DailyGoals = DailyGoals()
    @Published var waterCups: Int = 0

    // Today's filtered meals (derived from allMeals)
    var mealLog: [MealItem] {
        let cal = Calendar.current
        return allMeals.filter { cal.isDateInToday($0.date) }
    }

    // MARK: - Computed Nutrition Totals (today)

    var totalCalories: Int {
        mealLog.reduce(0) { $0 + $1.calories }
    }

    var totalProtein: Double {
        mealLog.reduce(0.0) { $0 + $1.protein }
    }

    var totalCarbs: Double {
        mealLog.reduce(0.0) { $0 + $1.carbs }
    }

    var totalFat: Double {
        mealLog.reduce(0.0) { $0 + $1.fat }
    }

    var caloriesRemaining: Int {
        max(goals.calories - totalCalories, 0)
    }

    var proteinRemaining: Double {
        max(Double(goals.protein) - totalProtein, 0)
    }

    // MARK: - Keys

    private let mealsKey     = "cf_meals"
    private let waterKey     = "cf_water"
    private let goalsKey     = "cf_goals"
    private let lastResetKey = "cf_last_reset"

    private init() {
        load()
        resetIfNewDay()
    }

    // MARK: - Public Methods

    func logMeal(name: String,
                 mealType: String,
                 calories: Int,
                 protein: Double,
                 carbs: Double,
                 fat: Double) {
        let item = MealItem(
            name: name,
            mealType: mealType,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            date: Date()
        )
        allMeals.append(item)
        objectWillChange.send()
        save()
    }

    func addWater() {
        waterCups += 1
        UserDefaults.standard.set(waterCups, forKey: waterKey)
    }

    func resetIfNewDay() {
        let cal = Calendar.current
        let lastResetData = UserDefaults.standard.object(forKey: lastResetKey) as? Date
        if let last = lastResetData, cal.isDateInToday(last) {
            // Already reset today — nothing to do
            return
        }
        // New day: remove yesterday's meals (keep older history intact)
        // For a simple implementation we just reset water and record today's date
        waterCups = 0
        UserDefaults.standard.set(0, forKey: waterKey)
        UserDefaults.standard.set(Date(), forKey: lastResetKey)
    }

    // MARK: - Persistence

    func save() {
        if let data = try? JSONEncoder().encode(allMeals) {
            UserDefaults.standard.set(data, forKey: mealsKey)
        }
        if let data = try? JSONEncoder().encode(goals) {
            UserDefaults.standard.set(data, forKey: goalsKey)
        }
    }

    func load() {
        // Meals
        if let data = UserDefaults.standard.data(forKey: mealsKey),
           let decoded = try? JSONDecoder().decode([MealItem].self, from: data) {
            self.allMeals = decoded
        } else {
            // First launch — pre-seed sample meals for today
            seedDefaultMeals()
        }

        // Goals
        if let data = UserDefaults.standard.data(forKey: goalsKey),
           let decoded = try? JSONDecoder().decode(DailyGoals.self, from: data) {
            self.goals = decoded
        }

        // Water
        self.waterCups = UserDefaults.standard.integer(forKey: waterKey)
    }

    // MARK: - Default Meals

    private func seedDefaultMeals() {
        let now = Date()
        allMeals = [
            MealItem(name: "Oatmeal with Berries",  mealType: "Breakfast", calories: 380, protein: 14, carbs: 62, fat: 8,  date: now),
            MealItem(name: "Greek Yogurt",           mealType: "Breakfast", calories: 150, protein: 20, carbs: 10, fat: 2,  date: now),
            MealItem(name: "Grilled Chicken Salad",  mealType: "Lunch",     calories: 520, protein: 48, carbs: 22, fat: 24, date: now),
            MealItem(name: "Brown Rice & Veggies",   mealType: "Lunch",     calories: 320, protein: 8,  carbs: 62, fat: 4,  date: now),
            MealItem(name: "Protein Bar",            mealType: "Snack",     calories: 210, protein: 20, carbs: 24, fat: 7,  date: now)
        ]
        save()
    }
}
