import SwiftUI

struct NutritionView: View {
    @EnvironmentObject private var nutrition: NutritionStore
    @EnvironmentObject private var theme: ThemeStore
    @State private var showLogSheet = false
    @State private var logMealType = "Breakfast"

    private let mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"]
    private let mealIcons = ["Breakfast": "sun.horizon.fill", "Lunch": "fork.knife", "Dinner": "moon.stars.fill", "Snack": "leaf.fill"]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {

                // Header
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nutrition")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text("Fuel system")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                }

                // Macro rings card
                VStack(spacing: 16) {
                    HStack(spacing: 0) {
                        // Big calorie ring
                        VStack(spacing: 6) {
                            ZStack {
                                RingView(progress: Double(nutrition.totalCalories) / Double(max(1, nutrition.goals.calories)),
                                         color: theme.tertiary, lineWidth: 14, size: 110)
                                VStack(spacing: 0) {
                                    Text("\(nutrition.totalCalories)")
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundColor(AppColors.textPrimary)
                                    Text("/ \(nutrition.goals.calories)")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(AppColors.textSecondary)
                                }
                            }
                            Text("Calories")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(theme.tertiary)
                        }
                        .frame(maxWidth: .infinity)

                        // Protein, Carbs, Fat arcs
                        VStack(spacing: 14) {
                            HStack(spacing: 20) {
                                MacroArc(label: "Protein", current: nutrition.totalProtein,
                                         goal: Double(nutrition.goals.protein), color: theme.primary)
                                MacroArc(label: "Carbs", current: nutrition.totalCarbs,
                                         goal: Double(nutrition.goals.carbs), color: theme.secondary)
                                MacroArc(label: "Fat", current: nutrition.totalFat,
                                         goal: Double(nutrition.goals.fat), color: Color.orange)
                            }
                            // Remaining labels
                            HStack {
                                Text("\(nutrition.caloriesRemaining) kcal left")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(AppColors.textSecondary)
                                Spacer()
                                Text("\(Int(nutrition.proteinRemaining))g protein left")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(AppColors.textSecondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .padding(20)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))

                // Water tracker
                HStack(spacing: 14) {
                    ZStack {
                        Circle().fill(theme.secondary.opacity(0.15)).frame(width: 48, height: 48)
                        Image(systemName: "drop.fill")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(theme.secondary)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Water")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                        Text("\(nutrition.waterCups) / \(nutrition.goals.water) cups")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(AppColors.textSecondary)
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(AppColors.surfaceLight).frame(height: 8)
                                Capsule()
                                    .fill(theme.secondary)
                                    .frame(width: geo.size.width * CGFloat(nutrition.waterCups) / CGFloat(max(1, nutrition.goals.water)), height: 8)
                            }
                        }
                        .frame(height: 8)
                    }
                    Spacer()
                    Button { nutrition.addWater() } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(AppColors.background)
                            .frame(width: 44, height: 44)
                            .background(theme.secondary)
                            .clipShape(Circle())
                    }
                }
                .padding(16)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.pill)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.pill).stroke(AppColors.border))

                // Meal sections
                ForEach(mealTypes, id: \.self) { mealType in
                    let meals = nutrition.mealLog.filter { $0.mealType == mealType }
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Image(systemName: mealIcons[mealType] ?? "fork.knife")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(theme.primary)
                            Text(mealType)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                            Spacer()
                            Text("\(meals.reduce(0) { $0 + $1.calories }) kcal")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(AppColors.textSecondary)
                            Button {
                                logMealType = mealType
                                showLogSheet = true
                            } label: {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 22, weight: .semibold))
                                    .foregroundColor(theme.primary)
                            }
                        }

                        if meals.isEmpty {
                            Text("No meals logged")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(AppColors.textTertiary)
                                .padding(.vertical, 4)
                        } else {
                            ForEach(meals) { meal in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(meal.name)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundColor(AppColors.textPrimary)
                                        Text("\(Int(meal.protein))g protein · \(Int(meal.carbs))g carbs · \(Int(meal.fat))g fat")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(AppColors.textSecondary)
                                    }
                                    Spacer()
                                    Text("\(meal.calories) kcal")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(theme.primary)
                                }
                                .padding(12)
                                .background(AppColors.surfaceLight)
                                .cornerRadius(AppRadius.input)
                            }
                        }
                    }
                    .padding(16)
                    .background(AppColors.surface)
                    .cornerRadius(AppRadius.card)
                    .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 60)
            .padding(.bottom, 150)
        }
        .background(AppColors.background.ignoresSafeArea())
        .sheet(isPresented: $showLogSheet) {
            LogMealSheet(mealType: $logMealType)
                .environmentObject(nutrition)
                .environmentObject(theme)
        }
    }
}

// MARK: - Log Meal Sheet
struct LogMealSheet: View {
    @EnvironmentObject private var nutrition: NutritionStore
    @EnvironmentObject private var theme: ThemeStore
    @Environment(\.presentationMode) private var presentationMode
    @Binding var mealType: String

    @State private var name = ""
    @State private var calories = ""
    @State private var protein = ""
    @State private var carbs = ""
    @State private var fat = ""
    private let mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    Text("Log Meal")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    inputField(label: "Food name", text: $name, keyboard: .default)
                    inputField(label: "Calories (kcal)", text: $calories, keyboard: .numberPad)
                    inputField(label: "Protein (g)", text: $protein, keyboard: .decimalPad)
                    inputField(label: "Carbs (g)", text: $carbs, keyboard: .decimalPad)
                    inputField(label: "Fat (g)", text: $fat, keyboard: .decimalPad)

                    // Meal type picker
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Meal type")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(AppColors.textSecondary)
                        HStack(spacing: 8) {
                            ForEach(mealTypes, id: \.self) { type in
                                Button { mealType = type } label: {
                                    Text(type)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(mealType == type ? AppColors.background : AppColors.textSecondary)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 10)
                                        .background(mealType == type ? theme.primary : AppColors.surfaceLight)
                                        .cornerRadius(999)
                                }
                            }
                        }
                    }

                    Button {
                        guard !name.isEmpty, let cal = Int(calories), cal > 0 else { return }
                        nutrition.logMeal(
                            name: name, mealType: mealType,
                            calories: cal,
                            protein: Double(protein) ?? 0,
                            carbs: Double(carbs) ?? 0,
                            fat: Double(fat) ?? 0
                        )
                        presentationMode.wrappedValue.dismiss()
                    } label: {
                        Text("LOG MEAL")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(AppColors.background)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(theme.primary)
                            .cornerRadius(999)
                    }
                }
                .padding(24)
            }
            .background(AppColors.surface.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { presentationMode.wrappedValue.dismiss() }
                        .foregroundColor(AppColors.textSecondary)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    func inputField(label: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(AppColors.textSecondary)
            TextField("", text: text)
                .keyboardType(keyboard)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
                .padding(.horizontal, 14)
                .frame(height: 50)
                .background(AppColors.surfaceLight)
                .cornerRadius(AppRadius.input)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.input).stroke(AppColors.border))
        }
    }
}
