//
//  AnalyticsView.swift
//  App
//
//  Analytics screen with 2×2 overview stat cards, weekly steps bar chart,
//  recent workouts list, and a large cardio progress ring.
//

import SwiftUI


private func formatDate(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateStyle = .medium
    f.timeStyle = .none
    return f.string(from: date)
}

struct AnalyticsView: View {
    @EnvironmentObject private var theme: ThemeStore

    @EnvironmentObject private var workouts: WorkoutStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var health: HealthStore

    private let weekDays = ["M", "T", "W", "T", "F", "S", "S"]

    // MARK: - Computed

    private var totalWorkouts: Int { workouts.logs.count }

    private var totalCaloriesBurned: Int {
        workouts.logs.reduce(0) { $0 + $1.caloriesBurned }
    }

    private var totalWeeklySteps: Int { progress.totalWeeklySteps }

    private var totalActiveMinutes: Int { progress.totalWorkoutMinutes }

    private var recentLogs: [WorkoutLog] { Array(workouts.logs.prefix(5)) }

    // MARK: - Body

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 28) {

                // ── Header ───────────────────────────────────────────────
                VStack(alignment: .leading, spacing: 6) {
                    Text("Analytics")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text("Training intelligence")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 60)

                // ── Overview 2×2 Stat Grid ────────────────────────────────
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    AnalyticsStatCard(
                        title: "Total Workouts",
                        value: "\(totalWorkouts)",
                        subtitle: "all time",
                        icon: "dumbbell.fill",
                        color: theme.primary
                    )
                    AnalyticsStatCard(
                        title: "Calories Burned",
                        value: formatLargeNumber(totalCaloriesBurned),
                        subtitle: "kcal total",
                        icon: "flame.fill",
                        color: theme.tertiary
                    )
                    AnalyticsStatCard(
                        title: "Total Steps",
                        value: formatLargeNumber(totalWeeklySteps),
                        subtitle: "this week",
                        icon: "figure.walk",
                        color: theme.secondary
                    )
                    AnalyticsStatCard(
                        title: "Active Minutes",
                        value: "\(totalActiveMinutes)",
                        subtitle: "this week",
                        icon: "clock.fill",
                        color: Color.orange
                    )
                }
                .padding(.horizontal, 20)

                // ── Recent Workouts Section ───────────────────────────────
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(theme.primary)
                        Text("Recent Workouts")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                    }

                    if recentLogs.isEmpty {
                        Text("No workouts logged yet.")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(AppColors.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                    } else {
                        ForEach(recentLogs) { log in
                            RecentWorkoutRow(log: log)
                        }
                    }
                }
                .padding(20)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 20)

                // ── Weekly Steps Bar Chart ────────────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 8) {
                        Image(systemName: "figure.walk")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(theme.secondary)
                        Text("Weekly Steps")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                    }

                    let maxSteps = max(progress.weeklySteps.max() ?? 1, 1)
                    HStack(alignment: .bottom, spacing: 8) {
                        ForEach(0 ..< 7, id: \.self) { i in
                            let val = progress.weeklySteps[i]
                            let fraction = Double(val) / Double(maxSteps)
                            VStack(spacing: 6) {
                                if i == 6 {
                                    Text(formatK(val))
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(theme.primary)
                                } else {
                                    Color.clear.frame(height: 14)
                                }
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(i == 6 ? theme.primary : theme.primary.opacity(0.35))
                                    .frame(height: max(8, CGFloat(fraction) * 80))
                                    .animation(.easeOut(duration: 0.6).delay(Double(i) * 0.05), value: val)
                                Text(weekDays[i])
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(i == 6 ? theme.primary : AppColors.textTertiary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 120)
                }
                .padding(20)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 20)

                // ── Cardio Progress Ring Card ─────────────────────────────
                CardioProgressCard(
                    fraction: progress.cardioProgressFraction,
                    totalMinutes: totalActiveMinutes
                )
                .padding(.horizontal, 20)
                .padding(.bottom, 150)
            }
        }
        .background(AppColors.background.ignoresSafeArea())
        .navigationBarHidden(true)
    }

    // MARK: - Helpers

    private func formatLargeNumber(_ n: Int) -> String {
        if n >= 1_000_000 {
            return String(format: "%.1fM", Double(n) / 1_000_000)
        } else if n >= 1_000 {
            return String(format: "%.1fK", Double(n) / 1_000)
        }
        return "\(n)"
    }

    private func formatK(_ n: Int) -> String {
        n >= 1000 ? String(format: "%.1fK", Double(n) / 1000) : "\(n)"
    }
}

// MARK: - Analytics Stat Card

private struct AnalyticsStatCard: View {
    @EnvironmentObject private var theme: ThemeStore
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.15))
                    .frame(width: 38, height: 38)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(color)
            }
            Text(value)
                .font(.system(size: 28, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(AppColors.textSecondary)
                Text(subtitle)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(color)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(AppRadius.pill)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.pill)
                .stroke(color.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Recent Workout Row

private struct RecentWorkoutRow: View {
    @EnvironmentObject private var theme: ThemeStore
    let log: WorkoutLog

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(theme.primaryGlow)
                    .frame(width: 44, height: 44)
                Image(systemName: "dumbbell.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(theme.primary)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(log.templateName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                    .lineLimit(1)
                Text(formatDate(log.date))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppColors.textSecondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                Text("\(log.durationMinutes) min")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                Text("\(log.caloriesBurned) kcal")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(theme.tertiary)
            }
        }
        .padding(14)
        .background(AppColors.surfaceLight)
        .cornerRadius(16)
    }
}

// MARK: - Cardio Progress Card

private struct CardioProgressCard: View {
    @EnvironmentObject private var theme: ThemeStore
    let fraction: Double
    let totalMinutes: Int

    var body: some View {
        VStack(spacing: 20) {

            // Teal gradient accent bar at top
            LinearGradient(
                colors: [theme.primary, theme.secondary],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 3)
            .cornerRadius(999)
            .padding(.horizontal, 40)
            .padding(.top, 20)

            Text("Weekly Cardio Goal")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)

            // Large progress ring
            ZStack {
                Circle()
                    .stroke(theme.primary.opacity(0.15), lineWidth: 22)
                    .frame(width: 168, height: 168)

                Circle()
                    .trim(from: 0, to: fraction)
                    .stroke(
                        AngularGradient(
                            colors: [theme.primary, theme.secondary, theme.primary],
                            center: .center,
                            startAngle: .degrees(-90),
                            endAngle: .degrees(270)
                        ),
                        style: StrokeStyle(lineWidth: 22, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 168, height: 168)
                    .animation(.easeOut(duration: 1.2), value: fraction)

                VStack(spacing: 2) {
                    Text("\(Int(fraction * 100))%")
                        .font(AppType.screenTitle)
                        .foregroundColor(AppColors.textPrimary)
                    Text("complete")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)
                }
            }

            // Subtitle: "{totalMins}/150 min"
            Text("\(totalMinutes) / 150 min")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(theme.primary)

            Text("WHO recommends 150 min of moderate cardio per week")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(AppColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
        }
        .frame(maxWidth: .infinity)
        .background(AppColors.surface)
        .cornerRadius(AppRadius.card)
        .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
    }
}
