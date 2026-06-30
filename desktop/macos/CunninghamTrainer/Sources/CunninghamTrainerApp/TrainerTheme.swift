import SwiftUI

enum TrainerThemePreset: String, CaseIterable, Identifiable {
    case noir = "Noir"
    case classic = "Classic"
    case punchy = "Punchy"
    case studio = "Studio"
    case solar = "Solar"

    var id: String { rawValue }
}

struct TrainerPalette {
    let name: String
    let background: Color
    let panel: Color
    let elevated: Color
    let field: Color
    let border: Color
    let text: Color
    let muted: Color
    let inverseText: Color
    let accent: Color
    let secondary: Color
    let tertiary: Color
    let gradient: [Color]

    static func palette(for preset: TrainerThemePreset) -> TrainerPalette {
        switch preset {
        case .noir:
            return .init(name: preset.rawValue, background: Color(hex: 0x050507), panel: Color(hex: 0x0D0D10), elevated: Color(hex: 0x15151A), field: Color(hex: 0x09090C), border: .white.opacity(0.10), text: .white, muted: Color(hex: 0xA7A9B4), inverseText: .white, accent: Color(hex: 0xFF2D7A), secondary: Color(hex: 0xF97316), tertiary: Color(hex: 0x00E5C7), gradient: [Color(hex: 0xFF2D7A), Color(hex: 0xF97316)])
        case .classic:
            return .init(name: preset.rawValue, background: Color(hex: 0x061012), panel: Color(hex: 0x0C171A), elevated: Color(hex: 0x132226), field: Color(hex: 0x081316), border: .white.opacity(0.11), text: .white, muted: Color(hex: 0xA9B7BC), inverseText: Color(hex: 0x061012), accent: Color(hex: 0x00E5C7), secondary: Color(hex: 0xA78BFA), tertiary: Color(hex: 0xFF6B9D), gradient: [Color(hex: 0x00E5C7), Color(hex: 0xA78BFA)])
        case .punchy:
            return .init(name: preset.rawValue, background: Color(hex: 0x07080B), panel: Color(hex: 0x101119), elevated: Color(hex: 0x191B25), field: Color(hex: 0x0B0C12), border: .white.opacity(0.10), text: .white, muted: Color(hex: 0xA9ADBA), inverseText: .white, accent: Color(hex: 0xF97316), secondary: Color(hex: 0x0EA5E9), tertiary: Color(hex: 0xEC4899), gradient: [Color(hex: 0xF97316), Color(hex: 0xEC4899)])
        case .studio:
            return .init(name: preset.rawValue, background: Color(hex: 0x07090D), panel: Color(hex: 0x10141A), elevated: Color(hex: 0x1A2028), field: Color(hex: 0x0B0E13), border: .white.opacity(0.12), text: .white, muted: Color(hex: 0xAEB7C2), inverseText: Color(hex: 0x07090D), accent: Color(hex: 0xF8FAFC), secondary: Color(hex: 0x38BDF8), tertiary: Color(hex: 0xFB7185), gradient: [Color(hex: 0xF8FAFC), Color(hex: 0x38BDF8)])
        case .solar:
            return .init(name: preset.rawValue, background: Color(hex: 0x080807), panel: Color(hex: 0x111009), elevated: Color(hex: 0x1E1B10), field: Color(hex: 0x0C0B07), border: .white.opacity(0.11), text: .white, muted: Color(hex: 0xB8B09D), inverseText: Color(hex: 0x080807), accent: Color(hex: 0xFACC15), secondary: Color(hex: 0x14B8A6), tertiary: Color(hex: 0xF43F5E), gradient: [Color(hex: 0xFACC15), Color(hex: 0x14B8A6)])
        }
    }
}

extension Color {
    init(hex: UInt, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

struct TrainerPanel<Content: View>: View {
    let palette: TrainerPalette
    let padding: CGFloat
    @ViewBuilder var content: Content

    init(_ palette: TrainerPalette, padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.palette = palette
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(palette.panel)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(palette.border))
    }
}
