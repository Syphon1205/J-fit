import SwiftUI
import HealthKit

@main
struct CunninghamFitnessApp: App {
    @StateObject private var auth = AuthStore.shared
    @StateObject private var workouts = WorkoutStore.shared
    @StateObject private var nutrition = NutritionStore.shared
    @StateObject private var progress = ProgressStore.shared
    @StateObject private var runs = RunStore.shared
    @StateObject private var health = HealthStore.shared
    @StateObject private var theme = ThemeStore.shared
    @AppStorage("app_theme_mode") private var themeMode = 0 // 0: System, 1: Light, 2: Dark
    
    // Notifications setup via App Delegate Adaptor
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    private var colorScheme: ColorScheme? {
        if themeMode == 1 { return .light }
        if themeMode == 2 { return .dark }
        return nil
    }
    
    var body: some Scene {
        WindowGroup {
            if auth.isSignedIn {
                ContentView()
                    .environmentObject(auth)
                    .environmentObject(workouts)
                    .environmentObject(nutrition)
                    .environmentObject(progress)
                    .environmentObject(runs)
                    .environmentObject(health)
                    .environmentObject(theme)
                    .preferredColorScheme(colorScheme)
            } else {
                SignInView()
                    .environmentObject(auth)
                    .environmentObject(theme)
                    .preferredColorScheme(colorScheme)
            }
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // Initialize the delegate without interrupting launch. Notification
        // permission belongs beside a reminder action, where its value is clear.
        _ = NotificationManager.shared
        return true
    }
}
