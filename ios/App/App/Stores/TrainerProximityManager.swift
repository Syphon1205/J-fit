import Foundation
import Network
import UIKit

// MARK: - Models

struct TrainerMetricPayload: Codable, Identifiable {
    let protocolVersion: Int
    let athlete: Athlete
    let capturedAt: String
    let health: HealthSnapshot?
    let training: TrainingSnapshot
    let flags: [String]

    var id: String { athlete.id }
}

struct Athlete: Codable {
    let id: String
    let name: String
    let goal: String
    let deviceId: String
}

struct HealthSnapshot: Codable {
    let stepsToday: Int
    let distanceKmToday: Double?
    let activeCaloriesToday: Int?
    let heartRateBpm: Int?
    let restingHeartRateBpm: Int?
    let hrvMs: Int?
    let sleepHours: Double?
    let sourceLabel: String
    let syncedAt: String
}

struct TrainingSnapshot: Codable {
    let workoutsCompleted: Int
    let weeklyWorkoutMinutes: [Int]
    let weeklySteps: [Int]
    let weeklyCalories: [Int]
    let recentRuns: [RunSummary]
    let recentWorkouts: [WorkoutSummary]
    let weightHistory: [WeightPoint]
}

struct WorkoutSummary: Codable, Identifiable {
    var id: String { "\(date)-\(title)" }
    let date: String
    let title: String
    let source: String
    let durationMinutes: Int
    let calories: Int
    let type: String
}

struct RunSummary: Codable, Identifiable {
    var id: String { "\(date)-\(distanceKm)" }
    let date: String
    let distanceKm: Double
    let durationSeconds: Int
    let avgPaceMinKm: Double
    let calories: Int
}

struct WeightPoint: Codable, Identifiable {
    var id: String { date }
    let date: String
    let kg: Double
}

// MARK: - Manager

enum TrainerSyncStatus: String {
    case idle = "Not Connected"
    case advertising = "Searching for Trainer..."
    case connecting = "Connecting..."
    case connected = "Connected"
    case synced = "Metrics Synced"
    case error = "Error"
}

class TrainerProximityManager: NSObject, ObservableObject {
    static let shared = TrainerProximityManager()
    
    @Published var status: TrainerSyncStatus = .idle
    @Published var errorMessage: String? = nil
    
    private var listener: NWListener?
    private var activeConnection: NWConnection?
    private var activePayloadData: Data?
    
    func startAdvertising(payload: TrainerMetricPayload) {
        stopAdvertising()
        
        do {
            activePayloadData = try JSONEncoder().encode(payload)
        } catch {
            status = .error
            errorMessage = "Failed to encode metrics"
            return
        }
        
        do {
            let parameters = NWParameters.tcp
            listener = try NWListener(using: parameters)
            
            // Advertise on a standard Bonjour service type so Android can see it via NSD
            listener?.service = NWListener.Service(name: UIDevice.current.name, type: "_cfsync._tcp")
            
            listener?.stateUpdateHandler = { [weak self] state in
                DispatchQueue.main.async {
                    switch state {
                    case .ready:
                        self?.status = .advertising
                    case .failed(let error):
                        self?.status = .error
                        self?.errorMessage = error.localizedDescription
                    default:
                        break
                    }
                }
            }
            
            listener?.newConnectionHandler = { [weak self] connection in
                self?.handleNewConnection(connection)
            }
            
            listener?.start(queue: .main)
        } catch {
            status = .error
            errorMessage = "Failed to start local network service"
        }
    }
    
    func stopAdvertising() {
        listener?.cancel()
        listener = nil
        activeConnection?.cancel()
        activeConnection = nil
        
        if status != .synced {
            status = .idle
        }
    }
    
    private func handleNewConnection(_ connection: NWConnection) {
        activeConnection = connection
        
        connection.stateUpdateHandler = { [weak self] state in
            DispatchQueue.main.async {
                guard let self = self else { return }
                switch state {
                case .ready:
                    self.status = .connected
                    self.sendPayload()
                case .failed(let error):
                    self.status = .error
                    self.errorMessage = error.localizedDescription
                default:
                    break
                }
            }
        }
        
        connection.start(queue: .main)
    }
    
    private func sendPayload() {
        guard let connection = activeConnection, let data = activePayloadData else { return }
        
        // Simple framing: send length then data. But for a simple prototype where we close connection after, just send data
        connection.send(content: data, completion: .contentProcessed({ [weak self] error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.status = .error
                    self?.errorMessage = error.localizedDescription
                } else {
                    self?.status = .synced
                }
            }
        }))
    }
}
