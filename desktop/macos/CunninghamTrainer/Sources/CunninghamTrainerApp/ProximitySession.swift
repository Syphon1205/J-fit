import Foundation
import Network

final class ProximitySession: ObservableObject {
    @Published var status = "Idle"
    @Published var discoveredPeers: [NWBrowser.Result] = []
    @Published var activePayload: TrainerMetricPayload = .preview
    
    private var browser: NWBrowser?
    private var activeConnection: NWConnection?
    
    func findClients() {
        status = "Searching for local devices..."
        discoveredPeers.removeAll()
        
        let parameters = NWParameters.tcp
        let browser = NWBrowser(for: .bonjour(type: "_cfsync._tcp", domain: "local."), using: parameters)
        
        browser.stateUpdateHandler = { [weak self] state in
            DispatchQueue.main.async {
                switch state {
                case .ready:
                    self?.status = "Browsing for local clients..."
                case .failed(let error):
                    self?.status = "Browse failed: \(error.localizedDescription)"
                default:
                    break
                }
            }
        }
        
        browser.browseResultsChangedHandler = { [weak self] results, _ in
            DispatchQueue.main.async {
                self?.discoveredPeers = Array(results)
            }
        }
        
        browser.start(queue: .main)
        self.browser = browser
    }
    
    func stop() {
        browser?.cancel()
        browser = nil
        status = "Idle"
    }
    
    func invite(_ peer: NWBrowser.Result) {
        if case let .service(name, _, _, _) = peer.endpoint {
            status = "Connecting to \(name)..."
        } else {
            status = "Connecting..."
        }
        
        let connection = NWConnection(to: peer.endpoint, using: .tcp)
        self.activeConnection = connection
        
        connection.stateUpdateHandler = { [weak self] state in
            DispatchQueue.main.async {
                switch state {
                case .ready:
                    self?.status = "Connected"
                    self?.receivePayload()
                case .failed(let error):
                    self?.status = "Connection failed: \(error.localizedDescription)"
                default:
                    break
                }
            }
        }
        
        connection.start(queue: .main)
    }
    
    private func receivePayload() {
        guard let connection = activeConnection else { return }
        
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, context, isComplete, error in
            DispatchQueue.main.async {
                if let data = data, let payload = try? JSONDecoder().decode(TrainerMetricPayload.self, from: data) {
                    self?.activePayload = payload
                    self?.status = "Metrics synced from \(payload.athlete.name)"
                } else if let error = error {
                    self?.status = "Receive error: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func loadPreviewClient() {
        activePayload = .preview
        status = "Preview client loaded"
    }
}
