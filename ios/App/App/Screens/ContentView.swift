import SwiftUI
import UIKit

enum Tab: Int, Hashable {
    case dashboard, workouts, nutrition, progress, runs, analytics, profile
}

struct ContentView: View {
    @EnvironmentObject private var theme: ThemeStore
    @State private var selectedTab: Tab = .dashboard
    @State private var navCollapsed = false
    @State private var coachRequested = false

    private let tabs: [(Tab, String, String)] = [
        (.dashboard, "Home", "house.fill"),
        (.workouts, "Train", "dumbbell.fill"),
        (.nutrition, "Fuel", "leaf.fill"),
        (.progress, "Progress", "chart.bar.fill"),
        (.profile, "You", "person.crop.circle.fill")
    ]

    init() {
        // This screen owns navigation. Leaving TabView's empty system tab bar
        // visible beneath the custom Liquid Glass dock produces a second,
        // ghost-like capsule during scrolling.
        UITabBar.appearance().isHidden = true
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(rootTab: $selectedTab, coachRequested: $coachRequested)
                .tag(Tab.dashboard)
            WorkoutsView().tag(Tab.workouts)
            NutritionView().tag(Tab.nutrition)
            ProgressView().tag(Tab.progress)
            ProfileView().tag(Tab.profile)
        }
        .toolbar(.hidden, for: .tabBar)
        .tint(theme.primary)
        .overlay(alignment: .bottom) { navigationOverlay }
        .simultaneousGesture(
            DragGesture(minimumDistance: 14)
                .onChanged { value in
                    guard abs(value.translation.height) > abs(value.translation.width) else { return }
                    if value.translation.height < -18, !navCollapsed {
                        withAnimation(.easeOut(duration: 0.18)) {
                            navCollapsed = true
                        }
                    } else if value.translation.height > 22, navCollapsed {
                        withAnimation(.easeOut(duration: 0.18)) {
                            navCollapsed = false
                        }
                    }
                }
        )
    }

    private var navigationOverlay: some View {
        ZStack(alignment: .bottom) {
            HStack {
                compactBubble(symbol: "house.fill", label: "Home") {
                    selectedTab = .dashboard
                }
                Spacer()
            }
            .padding(.horizontal, 18)
            .opacity(navCollapsed ? 1 : 0)
            .offset(y: navCollapsed ? 0 : 12)
            .allowsHitTesting(navCollapsed)

            dock
                .opacity(navCollapsed ? 0 : 1)
                .scaleEffect(navCollapsed ? 0.97 : 1, anchor: .bottom)
                .offset(y: navCollapsed ? 10 : 0)
                .allowsHitTesting(!navCollapsed)
        }
        .overlay(alignment: .bottomTrailing) {
            coachBubble
                .offset(y: navCollapsed ? 0 : -74)
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 8)
        .animation(.easeOut(duration: 0.18), value: navCollapsed)
    }

    private var dock: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.0) { tab, label, symbol in
                Button {
                    withAnimation(.easeOut(duration: 0.2)) { selectedTab = tab }
                } label: {
                    VStack(spacing: 2) {
                        Image(systemName: symbol)
                            .font(.system(size: 16, weight: .semibold))
                        Text(label)
                            .font(.system(size: 9, weight: .medium))
                    }
                    .foregroundColor(selectedTab == tab ? theme.primary : AppColors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(
                        Capsule()
                            .fill(selectedTab == tab ? AppColors.elevated.opacity(0.85) : .clear)
                    )
                }
                .buttonStyle(.plain)
                .accessibilityLabel(label)
            }
        }
        .padding(4)
        .liquidIsland(cornerRadius: 28)
    }

    private var coachBubble: some View {
        Button {
            selectedTab = .dashboard
            coachRequested.toggle()
        } label: {
            Image(systemName: "sparkles")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(theme.primary)
                .frame(width: 52, height: 52)
                .liquidIsland(cornerRadius: 26)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Ask Coach")
    }

    private func compactBubble(symbol: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: symbol)
                    .font(.system(size: 17, weight: .semibold))
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundColor(theme.primary)
            .padding(.horizontal, 17)
            .frame(height: 52)
            .liquidIsland(cornerRadius: 26)
        }
        .buttonStyle(.plain)
    }
}

private extension View {
    @ViewBuilder
    func liquidIsland(cornerRadius: CGFloat) -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(Color.white.opacity(0.10), lineWidth: 0.7)
                )
                .shadow(color: Color.black.opacity(0.20), radius: 14, y: 7)
        } else {
            self
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(AppColors.border, lineWidth: 0.8)
                )
                .shadow(color: Color.black.opacity(0.18), radius: 14, y: 7)
        }
    }
}
