//
//  WorkoutsView.swift
//  App
//
//  Native SwiftUI replica of Workouts.native.tsx.
//  Shows workout template list; tapping "Start" launches ActiveWorkoutView sheet.
//

import SwiftUI

// MARK: - WorkoutsView

struct WorkoutsView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var workouts: WorkoutStore

    @State private var showActiveWorkout = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 14) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Workouts")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text("Your training programs")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 12)

                // Hero banner
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [theme.primary, theme.secondary],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 54, height: 54)
                        Image(systemName: "dumbbell.fill")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Rep Logger")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                        Text("Save sets by date. Review what got done.")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(AppColors.textSecondary)
                    }
                    Spacer()
                }
                .padding(18)
                .background(
                    LinearGradient(
                        colors: [theme.primary.opacity(0.15), theme.secondary.opacity(0.10)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border, lineWidth: 1))

                // Metric strip
                HStack(spacing: 10) {
                    metricTile(icon: "dumbbell.fill",   label: "Programs",    value: "\(workouts.templates.count)")
                    metricTile(icon: "clock.fill",       label: "Active logs", value: "\(workouts.logs.count)")
                    metricTile(icon: "flame.fill",       label: "Sessions",    value: "\(workouts.logs.count)")
                }

                // Workout cards
                LazyVStack(spacing: 14) {
                    ForEach(workouts.templates) { template in
                        WorkoutCard(template: template) {
                            workouts.startWorkout(template)
                            showActiveWorkout = true
                        }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 150)
        }
        .background(AppColors.background.ignoresSafeArea())
        .sheet(isPresented: $showActiveWorkout) {
            ActiveWorkoutView(isPresented: $showActiveWorkout)
                .environmentObject(workouts)
        }
    }

    private func metricTile(icon: String, label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(theme.primary)
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(AppColors.textSecondary)
            Text(value)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
        }
        .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
        .padding(13)
        .background(AppColors.surface)
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(AppColors.border, lineWidth: 1))
    }
}

// MARK: - Workout Card

private struct WorkoutCard: View {
    @EnvironmentObject private var theme: ThemeStore
    let template: WorkoutTemplate
    let onStart: () -> Void

    private var categoryIcon: String {
        switch template.category.lowercased() {
        case "hiit":       return "bolt.fill"
        case "cardio":     return "figure.run"
        case "yoga":       return "leaf.fill"
        case "flexibility": return "figure.flexibility"
        default:           return "figure.strengthtraining.traditional"
        }
    }

    private var difficultyColor: Color {
        switch template.difficulty.lowercased() {
        case "beginner":     return theme.primary
        case "intermediate": return theme.secondary
        case "advanced":     return theme.tertiary
        default:             return AppColors.textSecondary
        }
    }

    var body: some View {
        VStack(spacing: 14) {
            // Top row
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: template.colorHex).opacity(0.8), Color(hex: template.colorHex)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 52, height: 52)
                    Image(systemName: categoryIcon)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(template.name)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text(template.category)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(hex: template.colorHex))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color(hex: template.colorHex).opacity(0.15))
                        .cornerRadius(999)
                }
                Spacer()
            }

            // Stats row
            HStack(spacing: 8) {
                statPill(icon: "list.bullet", text: "\(template.exercises.count) exercises")
                statPill(icon: "clock",        text: "\(template.durationMinutes) min")
                statPill(icon: "chart.bar.fill", text: template.difficulty, color: difficultyColor)
            }

            // Start button
            Button(action: onStart) {
                Text("START WORKOUT")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .background(theme.primary)
                    .cornerRadius(AppRadius.pill)
            }
        }
        .padding(20)
        .background(AppColors.surface)
        .cornerRadius(AppRadius.card)
        .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border, lineWidth: 1))
    }

    private func statPill(icon: String, text: String, color: Color = AppColors.textSecondary) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .bold))
            Text(text)
                .font(.system(size: 12, weight: .semibold))
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(AppColors.surfaceLight)
        .cornerRadius(999)
    }
}

// MARK: - Active Workout Sheet

struct ActiveWorkoutView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var workouts: WorkoutStore
    @Binding var isPresented: Bool

    // Timer display derived from workouts.activeSeconds
    private var timerDisplay: String {
        let s = workouts.activeSeconds
        let mm = s / 60
        let ss = s % 60
        return String(format: "%02d:%02d", mm, ss)
    }

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(workouts.activeWorkout?.name ?? "Workout")
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(AppColors.textPrimary)
                        Text(workouts.activeWorkout?.category ?? "")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(AppColors.textSecondary)
                    }
                    Spacer()
                    Button {
                        workouts.cancelWorkout()
                        isPresented = false
                    } label: {
                        ZStack {
                            Circle()
                                .fill(AppColors.surfaceLight)
                                .frame(width: 40, height: 40)
                            Image(systemName: "xmark")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(AppColors.textPrimary)
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
                .padding(.bottom, 24)

                // Timer
                VStack(spacing: 4) {
                    Text(timerDisplay)
                        .font(.system(size: 72, weight: .semibold, design: .monospaced))
                        .foregroundColor(theme.primary)
                    Text("elapsed")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)
                }
                .padding(.bottom, 32)

                // Ring progress
                ZStack {
                    RingView(
                        progress: min(1.0, Double(workouts.activeSeconds) / Double((workouts.activeWorkout?.durationMinutes ?? 30) * 60)),
                        size: 120
                    )
                    Text("\(Int(min(100, Double(workouts.activeSeconds) / Double((workouts.activeWorkout?.durationMinutes ?? 30) * 60) * 100)))%")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                }
                .padding(.bottom, 32)

                // Exercise list
                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 10) {
                        ForEach(workouts.activeWorkout?.exercises ?? []) { exercise in
                            HStack(spacing: 14) {
                                ZStack {
                                    Circle()
                                        .fill(theme.primaryGlow)
                                        .frame(width: 40, height: 40)
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(theme.primary)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(exercise.name)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(AppColors.textPrimary)
                                    Text("\(exercise.sets) sets × \(exercise.reps) reps\(exercise.weight > 0 ? " · \(Int(exercise.weight)) \(exercise.unit)" : "")")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(AppColors.textSecondary)
                                }
                                Spacer()
                            }
                            .padding(14)
                            .background(AppColors.surfaceLight)
                            .cornerRadius(20)
                        }
                    }
                    .padding(.horizontal, 24)
                }

                Spacer()

                // Finish button
                Button {
                    workouts.endWorkout()
                    isPresented = false
                } label: {
                    Text("FINISH WORKOUT")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(theme.primary)
                        .cornerRadius(AppRadius.pill)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .preferredColorScheme(.dark)
    }
}
