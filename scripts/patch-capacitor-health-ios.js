const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'capacitor-health',
  'ios',
  'Sources',
  'HealthPluginPlugin',
  'HealthPlugin.swift'
);

if (!fs.existsSync(filePath)) {
  console.warn('[patch-capacitor-health-ios] capacitor-health Swift file not found; skipping.');
  process.exit(0);
}

let source = fs.readFileSync(filePath, 'utf8');

let changed = false;

const before = `    @objc func requestHealthPermissions(_ call: CAPPluginCall) {
        guard let permissions = call.getArray("permissions") as? [String] else {
            call.reject("Invalid permissions format")
            return
        }`;

const after = `    @objc func requestHealthPermissions(_ call: CAPPluginCall) {
        func normalizePermissions(_ value: Any?) -> [String]? {
            if let strings = value as? [String] {
                return strings
            }
            if let array = value as? [Any] {
                let strings = array.compactMap { $0 as? String }
                return strings.isEmpty ? nil : strings
            }
            if let object = value as? [String: Any] {
                return normalizePermissions(object["permissions"] ?? object["read"])
            }
            return nil
        }

        let directPermissions = normalizePermissions(call.getArray("permissions"))
        let nestedPermissions = normalizePermissions(call.getObject("permissions"))
        let optionPermissions = normalizePermissions(call.options)

        guard let permissions = directPermissions ?? nestedPermissions ?? optionPermissions else {
            call.reject("Invalid permissions format")
            return
        }`;

if (source.includes(before)) {
  source = source.replace(before, after);
  changed = true;
} else if (source.includes('let directPermissions = call.getArray("permissions") as? [String]')) {
  source = source.replace(
    /    @objc func requestHealthPermissions\(_ call: CAPPluginCall\) \{\n        let directPermissions = call\.getArray\("permissions"\) as\? \[String\]\n        let nestedPermissions = call\.getObject\("permissions"\)\?\["permissions"\] as\? \[String\]\n\n        guard let permissions = directPermissions \?\? nestedPermissions else \{\n            call\.reject\("Invalid permissions format"\)\n            return\n        \}/,
    after
  );
  changed = true;
} else if (!source.includes('func normalizePermissions(_ value: Any?) -> [String]?')) {
  console.warn('[patch-capacitor-health-ios] Expected Swift block not found; skipping.');
}

const aggregateBefore = `        case "active-calories":
            return HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)
        default:
            return nil
        }`;

const aggregateAfter = `        case "active-calories":
            return HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)
        case "distance":
            return HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)
        default:
            return nil
        }`;

if (source.includes(aggregateBefore)) {
  source = source.replace(aggregateBefore, aggregateAfter);
  changed = true;
}

const distanceValueBefore = `                        } else if(dataTypeString == "active-calories" && dataType.is(compatibleWith: HKUnit.kilocalorie())) {
                            value = sum.doubleValue(for: HKUnit.kilocalorie())
                        } else if(dataTypeString == "mindfulness" && dataType.is(compatibleWith: HKUnit.second())) {`;

const distanceValueAfter = `                        } else if(dataTypeString == "active-calories" && dataType.is(compatibleWith: HKUnit.kilocalorie())) {
                            value = sum.doubleValue(for: HKUnit.kilocalorie())
                        } else if(dataTypeString == "distance" && dataType.is(compatibleWith: HKUnit.meter())) {
                            value = sum.doubleValue(for: HKUnit.meter())
                        } else if(dataTypeString == "mindfulness" && dataType.is(compatibleWith: HKUnit.second())) {`;

if (source.includes(distanceValueBefore)) {
  source = source.replace(distanceValueBefore, distanceValueAfter);
  changed = true;
}

const permissionBefore = `        case "READ_MINDFULNESS":
            return [HKObjectType.categoryType(forIdentifier: .mindfulSession)!].compactMap{$0}
        default:
            return []
        }`;

const permissionAfter = `        case "READ_MINDFULNESS":
            return [HKObjectType.categoryType(forIdentifier: .mindfulSession)!].compactMap{$0}
        case "READ_SLEEP":
            return [HKObjectType.categoryType(forIdentifier: .sleepAnalysis)].compactMap{$0}
        case "READ_RESTING_HEART_RATE":
            return [HKObjectType.quantityType(forIdentifier: .restingHeartRate)].compactMap{$0}
        case "READ_HRV":
            return [HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)].compactMap{$0}
        case "READ_BODY_WEIGHT":
            return [HKObjectType.quantityType(forIdentifier: .bodyMass)].compactMap{$0}
        default:
            return []
        }`;

if (source.includes(permissionBefore)) {
  source = source.replace(permissionBefore, permissionAfter);
  changed = true;
}

const emptyTypesGuardBefore = `        let types: [HKObjectType] = permissions.flatMap { permissionToHKObjectType($0) }
        
        healthStore.requestAuthorization(toShare: nil, read: Set(types)) { success, error in`;

const emptyTypesGuardAfter = `        let types: [HKObjectType] = permissions.flatMap { permissionToHKObjectType($0) }
        guard !types.isEmpty else {
            call.reject("No supported HealthKit permissions were requested")
            return
        }
        
        healthStore.requestAuthorization(toShare: nil, read: Set(types)) { success, error in`;

if (source.includes(emptyTypesGuardBefore)) {
  source = source.replace(emptyTypesGuardBefore, emptyTypesGuardAfter);
  changed = true;
}

const permissionSwitchBefore = `        switch permission {
        case "READ_STEPS":
            return [HKObjectType.quantityType(forIdentifier: .stepCount)].compactMap{$0}
        case "READ_ACTIVE_CALORIES":
            return [HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)].compactMap{$0}
        case "READ_WORKOUTS":
            return [HKObjectType.workoutType()].compactMap{$0}
        case "READ_HEART_RATE":
            return  [HKObjectType.quantityType(forIdentifier: .heartRate)].compactMap{$0}
        case "READ_ROUTE":
            return  [HKSeriesType.workoutRoute()].compactMap{$0}
        case "READ_DISTANCE":
            return [
                HKObjectType.quantityType(forIdentifier: .distanceCycling),
                HKObjectType.quantityType(forIdentifier: .distanceSwimming),
                HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning),
                HKObjectType.quantityType(forIdentifier: .distanceDownhillSnowSports)
            ].compactMap{$0}
        case "READ_MINDFULNESS":
            return [HKObjectType.categoryType(forIdentifier: .mindfulSession)!].compactMap{$0}
        case "READ_SLEEP":
            return [HKObjectType.categoryType(forIdentifier: .sleepAnalysis)].compactMap{$0}
        case "READ_RESTING_HEART_RATE":
            return [HKObjectType.quantityType(forIdentifier: .restingHeartRate)].compactMap{$0}
        case "READ_HRV":
            return [HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)].compactMap{$0}
        case "READ_BODY_WEIGHT":
            return [HKObjectType.quantityType(forIdentifier: .bodyMass)].compactMap{$0}
        default:
            return []
        }`;

const permissionSwitchAfter = `        switch permission.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() {
        case "READ_STEPS", "STEPS", "STEP_COUNT":
            return [HKObjectType.quantityType(forIdentifier: .stepCount)].compactMap{$0}
        case "READ_ACTIVE_CALORIES", "READ_CALORIES", "ACTIVE_CALORIES", "ACTIVE_ENERGY", "ACTIVEENERGYBURNED":
            return [HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)].compactMap{$0}
        case "READ_WORKOUTS", "WORKOUTS", "WORKOUT":
            return [HKObjectType.workoutType()].compactMap{$0}
        case "READ_HEART_RATE", "HEART_RATE", "HEARTRATE":
            return  [HKObjectType.quantityType(forIdentifier: .heartRate)].compactMap{$0}
        case "READ_ROUTE", "ROUTE", "WORKOUT_ROUTE":
            return  [HKSeriesType.workoutRoute()].compactMap{$0}
        case "READ_DISTANCE", "DISTANCE", "DISTANCE_WALKING_RUNNING":
            return [
                HKObjectType.quantityType(forIdentifier: .distanceCycling),
                HKObjectType.quantityType(forIdentifier: .distanceSwimming),
                HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning),
                HKObjectType.quantityType(forIdentifier: .distanceDownhillSnowSports)
            ].compactMap{$0}
        case "READ_MINDFULNESS", "MINDFULNESS", "MINDFUL_SESSION":
            return [HKObjectType.categoryType(forIdentifier: .mindfulSession)!].compactMap{$0}
        case "READ_SLEEP", "SLEEP", "SLEEP_ANALYSIS", "SLEEPANALYSIS":
            return [HKObjectType.categoryType(forIdentifier: .sleepAnalysis)].compactMap{$0}
        case "READ_RESTING_HEART_RATE", "RESTING_HEART_RATE", "RESTINGHEARTRATE":
            return [HKObjectType.quantityType(forIdentifier: .restingHeartRate)].compactMap{$0}
        case "READ_HRV", "HRV", "HEART_RATE_VARIABILITY", "HEARTRATEVARIABILITYSDNN":
            return [HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)].compactMap{$0}
        case "READ_BODY_WEIGHT", "BODY_WEIGHT", "BODY_MASS", "BODYMASS", "WEIGHT":
            return [HKObjectType.quantityType(forIdentifier: .bodyMass)].compactMap{$0}
        default:
            return []
        }`;

if (source.includes(permissionSwitchBefore)) {
  source = source.replace(permissionSwitchBefore, permissionSwitchAfter);
  changed = true;
}

const aggregateSpecialBefore = `        if(dataTypeString == "mindfulness") {
            self.queryMindfulnessAggregated(startDate: startDate, endDate: endDate) {result, error in
                    if let error = error {
                    call.reject(error.localizedDescription)
                } else if let result = result {
                    call.resolve(["aggregatedData": result])
                }
            }
        } else {`;

const aggregateSpecialAfter = `        if(dataTypeString == "mindfulness") {
            self.queryMindfulnessAggregated(startDate: startDate, endDate: endDate) {result, error in
                    if let error = error {
                    call.reject(error.localizedDescription)
                } else if let result = result {
                    call.resolve(["aggregatedData": result])
                }
            }
            return
        }

        if(dataTypeString == "sleep") {
            self.querySleepAggregated(startDate: startDate, endDate: endDate, bucket: bucket) {result, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else if let result = result {
                    call.resolve(["aggregatedData": result])
                }
            }
            return
        }

        if(["heart-rate", "resting-heart-rate", "hrv", "body-weight"].contains(dataTypeString)) {
            self.queryQuantityAverageAggregated(startDate: startDate, endDate: endDate, dataTypeString: dataTypeString, bucket: bucket) {result, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else if let result = result {
                    call.resolve(["aggregatedData": result])
                }
            }
            return
        }

        do {`;

if (source.includes(aggregateSpecialBefore)) {
  source = source.replace(aggregateSpecialBefore, aggregateSpecialAfter);
  changed = true;
}

const helperAnchor = `    @objc func queryRecords(_ call: CAPPluginCall) {`;
const helperBlock = `    func querySleepAggregated(startDate: Date, endDate: Date, bucket: String, completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion([], nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            if let error = error {
                completion(nil, error)
                return
            }

            var dailyDurations: [Date: TimeInterval] = [:]
            let calendar = Calendar.current

            samples?.forEach { sample in
                guard let categorySample = sample as? HKCategorySample else { return }
                let isAsleep = categorySample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
                guard isAsleep else { return }
                let day = calendar.startOfDay(for: categorySample.startDate)
                dailyDurations[day, default: 0] += categorySample.endDate.timeIntervalSince(categorySample.startDate)
            }

            let aggregatedSamples = dailyDurations
                .sorted { $0.key < $1.key }
                .map { (day, duration) -> [String: Any] in
                    [
                        "startDate": day.timeIntervalSince1970 * 1000,
                        "endDate": (calendar.date(byAdding: .day, value: 1, to: day) ?? day).timeIntervalSince1970 * 1000,
                        "value": duration / 3600
                    ]
                }
            completion(aggregatedSamples, nil)
        }

        healthStore.execute(query)
    }

    func quantityAverageConfig(_ dataTypeString: String) -> (HKQuantityTypeIdentifier, HKUnit)? {
        switch dataTypeString {
        case "heart-rate":
            return (.heartRate, HKUnit.count().unitDivided(by: HKUnit.minute()))
        case "resting-heart-rate":
            return (.restingHeartRate, HKUnit.count().unitDivided(by: HKUnit.minute()))
        case "hrv":
            return (.heartRateVariabilitySDNN, HKUnit.secondUnit(with: .milli))
        case "body-weight":
            return (.bodyMass, HKUnit.gramUnit(with: .kilo))
        default:
            return nil
        }
    }

    func queryQuantityAverageAggregated(startDate: Date, endDate: Date, dataTypeString: String, bucket: String, completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let config = quantityAverageConfig(dataTypeString),
              let quantityType = HKObjectType.quantityType(forIdentifier: config.0),
              let interval = calculateInterval(bucket: bucket) else {
            completion([], nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKStatisticsCollectionQuery(
            quantityType: quantityType,
            quantitySamplePredicate: predicate,
            options: [.discreteAverage],
            anchorDate: startDate,
            intervalComponents: interval
        )

        query.initialResultsHandler = { _, result, error in
            if let error = error {
                completion(nil, error)
                return
            }

            var aggregatedSamples: [[String: Any]] = []
            result?.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                if let average = statistics.averageQuantity() {
                    aggregatedSamples.append([
                        "startDate": statistics.startDate.timeIntervalSince1970 * 1000,
                        "endDate": statistics.endDate.timeIntervalSince1970 * 1000,
                        "value": average.doubleValue(for: config.1)
                    ])
                }
            }
            completion(aggregatedSamples, nil)
        }

        healthStore.execute(query)
    }

`;

if (source.includes(helperAnchor) && !source.includes('func querySleepAggregated(startDate: Date')) {
  source = source.replace(helperAnchor, helperBlock + helperAnchor);
  changed = true;
}

const ios16SleepStageBefore = `                let isAsleep = categorySample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
                    || categorySample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue
                    || categorySample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue
                    || categorySample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
                    || categorySample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue`;
const ios14SleepStageAfter = `                let isAsleep = categorySample.value == HKCategoryValueSleepAnalysis.asleep.rawValue`;

if (source.includes(ios16SleepStageBefore)) {
  source = source.replace(ios16SleepStageBefore, ios14SleepStageAfter);
  changed = true;
}

const mindfulnessDateWarningBefore = `"endDate": calendar.date(byAdding: dayComponent, to: dateAndDuration.key),`;
const mindfulnessDateWarningAfter = `"endDate": (calendar.date(byAdding: dayComponent, to: dateAndDuration.key) ?? dateAndDuration.key) as Any,`;

if (source.includes(mindfulnessDateWarningBefore)) {
  source = source.replace(mindfulnessDateWarningBefore, mindfulnessDateWarningAfter);
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log('[patch-capacitor-health-ios] Applied iOS health patches.');
} else {
  console.log('[patch-capacitor-health-ios] iOS health patches already applied.');
}
