import SwiftUI

// MARK: - Dynamic Color Helper
extension Color {
    static func dynamic(light: String, dark: String) -> Color {
        return Color(UIColor { trait in
            if trait.userInterfaceStyle == .dark {
                return UIColor(Color(hex: dark))
            } else {
                return UIColor(Color(hex: light))
            }
        })
    }
}

// MARK: - Design Tokens
enum AppColors {
    static let background   = Color.dynamic(light: "F2F2F7", dark: "000000")
    static let surface      = Color.dynamic(light: "FFFFFF", dark: "1C1C1E")
    static let surfaceLight = Color.dynamic(light: "E9E9EE", dark: "2C2C2E")
    static let elevated     = Color.dynamic(light: "FFFFFF", dark: "242426")
    static let primary      = Color(hex: "8FB996")   // quiet sage
    static let secondary    = Color(hex: "7BA7C7")   // muted sky
    static let tertiary     = Color(hex: "C28B75")   // warm clay
    static let textPrimary  = Color.dynamic(light: "111113", dark: "F5F5F7")
    static let textSecondary = Color.dynamic(light: "636366", dark: "AEAEB2")
    static let textTertiary  = Color.dynamic(light: "8E8E93", dark: "636366")
    
    static let border       = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(white: 1.0, alpha: 0.07) : UIColor(white: 0.0, alpha: 0.06)
    })
    
    static let primaryGlow  = Color(hex: "8FB996").opacity(0.12)
    static let secondaryGlow = Color(hex: "7BA7C7").opacity(0.12)
    static let success      = Color(hex: "7DE28A")
    static let warning      = Color(hex: "FFB84D")
    static let error        = Color(hex: "FF6577")
}

// MARK: - Corner Radii
enum AppRadius {
    static let card: CGFloat = 22
    static let pill: CGFloat = 18
    static let input: CGFloat = 16
    static let tag: CGFloat  = 999
}

// SF Pro is the native system face on Apple platforms. Keeping the scale here
// prevents screens from drifting into unrelated sizes and weights.
enum AppType {
    static let screenTitle = Font.system(size: 28, weight: .semibold, design: .default)
    static let sectionTitle = Font.system(size: 18, weight: .semibold, design: .default)
    static let cardTitle = Font.system(size: 16, weight: .semibold, design: .default)
    static let body = Font.system(size: 15, weight: .regular, design: .default)
    static let callout = Font.system(size: 13, weight: .medium, design: .default)
    static let caption = Font.system(size: 11, weight: .medium, design: .default)
    static let metric = Font.system(size: 24, weight: .semibold, design: .rounded)
}

// MARK: - Color from hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r)/255, green: Double(g)/255, blue: Double(b)/255, opacity: Double(a)/255)
    }
}

// MARK: - View Modifiers
extension View {
    func glassCard(padding: CGFloat = 18) -> some View {
        self
            .padding(padding)
            .background(AppColors.surface)
            .cornerRadius(AppRadius.card)
            .overlay(RoundedRectangle(cornerRadius: AppRadius.card).stroke(AppColors.border, lineWidth: 1))
    }
}
