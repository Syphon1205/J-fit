import Foundation
import UserNotifications

class NotificationManager: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()
    
    @Published var isAuthorized = false
    
    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                self.isAuthorized = granted
            }
        }
    }
    
    func scheduleWorkoutReminder() {
        // Trigger at 5 PM if no workout logged
        var dateComponents = DateComponents()
        dateComponents.hour = 17
        dateComponents.minute = 0
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        
        let content = UNMutableNotificationContent()
        content.title = "Time to move!"
        content.body = "You haven't logged a workout today. Let's get some reps in."
        content.sound = .default
        
        let request = UNNotificationRequest(identifier: "daily_workout_reminder", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
    
    func cancelWorkoutReminder() {
        // Call this when a workout is logged today
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["daily_workout_reminder"])
    }
    
    func sendWorkoutCompletionNotification(workoutName: String, durationMinutes: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Workout Complete \u{1F3C6}"
        content.body = "You crushed \(workoutName) for \(durationMinutes) minutes! Keep it up."
        content.sound = .default
        
        // Trigger immediately (in 1 second)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    // Show notification while app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}
