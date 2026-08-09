//
//  ProfileView.swift
//  App
//
//  User profile screen with avatar, stats, daily goal steppers,
//  app info rows, and a sign-out button.
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var workouts: WorkoutStore
    @EnvironmentObject private var nutrition: NutritionStore
    @EnvironmentObject private var runs: RunStore
    
    @StateObject private var trainerSync = TrainerProximityManager.shared

    @State private var calGoal: Int = 2400
    @State private var proteinGoal: Int = 180
    @State private var waterGoal: Int = 8
    
    @AppStorage("app_theme_mode") private var themeMode = 0 // 0: System, 1: Light, 2: Dark
    
    @State private var showEditProfile = false
    @State private var editName = ""
    @State private var editEmail = ""
    @State private var showSignOutAlert = false
    @State private var savedBadge = false
    
    // MARK: - Actions

    private func pairWithTrainer() {
        if trainerSync.status != .idle {
            trainerSync.stopAdvertising()
            return
        }
        
        let healthData = HealthStore.shared
        let progressData = ProgressStore.shared
        let runData = RunStore.shared
        
        let healthSnap = HealthSnapshot(
            stepsToday: healthData.stepsToday,
            distanceKmToday: Double(healthData.stepsToday) * 0.0007,
            activeCaloriesToday: healthData.activeCaloriesToday,
            heartRateBpm: healthData.heartRate,
            restingHeartRateBpm: 60,
            hrvMs: 65,
            sleepHours: healthData.sleepHoursLastNight,
            sourceLabel: "Apple Health",
            syncedAt: ISO8601DateFormatter().string(from: Date())
        )
        
        let trainingSnap = TrainingSnapshot(
            workoutsCompleted: healthData.workoutsCountThisWeek,
            weeklyWorkoutMinutes: progressData.weeklyWorkoutMinutes,
            weeklySteps: progressData.weeklySteps,
            weeklyCalories: progressData.weeklyCalories,
            recentRuns: runData.runs.prefix(5).map { r in 
                RunSummary(date: DateFormatter.localizedString(from: r.date, dateStyle: .short, timeStyle: .none), distanceKm: r.distanceMiles * 1.60934, durationSeconds: r.durationMinutes * 60, avgPaceMinKm: 5.0, calories: r.calories) 
            },
            recentWorkouts: workouts.logs.prefix(5).map { w in
                WorkoutSummary(date: DateFormatter.localizedString(from: w.date, dateStyle: .short, timeStyle: .none), title: w.templateName, source: "Cunningham Fitness", durationMinutes: w.durationMinutes, calories: w.caloriesBurned, type: "Strength")
            },
            weightHistory: []
        )
        
        let payload = TrainerMetricPayload(
            protocolVersion: 1,
            athlete: Athlete(
                id: auth.user?.id ?? "user_1", 
                name: auth.user?.name ?? "Athlete", 
                goal: "General Fitness", 
                deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "device"
            ),
            capturedAt: ISO8601DateFormatter().string(from: Date()),
            health: healthSnap,
            training: trainingSnap,
            flags: ["iOS Native Sync"]
        )
        
        trainerSync.startAdvertising(payload: payload)
    }

    private func saveProfile() {
        if !editName.isEmpty { auth.user?.name = editName }
        if !editEmail.isEmpty { auth.user?.email = editEmail }
        savedBadge = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { savedBadge = false }
    }

    // MARK: - Body

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 22) {

                // ── Avatar + Name + Email ────────────────────────────────
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [theme.primary.opacity(0.25), theme.secondary.opacity(0.15)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 88, height: 88)
                        Circle()
                            .stroke(theme.primary.opacity(0.4), lineWidth: 2)
                            .frame(width: 88, height: 88)
                        Text(auth.user?.avatarLetter ?? "A")
                            .font(.system(size: 38, weight: .semibold))
                            .foregroundColor(theme.primary)
                    }

                    Text(auth.user?.name ?? "Athlete")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)

                    Text(auth.user?.email ?? "athlete@jfit.app")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 60)
                .padding(.bottom, 6)
                
                Button(action: {
                    editName = auth.user?.name ?? ""
                    editEmail = auth.user?.email ?? ""
                    showEditProfile = true
                }) {
                    Text("Edit Profile")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(AppColors.surfaceLight)
                        .cornerRadius(999)
                }
                .padding(.bottom, 12)

                // ── Quick Stats Row (3 stats) ────────────────────────────
                HStack(spacing: 12) {
                    ProfileMiniStat(value: "\(workouts.logs.count)", label: "Workouts")
                    ProfileMiniStat(value: "\(runs.runs.count)", label: "Runs")
                    ProfileMiniStat(
                        value: "\(min(workouts.logs.count + runs.runs.count, 30))",
                        label: "Active Days"
                    )
                }
                .padding(.horizontal, 18)

                // ── Section: Goals ───────────────────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    ProfileSectionHeader(title: "Goals", icon: "target")

                    GoalStepperRow(
                        label: "Daily Calories",
                        unit: "kcal",
                        value: $calGoal,
                        range: 1200...5000,
                        step: 100
                    )
                    Divider().background(AppColors.border)

                    GoalStepperRow(
                        label: "Protein",
                        unit: "g",
                        value: $proteinGoal,
                        range: 50...300,
                        step: 5
                    )
                    Divider().background(AppColors.border)

                    GoalStepperRow(
                        label: "Water",
                        unit: "cups",
                        value: $waterGoal,
                        range: 4...16,
                        step: 1
                    )

                    // Save button
                    Button {
                        nutrition.goals = DailyGoals(
                            calories: calGoal,
                            protein: proteinGoal,
                            carbs: nutrition.goals.carbs,
                            fat: nutrition.goals.fat,
                            water: waterGoal
                        )
                        nutrition.save()
                        withAnimation(.spring()) { savedBadge = true }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                            withAnimation { savedBadge = false }
                        }
                    } label: {
                        HStack(spacing: 8) {
                            if savedBadge {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 15, weight: .bold))
                            }
                            Text(savedBadge ? "Saved!" : "Save Goals")
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundColor(AppColors.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(savedBadge ? Color.green : theme.primary)
                        .cornerRadius(999)
                        .animation(.spring(response: 0.3), value: savedBadge)
                    }
                    .padding(.top, 4)
                }
                .padding(18)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 18)
                .onAppear {
                    calGoal = nutrition.goals.calories
                    proteinGoal = nutrition.goals.protein
                    waterGoal = nutrition.goals.water
                }

                // ── Section: Theme ───────────────────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    ProfileSectionHeader(title: "Appearance", icon: "paintbrush.fill")

                    Picker("Mode", selection: $themeMode) {
                        Text("System").tag(0)
                        Text("Light").tag(1)
                        Text("Dark").tag(2)
                    }
                    .pickerStyle(.segmented)
                    .padding(.bottom, 8)
                    
                    Text("Accent Color")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 20) {
                            ForEach(ThemePreset.allCases, id: \.self) { preset in
                                Button {
                                    withAnimation(.spring()) {
                                        theme.preset = preset
                                    }
                                } label: {
                                    VStack(spacing: 8) {
                                        ZStack {
                                            Circle()
                                                .fill(preset.primaryColor)
                                                .frame(width: 44, height: 44)
                                            if theme.preset == preset {
                                                Circle()
                                                    .stroke(AppColors.textPrimary, lineWidth: 2)
                                                    .frame(width: 52, height: 52)
                                            }
                                        }
                                        Text(preset.displayName)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(theme.preset == preset ? AppColors.textPrimary : AppColors.textSecondary)
                                    }
                                }
                                .padding(.vertical, 8)
                            }
                        }
                        .padding(.horizontal, 4)
                    }
                }
                .padding(18)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 18)

                // ── Section: App ─────────────────────────────────────────
                VStack(alignment: .leading, spacing: 0) {
                    ProfileSectionHeader(title: "App", icon: "gearshape.fill")
                        .padding(.bottom, 10)

                    // Sign In with Apple row
                    AppInfoRow(
                        icon: "apple.logo",
                        label: "Sign In with Apple",
                        trailing: auth.isSignedIn
                            ? AnyView(
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(theme.primary)
                              )
                            : AnyView(
                                Text("Not Connected")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(AppColors.textSecondary)
                              )
                    )

                    Divider()
                        .background(AppColors.border)
                        .padding(.leading, 56)

                    // Version row
                    AppInfoRow(
                        icon: "info.circle.fill",
                        label: "Version",
                        trailing: AnyView(
                            Text("1.0.0")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(AppColors.textSecondary)
                        )
                    )
                    

                }
                .padding(18)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 18)

                // ── Trainer Proximity Sync ────────────────────────────────
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(theme.primary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Trainer Nearby Sync")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppColors.textPrimary)
                            Text("Share your metrics with the trainer desktop app.")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(AppColors.textSecondary)
                        }
                    }
                    
                    VStack(spacing: 16) {
                        HStack {
                            if trainerSync.status == .advertising || trainerSync.status == .connecting {
                                ProgressView().scaleEffect(0.8)
                            }
                            Text(trainerSync.status == .advertising ? "Searching for trainer..." : trainerSync.status.rawValue)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(trainerSync.status == .idle ? AppColors.textSecondary : theme.primary)
                            Spacer()
                        }
                        
                        if trainerSync.status == .idle || trainerSync.status == .error || trainerSync.status == .synced {
                            Button(action: pairWithTrainer) {
                                Text("Sync with Trainer Desktop")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(AppColors.background)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(theme.primary)
                                    .cornerRadius(12)
                            }
                        } else {
                            Button(action: pairWithTrainer) {
                                Text("Stop Sync")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(AppColors.textPrimary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(AppColors.surfaceLight)
                                    .cornerRadius(12)
                            }
                        }
                    }
                    .padding(14)
                    .background(AppColors.background)
                    .cornerRadius(12)
                }
                .padding(18)
                .background(AppColors.surface)
                .cornerRadius(AppRadius.card)
                .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border))
                .padding(.horizontal, 18)

                // ── Sign Out Button ───────────────────────────────────────
                Button { showSignOutAlert = true } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.system(size: 16, weight: .bold))
                        Text("Sign Out")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(Color.red)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(999)
                    .overlay(RoundedRectangle(cornerRadius: 999).stroke(Color.red.opacity(0.25)))
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 150)
            }
        }
        .background(AppColors.background.ignoresSafeArea())
        .navigationBarHidden(true)
        .alert(isPresented: $showSignOutAlert) {
            Alert(
                title: Text("Sign Out?"),
                primaryButton: .destructive(Text("Sign Out")) { auth.signOut() },
                secondaryButton: .cancel()
            )
        }
        .sheet(isPresented: $showEditProfile) {
            NavigationView {
                VStack(spacing: 20) {
                    TextField("Name", text: $editName)
                        .font(.system(size: 17, weight: .semibold))
                        .padding(16)
                        .background(AppColors.surface)
                        .cornerRadius(12)
                        
                    TextField("Email", text: $editEmail)
                        .font(.system(size: 17, weight: .semibold))
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(16)
                        .background(AppColors.surface)
                        .cornerRadius(12)
                    
                    Spacer()
                }
                .padding(24)
                .background(AppColors.background.ignoresSafeArea())
                .navigationTitle("Edit Profile")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { showEditProfile = false }
                            .foregroundColor(theme.primary)
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Save") {
                            if var user = auth.user {
                                user.name = editName
                                user.email = editEmail
                                auth.user = user
                                // If we want to persist we should add an auth.save(user) but auth.signIn does it or we can just re-save it.
                                // For now, we will just call signIn again to overwrite
                                auth.signIn(name: editName, email: editEmail)
                            }
                            showEditProfile = false
                        }
                        .foregroundColor(theme.primary)
                        .font(.headline)
                    }
                }
                .preferredColorScheme(.dark)
            }
        }
    }
}

// MARK: - Profile Mini Stat

private struct ProfileMiniStat: View {
    @EnvironmentObject private var theme: ThemeStore
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 26, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(AppColors.surface)
        .cornerRadius(AppRadius.pill)
        .overlay(RoundedRectangle(cornerRadius: AppRadius.pill).stroke(AppColors.border))
    }
}

// MARK: - Section Header

private struct ProfileSectionHeader: View {
    @EnvironmentObject private var theme: ThemeStore
    let title: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(theme.primary)
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(AppColors.textSecondary)
                .textCase(.uppercase)
        }
    }
}

// MARK: - Goal Stepper Row

private struct GoalStepperRow: View {
    @EnvironmentObject private var theme: ThemeStore
    let label: String
    let unit: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    let step: Int

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                Text("\(value) \(unit)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(theme.primary)
            }
            Spacer()
            HStack(spacing: 14) {
                Button {
                    if value - step >= range.lowerBound {
                        value -= step
                    }
                } label: {
                    Image(systemName: "minus")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(AppColors.textPrimary)
                        .frame(width: 38, height: 38)
                        .background(AppColors.surfaceLight)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border))
                }

                Button {
                    if value + step <= range.upperBound {
                        value += step
                    }
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(theme.primary)
                        .frame(width: 38, height: 38)
                        .background(theme.primaryGlow)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.primary.opacity(0.3)))
                }
            }
        }
        .padding(.vertical, 6)
    }
}

// MARK: - App Info Row

private struct AppInfoRow: View {
    @EnvironmentObject private var theme: ThemeStore
    let icon: String
    let label: String
    let trailing: AnyView

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(theme.primaryGlow)
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(theme.primary)
            }
            Text(label)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
            Spacer()
            trailing
        }
        .padding(.vertical, 10)
    }
}
