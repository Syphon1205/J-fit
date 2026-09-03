import SwiftUI
import Combine

// MARK: - Theme Preset
enum ThemePreset: String, CaseIterable, Codable {
    case noir, classic, punchy, earthy, studio, solar

    var displayName: String {
        switch self {
        case .noir:    return "Noir"
        case .classic: return "Classic"
        case .punchy:  return "Punchy"
        case .earthy:  return "Earthy"
        case .studio:  return "Studio"
        case .solar:   return "Solar"
        }
    }

    var primaryColor: Color {
        switch self {
        case .noir:    return Color(hex: "8FB996")
        case .classic: return Color(hex: "00E5C7")
        case .punchy:  return Color(hex: "F97316")
        case .earthy:  return Color(hex: "6FA84F")
        case .studio:  return Color(hex: "F8FAFC")
        case .solar:   return Color(hex: "FACC15")
        }
    }

    var secondaryColor: Color {
        switch self {
        case .noir:    return Color(hex: "7BA7C7")
        case .classic: return Color(hex: "A78BFA")
        case .punchy:  return Color(hex: "0EA5E9")
        case .earthy:  return Color(hex: "C2A878")
        case .studio:  return Color(hex: "38BDF8")
        case .solar:   return Color(hex: "14B8A6")
        }
    }

    var tertiaryColor: Color {
        switch self {
        case .noir:    return Color(hex: "C28B75")
        case .classic: return Color(hex: "FF6B9D")
        case .punchy:  return Color(hex: "EC4899")
        case .earthy:  return Color(hex: "8D6E63")
        case .studio:  return Color(hex: "FB7185")
        case .solar:   return Color(hex: "F43F5E")
        }
    }

    var swatchHex: String {
        switch self {
        case .noir:    return "8FB996"
        case .classic: return "00E5C7"
        case .punchy:  return "F97316"
        case .earthy:  return "6FA84F"
        case .studio:  return "F8FAFC"
        case .solar:   return "FACC15"
        }
    }
}

// MARK: - Theme Store
class ThemeStore: ObservableObject {
    static let shared = ThemeStore()

    @Published var preset: ThemePreset = .noir {
        didSet { save() }
    }
    @Published var isDark: Bool = true {
        didSet { save() }
    }

    // Resolved accent colors (update whenever preset changes)
    var primary: Color   { preset.primaryColor }
    var secondary: Color { preset.secondaryColor }
    var tertiary: Color  { preset.tertiaryColor }
    var primaryGlow: Color { primary.opacity(0.15) }
    var secondaryGlow: Color { secondary.opacity(0.15) }

    private init() { load() }

    func load() {
        if let p = UserDefaults.standard.string(forKey: "cf_theme_preset"),
           let decoded = ThemePreset(rawValue: p) {
            preset = decoded
        }
        isDark = UserDefaults.standard.bool(forKey: "cf_theme_dark") != false
    }

    func save() {
        UserDefaults.standard.set(preset.rawValue, forKey: "cf_theme_preset")
        UserDefaults.standard.set(isDark, forKey: "cf_theme_dark")
    }
}
