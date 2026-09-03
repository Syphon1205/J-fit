import SwiftUI
import WatchConnectivity
import Combine

class SessionDelegator: NSObject, WCSessionDelegate, ObservableObject {
    static let shared = SessionDelegator()
    @Published var activeCalories: Double = 0
    @Published var protein: Double = 0
    @Published var carbs: Double = 0
    @Published var fat: Double = 0
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            if let cal = message["activeCalories"] as? Double { self.activeCalories = cal }
            if let p = message["protein"] as? Double { self.protein = p }
            if let c = message["carbs"] as? Double { self.carbs = c }
            if let f = message["fat"] as? Double { self.fat = f }
        }
    }
}

struct ContentView: View {
    @StateObject private var session = SessionDelegator.shared
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "flame.fill").foregroundColor(.orange).font(.system(size: 24))
                    Text("\(Int(session.activeCalories))").font(.system(.title).weight(.black))
                    Text("kcal").font(.caption2).foregroundColor(.secondary)
                    Spacer()
                }.padding().background(Color.orange.opacity(0.15)).cornerRadius(16)
                
                HStack {
                    MacroCircle(val: session.protein, color: Color(red: 0.42, green: 0.91, blue: 1.0), title: "Pro")
                    Spacer()
                    MacroCircle(val: session.carbs, color: .green, title: "Carb")
                    Spacer()
                    MacroCircle(val: session.fat, color: .red, title: "Fat")
                }.padding().background(Color.white.opacity(0.05)).cornerRadius(16)
                
                Button(action: {}) {
                    Text("START RUN").font(.system(.body).weight(.bold)).foregroundColor(.black)
                }.padding().background(LinearGradient(colors: [.green, Color(red: 0.78, green: 1.0, blue: 0.33)], startPoint: .topLeading, endPoint: .bottomTrailing)).cornerRadius(20)
            }.padding(.horizontal)
        }
    }
}

struct MacroCircle: View {
    let val: Double; let color: Color; let title: String
    var body: some View {
        VStack {
            ZStack {
                Circle().stroke(color.opacity(0.2), lineWidth: 4)
                Circle().trim(from: 0, to: CGFloat(min(val / 100.0, 1.0))).stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round)).rotationEffect(.degrees(-90))
                Text("\(Int(val))").font(.system(.caption).weight(.bold))
            }.frame(width: 40, height: 40)
            Text(title).font(.system(size: 10, weight: .bold)).foregroundColor(color)
        }
    }
}
