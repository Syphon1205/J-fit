import Foundation
import HealthKit
import Combine

struct HealthWorkoutRecord: Identifiable, Equatable {
    let id: UUID
    let activity: String
    let symbol: String
    let startedAt: Date
    let durationMinutes: Int
    let activeCalories: Int?
}

class HealthStore: ObservableObject {
    static let shared = HealthStore()
    private let store = HKHealthStore()
    private let connectionKey = "healthConnectionRequested"

    @Published var stepsToday: Int = 0
    @Published var activeCaloriesToday: Int = 0
    @Published var heartRate: Int = 0
    @Published var sleepHoursLastNight: Double = 0.0
    @Published var workoutsCountThisWeek: Int = 0
    @Published var recentWorkouts: [HealthWorkoutRecord] = []
    
    @Published var authorized: Bool = false

    // Health authorization is requested from a contextual user action. Prompting
    // during launch makes the permission feel unexplained and blocks Home.
    private init() {
        authorized = UserDefaults.standard.bool(forKey: connectionKey)
        if authorized {
            DispatchQueue.main.async { [weak self] in self?.sync() }
        }
    }

    func requestAuthorization() {
        guard let steps = HKObjectType.quantityType(forIdentifier: .stepCount),
              let calories = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
              let hr = HKObjectType.quantityType(forIdentifier: .heartRate),
              let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return }
              
        let workoutType = HKObjectType.workoutType()
        
        let reads: Set<HKObjectType> = [steps, calories, hr, sleep, workoutType]
        let writes: Set<HKSampleType> = [workoutType]
        
        store.requestAuthorization(toShare: writes, read: reads) { [weak self] success, _ in
            DispatchQueue.main.async {
                self?.authorized = success
                if success {
                    UserDefaults.standard.set(true, forKey: self?.connectionKey ?? "healthConnectionRequested")
                    self?.sync()
                }
            }
        }
    }

    func sync() {
        guard HKHealthStore.isHealthDataAvailable(), authorized else { return }
        querySteps()
        queryCalories()
        queryHeartRate()
        querySleep()
        queryWorkouts()
    }

    private func querySteps() {
        guard let type = HKObjectType.quantityType(forIdentifier: .stepCount) else { return }
        let pred = HKQuery.predicateForSamples(withStart: Calendar.current.startOfDay(for: Date()), end: Date())
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { [weak self] _, stats, _ in
            let steps = Int(stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0)
            DispatchQueue.main.async {
                self?.stepsToday = steps
                ProgressStore.shared.updateToday(steps: steps)
            }
        }
        store.execute(query)
    }

    private func queryCalories() {
        guard let type = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) else { return }
        let pred = HKQuery.predicateForSamples(withStart: Calendar.current.startOfDay(for: Date()), end: Date())
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { [weak self] _, stats, _ in
            let cal = Int(stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0)
            DispatchQueue.main.async {
                self?.activeCaloriesToday = cal
                ProgressStore.shared.updateToday(calories: cal)
            }
        }
        store.execute(query)
    }

    private func queryHeartRate() {
        guard let type = HKObjectType.quantityType(forIdentifier: .heartRate) else { return }
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            let bpm = Int(sample.quantity.doubleValue(for: HKUnit(from: "count/min")))
            DispatchQueue.main.async { self?.heartRate = bpm }
        }
        store.execute(query)
    }

    private func querySleep() {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return }
        
        // Fetch sleep for the last 24 hours
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: endDate)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, error in
            guard let samples = samples as? [HKCategorySample], error == nil else { return }
            
            // Calculate total asleep time
            let totalSleepTime = samples
                .filter { sample in
                    if #available(iOS 16.0, *) {
                        return sample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                               sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                               sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue ||
                               sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue
                    } else {
                        return sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
                    }
                }
                .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
            
            DispatchQueue.main.async {
                self?.sleepHoursLastNight = totalSleepTime / 3600.0
            }
        }
        store.execute(query)
    }

    private func queryWorkouts() {
        let workoutType = HKObjectType.workoutType()
        
        // One query powers both the recent log and the current weekly summary.
        var calendar = Calendar.current
        calendar.firstWeekday = 2 // Monday
        guard let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())) else { return }
        let historyStart = calendar.date(byAdding: .day, value: -90, to: Date()) ?? startOfWeek
        let predicate = HKQuery.predicateForSamples(withStart: historyStart, end: Date(), options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: 100, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, error in
            guard let workouts = samples as? [HKWorkout], error == nil else { return }
            let weekly = workouts.filter { $0.startDate >= startOfWeek }
            var minutesByDay = Array(repeating: 0, count: 7)
            for workout in weekly {
                let weekday = calendar.component(.weekday, from: workout.startDate)
                let index = (weekday + 5) % 7
                minutesByDay[index] += Int((workout.duration / 60).rounded())
            }
            let records = workouts.map { workout in
                let presentation = Self.activityPresentation(for: workout.workoutActivityType)
                let calories = workout.totalEnergyBurned.map {
                    Int($0.doubleValue(for: .kilocalorie()).rounded())
                }
                return HealthWorkoutRecord(
                    id: workout.uuid,
                    activity: presentation.name,
                    symbol: presentation.symbol,
                    startedAt: workout.startDate,
                    durationMinutes: Int((workout.duration / 60).rounded()),
                    activeCalories: calories
                )
            }
            DispatchQueue.main.async {
                self?.workoutsCountThisWeek = weekly.count
                self?.recentWorkouts = records
                ProgressStore.shared.setHealthWorkoutMinutes(minutesByDay)
            }
        }
        store.execute(query)
    }

    private static func activityPresentation(for type: HKWorkoutActivityType) -> (name: String, symbol: String) {
        switch type {
        case .running: return ("Run", "figure.run")
        case .walking: return ("Walk", "figure.walk")
        case .cycling: return ("Cycling", "figure.outdoor.cycle")
        case .traditionalStrengthTraining, .functionalStrengthTraining:
            return ("Strength", "dumbbell.fill")
        case .highIntensityIntervalTraining: return ("HIIT", "bolt.fill")
        case .yoga: return ("Yoga", "figure.yoga")
        case .swimming: return ("Swim", "figure.pool.swim")
        case .hiking: return ("Hike", "figure.hiking")
        default: return ("Workout", "figure.mixed.cardio")
        }
    }
    
    // Save a new workout to HealthKit
    func saveWorkout(duration: TimeInterval, distance: Double, calories: Double) {
        guard HKHealthStore.isHealthDataAvailable(), authorized else { return }
        
        let end = Date()
        let start = end.addingTimeInterval(-duration)
        
        let energy = HKQuantity(unit: .kilocalorie(), doubleValue: calories)
        let dist = HKQuantity(unit: .meter(), doubleValue: distance)
        
        let workout = HKWorkout(activityType: .running, start: start, end: end, duration: duration, totalEnergyBurned: energy, totalDistance: dist, metadata: nil)
        
        store.save(workout) { [weak self] success, error in
            if success {
                self?.sync() // refresh counts
            }
        }
    }
}
