import SwiftUI

struct ProgressView: View {
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var health: HealthStore
    @EnvironmentObject private var theme: ThemeStore
    @State private var showGoalSheet = false
    @State private var showNoteSheet = false
    @State private var editingGoal: FitnessGoal?

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(alignment: .leading, spacing: 18) {
                header
                summary
                goalsSection
                healthWorkoutsSection
                notesSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 54)
            .padding(.bottom, 150)
        }
        .background(AppColors.background.ignoresSafeArea())
        .onAppear { health.sync() }
        .sheet(isPresented: $showGoalSheet) { AddGoalSheet() }
        .sheet(isPresented: $showNoteSheet) { AddNoteSheet() }
        .sheet(item: $editingGoal) { goal in GoalUpdateSheet(goal: goal) }
    }

    private var header: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Progress")
                    .font(AppType.screenTitle)
                    .foregroundColor(AppColors.textPrimary)
                Text("Workouts, goals, and notes in one place")
                    .font(AppType.body)
                    .foregroundColor(AppColors.textSecondary)
            }
            Spacer()
            Button { health.sync() } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(theme.primary)
                    .frame(width: 38, height: 38)
                    .background(AppColors.elevated, in: Circle())
                    .overlay(Circle().stroke(AppColors.border))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Refresh Apple Health")
        }
    }

    private var summary: some View {
        HStack(spacing: 10) {
            CompactMetric(value: "\(health.workoutsCountThisWeek)", label: "Workouts", tint: theme.primary)
            CompactMetric(value: "\(progress.totalWorkoutMinutes)", label: "Minutes", tint: theme.secondary)
            CompactMetric(value: "\(progress.goals.count)", label: "Goals", tint: theme.tertiary)
        }
    }

    private var goalsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Goals", actionTitle: "New goal", symbol: "plus") { showGoalSheet = true }

            if progress.goals.isEmpty {
                emptyState(
                    symbol: "target",
                    title: "Set a goal",
                    detail: "Write down what you’re working toward and log progress as you go."
                )
            } else {
                ForEach(progress.goals) { goal in
                    Button { editingGoal = goal } label: {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(goal.title)
                                        .font(AppType.cardTitle)
                                        .foregroundColor(AppColors.textPrimary)
                                    Text("\(number(goal.current)) of \(number(goal.target)) \(goal.unit)")
                                        .font(AppType.callout)
                                        .foregroundColor(AppColors.textSecondary)
                                }
                                Spacer()
                                Text("\(Int(goalProgress(goal) * 100))%")
                                    .font(AppType.callout)
                                    .foregroundColor(theme.primary)
                            }
                            GeometryReader { proxy in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(AppColors.surfaceLight)
                                    Capsule()
                                        .fill(theme.primary)
                                        .frame(width: proxy.size.width * goalProgress(goal))
                                }
                            }
                            .frame(height: 5)
                        }
                        .padding(14)
                        .progressSurface()
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button(role: .destructive) { progress.removeGoal(goal) } label: {
                            Label("Delete Goal", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }

    private var healthWorkoutsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Apple Health Workouts")

            if !health.authorized {
                Button { health.requestAuthorization() } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "heart.text.square.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(theme.tertiary)
                            .frame(width: 38, height: 38)
                            .background(theme.tertiary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Connect Apple Health")
                                .font(AppType.cardTitle)
                                .foregroundColor(AppColors.textPrimary)
                            Text("Import workouts recorded by iPhone and Apple Watch")
                                .font(AppType.callout)
                                .foregroundColor(AppColors.textSecondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(AppColors.textTertiary)
                    }
                    .padding(14)
                    .progressSurface()
                }
                .buttonStyle(.plain)
            } else if health.recentWorkouts.isEmpty {
                emptyState(
                    symbol: "figure.run",
                    title: "No Health workouts yet",
                    detail: "New workouts recorded in Apple Health will appear here automatically."
                )
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(health.recentWorkouts.prefix(12).enumerated()), id: \.element.id) { index, workout in
                        HealthWorkoutRow(workout: workout, tint: theme.primary)
                        if index < min(health.recentWorkouts.count, 12) - 1 {
                            Divider().padding(.leading, 58)
                        }
                    }
                }
                .progressSurface()
            }
        }
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Progress Notes", actionTitle: "Write", symbol: "square.and.pencil") {
                showNoteSheet = true
            }
            if progress.notes.isEmpty {
                emptyState(
                    symbol: "note.text",
                    title: "Start a progress log",
                    detail: "Capture wins, setbacks, measurements, or what you want to remember."
                )
            } else {
                ForEach(progress.notes.prefix(8)) { note in
                    VStack(alignment: .leading, spacing: 7) {
                        Text(note.text)
                            .font(AppType.body)
                            .foregroundColor(AppColors.textPrimary)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(note.createdAt.formatted(date: .abbreviated, time: .shortened))
                            .font(AppType.caption)
                            .foregroundColor(AppColors.textTertiary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .progressSurface()
                }
            }
        }
    }

    private func sectionHeader(
        _ title: String,
        actionTitle: String? = nil,
        symbol: String = "plus",
        action: @escaping () -> Void = {}
    ) -> some View {
        HStack {
            Text(title)
                .font(AppType.sectionTitle)
                .foregroundColor(AppColors.textPrimary)
            Spacer()
            if let actionTitle {
                Button(action: action) {
                    Label(actionTitle, systemImage: symbol)
                        .font(AppType.callout)
                        .foregroundColor(theme.primary)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func emptyState(symbol: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(theme.primary)
                .frame(width: 38, height: 38)
                .background(theme.primary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(AppType.cardTitle).foregroundColor(AppColors.textPrimary)
                Text(detail).font(AppType.callout).foregroundColor(AppColors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .progressSurface()
    }

    private func goalProgress(_ goal: FitnessGoal) -> CGFloat {
        guard goal.target > 0 else { return 0 }
        return CGFloat(min(max(goal.current / goal.target, 0), 1))
    }

    private func number(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(value.rounded() == value ? 0 : 1)))
    }
}

private struct CompactMetric: View {
    let value: String
    let label: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(AppType.metric).foregroundColor(AppColors.textPrimary)
            Text(label).font(AppType.caption).foregroundColor(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(13)
        .progressSurface()
    }
}

private struct HealthWorkoutRow: View {
    let workout: HealthWorkoutRecord
    let tint: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: workout.symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(tint)
                .frame(width: 38, height: 38)
                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 3) {
                Text(workout.activity).font(AppType.cardTitle).foregroundColor(AppColors.textPrimary)
                Text(workout.startedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(AppType.caption)
                    .foregroundColor(AppColors.textTertiary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                Text("\(workout.durationMinutes) min")
                    .font(AppType.callout)
                    .foregroundColor(AppColors.textPrimary)
                if let calories = workout.activeCalories {
                    Text("\(calories) kcal")
                        .font(AppType.caption)
                        .foregroundColor(AppColors.textSecondary)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
    }
}

private struct AddGoalSheet: View {
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var target = ""
    @State private var unit = "times"

    var body: some View {
        NavigationStack {
            Form {
                Section("Goal") {
                    TextField("Run three times each week", text: $title)
                    TextField("Target", text: $target).keyboardType(.decimalPad)
                    TextField("Unit", text: $unit)
                }
            }
            .navigationTitle("New Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        progress.addGoal(title: title, target: Double(target) ?? 0, unit: unit)
                        dismiss()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || (Double(target) ?? 0) <= 0)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

private struct GoalUpdateSheet: View {
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss
    let goal: FitnessGoal
    @State private var value = ""

    var body: some View {
        NavigationStack {
            Form {
                Section(goal.title) {
                    TextField("Current \(goal.unit)", text: $value).keyboardType(.decimalPad)
                    Text("Target: \(goal.target.formatted()) \(goal.unit)")
                        .foregroundColor(AppColors.textSecondary)
                }
            }
            .navigationTitle("Log Progress")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { value = goal.current.formatted() }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        progress.setGoalValue(goal, value: Double(value) ?? goal.current)
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

private struct AddNoteSheet: View {
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss
    @State private var text = ""

    var body: some View {
        NavigationStack {
            TextEditor(text: $text)
                .font(AppType.body)
                .padding(12)
                .navigationTitle("Progress Note")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            progress.addNote(text)
                            dismiss()
                        }
                        .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
        }
        .presentationDetents([.medium, .large])
    }
}

private extension View {
    func progressSurface() -> some View {
        self
            .background(AppColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(AppColors.border, lineWidth: 0.75))
            .shadow(color: Color.black.opacity(0.05), radius: 9, y: 4)
    }
}
