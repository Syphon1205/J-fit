import WidgetKit
import SwiftUI

// MARK: - Aesthetics
struct AppTheme {
    static let background = Color(hex: "080808")
    static let surface = Color(hex: "101010")
    static let primary = Color(hex: "00E5C7") // Electric Teal
    static let primaryGradient = LinearGradient(colors: [Color(hex: "00E5C7"), Color(hex: "00C0A3")], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let proteinGlow = LinearGradient(colors: [Color(hex: "FF6B9D"), Color(hex: "E04C7D")], startPoint: .top, endPoint: .bottom) // Coral
    static let carbsGlow = LinearGradient(colors: [Color(hex: "A78BFA"), Color(hex: "8B6EEA")], startPoint: .top, endPoint: .bottom) // Lavender
    static let fatGlow = LinearGradient(colors: [Color(hex: "FACC15"), Color(hex: "D9B214")], startPoint: .top, endPoint: .bottom) // Yellow
}

// MARK: - Data Models
struct NutritionData: Codable {
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var goalCalories: Double
    var goalProtein: Double
    var goalCarbs: Double
    var goalFat: Double
}

struct ProgressData: Codable {
    var steps: Double
    var activeCalories: Double
    var workoutMinutes: Double
    var weeklySteps: [Double]
    var weeklyCalories: [Double]
    var weeklyWorkoutMinutes: [Double]
}

// MARK: - Providers
struct NutritionProvider: TimelineProvider {
    func placeholder(in context: Context) -> NutritionEntry {
        NutritionEntry(date: Date(), data: defaultData())
    }
    func getSnapshot(in context: Context, completion: @escaping (NutritionEntry) -> ()) {
        completion(NutritionEntry(date: Date(), data: loadData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<NutritionEntry>) -> ()) {
        let entry = NutritionEntry(date: Date(), data: loadData())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
    private func loadData() -> NutritionData {
        if let defaults = UserDefaults(suiteName: "group.com.cunninghamfitness.app"),
           let jsonString = defaults.string(forKey: "nutrition_data"),
           let jsonData = jsonString.data(using: .utf8),
           let data = try? JSONDecoder().decode(NutritionData.self, from: jsonData) {
            return data
        }
        return defaultData()
    }
    private func defaultData() -> NutritionData {
        NutritionData(calories: 1450, protein: 95, carbs: 120, fat: 45, goalCalories: 2000, goalProtein: 140, goalCarbs: 180, goalFat: 65)
    }
}

struct ActivityProvider: TimelineProvider {
    func placeholder(in context: Context) -> ActivityEntry {
        ActivityEntry(date: Date(), data: defaultData())
    }
    func getSnapshot(in context: Context, completion: @escaping (ActivityEntry) -> ()) {
        completion(ActivityEntry(date: Date(), data: loadData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ActivityEntry>) -> ()) {
        let entry = ActivityEntry(date: Date(), data: loadData())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
    private func loadData() -> ProgressData {
        if let defaults = UserDefaults(suiteName: "group.com.cunninghamfitness.app"),
           let jsonString = defaults.string(forKey: "progress_data"),
           let jsonData = jsonString.data(using: .utf8),
           let data = try? JSONDecoder().decode(ProgressData.self, from: jsonData) {
            return data
        }
        return defaultData()
    }
    private func defaultData() -> ProgressData {
        ProgressData(steps: 8432, activeCalories: 650, workoutMinutes: 45, weeklySteps: [8000, 9500, 11000, 8432, 0, 0, 0], weeklyCalories: [600, 750, 800, 650, 0, 0, 0], weeklyWorkoutMinutes: [30, 45, 60, 45, 0, 0, 0])
    }
}

struct NutritionEntry: TimelineEntry {
    let date: Date
    let data: NutritionData
}
struct ActivityEntry: TimelineEntry {
    let date: Date
    let data: ProgressData
}

// MARK: - Views
struct NutritionWidgetEntryView : View {
    var entry: NutritionProvider.Entry

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    ZStack {
                        Circle().fill(AppTheme.primaryGradient.opacity(0.2)).frame(width: 24, height: 24)
                        Image(systemName: "flame.fill").foregroundColor(AppTheme.primary).font(.system(size: 12, weight: .bold))
                    }
                    Text("Nutrition").font(.system(size: 14, weight: .heavy)).foregroundColor(.white)
                    Spacer()
                }
                Spacer()
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(Int(entry.data.calories))").font(.system(size: 24, weight: .black)).foregroundColor(.white)
                        Text("/ \(Int(entry.data.goalCalories)) kcal").font(.system(size: 12, weight: .bold)).foregroundColor(.gray)
                    }
                    
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Capsule().frame(width: geometry.size.width, height: 8).foregroundColor(AppTheme.surface)
                            Capsule().frame(width: min(geometry.size.width * CGFloat(entry.data.calories / max(1, entry.data.goalCalories)), geometry.size.width), height: 8)
                                .foregroundStyle(AppTheme.primaryGradient)
                                .shadow(color: AppTheme.primary.opacity(0.5), radius: 4, x: 0, y: 0)
                        }
                    }.frame(height: 8)
                }
                
                Spacer()
                
                HStack(spacing: 0) {
                    MacroBox(label: "Pro", current: entry.data.protein, goal: entry.data.goalProtein, color: AppTheme.proteinGlow)
                    Spacer()
                    MacroBox(label: "Carb", current: entry.data.carbs, goal: entry.data.goalCarbs, color: AppTheme.carbsGlow)
                    Spacer()
                    MacroBox(label: "Fat", current: entry.data.fat, goal: entry.data.goalFat, color: AppTheme.fatGlow)
                }
            }
            .padding()
        }
    }
}

struct MacroBox: View {
    let label: String
    let current: Double
    let goal: Double
    let color: LinearGradient
    
    var body: some View {
        VStack(spacing: 2) {
            Text(label.uppercased()).font(.system(size: 9, weight: .black)).foregroundColor(.gray)
            Text("\(Int(current))g").font(.system(size: 14, weight: .bold)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(AppTheme.surface)
        .cornerRadius(8)
    }
}

struct ActivityWidgetEntryView : View {
    var entry: ActivityProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            if family == .systemMedium {
                // Weekly Chart
                VStack(alignment: .leading) {
                    HStack {
                        ZStack {
                            Circle().fill(AppTheme.proteinGlow.opacity(0.2)).frame(width: 24, height: 24)
                            Image(systemName: "chart.bar.fill").foregroundStyle(AppTheme.proteinGlow).font(.system(size: 12, weight: .bold))
                        }
                        Text("Weekly Steps").font(.system(size: 14, weight: .heavy)).foregroundColor(.white)
                    }
                    Spacer()
                    HStack(alignment: .bottom, spacing: 10) {
                        ForEach(0..<7, id: \.self) { index in
                            let steps = entry.data.weeklySteps.indices.contains(index) ? entry.data.weeklySteps[index] : 0
                            let heightRatio = CGFloat(steps / 15000.0) // Assume 15k is max for chart
                            VStack {
                                Spacer()
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(steps > 0 ? AppTheme.proteinGlow : LinearGradient(colors: [AppTheme.surface], startPoint: .top, endPoint: .bottom))
                                    .frame(height: max(8, 80 * min(heightRatio, 1.0)))
                            }
                        }
                    }
                }.padding()
            } else {
                // Daily Activity Rings/List
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        ZStack {
                            Circle().fill(AppTheme.carbsGlow.opacity(0.2)).frame(width: 24, height: 24)
                            Image(systemName: "figure.run").foregroundStyle(AppTheme.carbsGlow).font(.system(size: 12, weight: .bold))
                        }
                        Text("Activity").font(.system(size: 14, weight: .heavy)).foregroundColor(.white)
                        Spacer()
                    }
                    Spacer()
                    ActivityRow(icon: "shoeprints.fill", color: AppTheme.carbsGlow, value: Int(entry.data.steps), unit: "steps")
                    ActivityRow(icon: "flame.fill", color: AppTheme.primaryGradient, value: Int(entry.data.activeCalories), unit: "kcal")
                    ActivityRow(icon: "clock.fill", color: AppTheme.proteinGlow, value: Int(entry.data.workoutMinutes), unit: "min")
                }.padding()
            }
        }
    }
}

struct ActivityRow: View {
    let icon: String
    let color: LinearGradient
    let value: Int
    let unit: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(color).frame(width: 20)
            Text("\(value)").font(.system(size: 16, weight: .black)).foregroundColor(.white)
            Text(unit).font(.system(size: 11, weight: .bold)).foregroundColor(.gray)
        }
    }
}

// MARK: - Widgets
struct NutritionWidget: Widget {
    let kind: String = "NutritionWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NutritionProvider()) { entry in
            if #available(iOS 17.0, *) {
                NutritionWidgetEntryView(entry: entry)
                    .containerBackground(AppTheme.background, for: .widget)
            } else {
                NutritionWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Nutrition Tracker")
        .description("Track your daily macros and calories in style.")
        .supportedFamilies([.systemSmall])
    }
}

struct ActivityWidget: Widget {
    let kind: String = "ActivityWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ActivityProvider()) { entry in
            if #available(iOS 17.0, *) {
                ActivityWidgetEntryView(entry: entry)
                    .containerBackground(AppTheme.background, for: .widget)
            } else {
                ActivityWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Daily Activity")
        .description("Track steps, calories, and workouts.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
