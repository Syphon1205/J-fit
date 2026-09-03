//
//  RunStore.swift
//  App
//
//  ObservableObject singleton managing saved runs.
//  Pre-seeded with 4 realistic demo runs across San Francisco and San Jose.
//

import Foundation
import Combine

// MARK: - Models

struct Coordinate: Codable {
    var lat: Double
    var lng: Double
}

struct SavedRun: Codable, Identifiable {
    var id: String = UUID().uuidString
    var name: String
    var date: Date
    var distanceMiles: Double
    var durationMinutes: Int
    var avgPacePerMile: String   // e.g. "8:32"
    var calories: Int
    var city: String
    var route: [Coordinate]
}

// MARK: - RunStore

final class RunStore: ObservableObject {

    static let shared = RunStore()

    @Published var runs: [SavedRun] = []

    private let runsKey = "cf_runs"

    private init() {
        load()
    }

    // MARK: - Persistence

    func save() {
        if let data = try? JSONEncoder().encode(runs) {
            UserDefaults.standard.set(data, forKey: runsKey)
        }
    }

    func load() {
        if let data = UserDefaults.standard.data(forKey: runsKey),
           let decoded = try? JSONDecoder().decode([SavedRun].self, from: data),
           !decoded.isEmpty {
            self.runs = decoded
        } else {
            self.runs = Self.demoRuns()
            save()
        }
    }

    // MARK: - Demo Runs

    private static func demoRuns() -> [SavedRun] {
        let cal = Calendar.current
        let today = Date()

        func daysAgo(_ n: Int) -> Date {
            cal.date(byAdding: .day, value: -n, to: today) ?? today
        }

        return [
            // 1. Golden Gate Morning — Presidio / Golden Gate Bridge area
            SavedRun(
                name: "Golden Gate Morning",
                date: daysAgo(1),
                distanceMiles: 6.2,
                durationMinutes: 54,
                avgPacePerMile: "8:42/mi",
                calories: 580,
                city: "San Francisco",
                route: [
                    Coordinate(lat: 37.8024, lng: -122.4576),
                    Coordinate(lat: 37.8031, lng: -122.4612),
                    Coordinate(lat: 37.8048, lng: -122.4643),
                    Coordinate(lat: 37.8062, lng: -122.4671),
                    Coordinate(lat: 37.8079, lng: -122.4695),
                    Coordinate(lat: 37.8095, lng: -122.4712),
                    Coordinate(lat: 37.8108, lng: -122.4730),
                    Coordinate(lat: 37.8094, lng: -122.4758),
                    Coordinate(lat: 37.8073, lng: -122.4775),
                    Coordinate(lat: 37.8051, lng: -122.4759),
                    Coordinate(lat: 37.8035, lng: -122.4738),
                    Coordinate(lat: 37.8021, lng: -122.4714),
                    Coordinate(lat: 37.8009, lng: -122.4690),
                    Coordinate(lat: 37.8014, lng: -122.4645),
                    Coordinate(lat: 37.8024, lng: -122.4576)
                ]
            ),

            // 2. Bay Trail Sunset — Embarcadero waterfront
            SavedRun(
                name: "Bay Trail Sunset",
                date: daysAgo(3),
                distanceMiles: 4.1,
                durationMinutes: 35,
                avgPacePerMile: "8:32/mi",
                calories: 390,
                city: "San Francisco",
                route: [
                    Coordinate(lat: 37.7955, lng: -122.3937),
                    Coordinate(lat: 37.7968, lng: -122.3921),
                    Coordinate(lat: 37.7982, lng: -122.3907),
                    Coordinate(lat: 37.7996, lng: -122.3894),
                    Coordinate(lat: 37.8010, lng: -122.3882),
                    Coordinate(lat: 37.8024, lng: -122.3873),
                    Coordinate(lat: 37.8037, lng: -122.3865),
                    Coordinate(lat: 37.8048, lng: -122.3856),
                    Coordinate(lat: 37.8036, lng: -122.3870),
                    Coordinate(lat: 37.8020, lng: -122.3882),
                    Coordinate(lat: 37.8004, lng: -122.3896),
                    Coordinate(lat: 37.7988, lng: -122.3910),
                    Coordinate(lat: 37.7972, lng: -122.3922),
                    Coordinate(lat: 37.7960, lng: -122.3930),
                    Coordinate(lat: 37.7955, lng: -122.3937)
                ]
            ),

            // 3. Alum Rock Trail — Alum Rock Park, San Jose
            SavedRun(
                name: "Alum Rock Trail",
                date: daysAgo(5),
                distanceMiles: 5.3,
                durationMinutes: 47,
                avgPacePerMile: "8:52/mi",
                calories: 510,
                city: "San Jose",
                route: [
                    Coordinate(lat: 37.3861, lng: -121.8219),
                    Coordinate(lat: 37.3874, lng: -121.8198),
                    Coordinate(lat: 37.3888, lng: -121.8181),
                    Coordinate(lat: 37.3902, lng: -121.8164),
                    Coordinate(lat: 37.3917, lng: -121.8148),
                    Coordinate(lat: 37.3930, lng: -121.8131),
                    Coordinate(lat: 37.3943, lng: -121.8115),
                    Coordinate(lat: 37.3955, lng: -121.8099),
                    Coordinate(lat: 37.3941, lng: -121.8112),
                    Coordinate(lat: 37.3926, lng: -121.8128),
                    Coordinate(lat: 37.3912, lng: -121.8145),
                    Coordinate(lat: 37.3897, lng: -121.8162),
                    Coordinate(lat: 37.3882, lng: -121.8179),
                    Coordinate(lat: 37.3870, lng: -121.8198),
                    Coordinate(lat: 37.3861, lng: -121.8219)
                ]
            ),

            // 4. Downtown Loop — Downtown San Jose
            SavedRun(
                name: "Downtown Loop",
                date: daysAgo(7),
                distanceMiles: 3.8,
                durationMinutes: 32,
                avgPacePerMile: "8:25/mi",
                calories: 360,
                city: "San Jose",
                route: [
                    Coordinate(lat: 37.3382, lng: -121.8863),
                    Coordinate(lat: 37.3395, lng: -121.8848),
                    Coordinate(lat: 37.3409, lng: -121.8832),
                    Coordinate(lat: 37.3422, lng: -121.8817),
                    Coordinate(lat: 37.3435, lng: -121.8802),
                    Coordinate(lat: 37.3448, lng: -121.8788),
                    Coordinate(lat: 37.3440, lng: -121.8805),
                    Coordinate(lat: 37.3428, lng: -121.8820),
                    Coordinate(lat: 37.3414, lng: -121.8835),
                    Coordinate(lat: 37.3400, lng: -121.8849),
                    Coordinate(lat: 37.3390, lng: -121.8860),
                    Coordinate(lat: 37.3378, lng: -121.8872),
                    Coordinate(lat: 37.3370, lng: -121.8882),
                    Coordinate(lat: 37.3375, lng: -121.8872),
                    Coordinate(lat: 37.3382, lng: -121.8863)
                ]
            )
        ]
    }
}
