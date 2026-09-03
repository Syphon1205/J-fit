import SwiftUI

// MARK: - Ring Progress View
struct RingView: View {
    let progress: Double  // 0.0 - 1.0
    let color: Color
    let lineWidth: CGFloat
    let size: CGFloat

    init(progress: Double, color: Color = AppColors.primary, lineWidth: CGFloat = 18, size: CGFloat = 152) {
        self.progress = min(max(progress, 0), 1)
        self.color = color
        self.lineWidth = lineWidth
        self.size = size
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.8), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Metric Pill
struct MetricPill: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(color)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(AppColors.textSecondary)
                Text(value)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
            }
            Spacer()
        }
        .padding(15)
        .background(AppColors.surfaceLight)
        .cornerRadius(AppRadius.pill)
    }
}

// MARK: - Quick Action Card
struct QuickActionCard: View {
    let label: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(AppColors.primaryGlow)
                        .frame(width: 48, height: 48)
                    Image(systemName: icon)
                        .font(.system(size: 21, weight: .semibold))
                        .foregroundColor(AppColors.primary)
                }
                Text(label)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                Spacer()
            }
            .padding(16)
            .background(AppColors.surface)
            .cornerRadius(AppRadius.pill)
            .overlay(RoundedRectangle(cornerRadius: AppRadius.pill).stroke(AppColors.border, lineWidth: 1))
        }
    }
}

// MARK: - Segment Picker
struct SegmentPicker<T: Hashable & CustomStringConvertible>: View {
    let options: [T]
    @Binding var selected: T

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { opt in
                    Button {
                        withAnimation(.spring(response: 0.25)) { selected = opt }
                    } label: {
                        Text(opt.description)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(selected == opt ? AppColors.background : AppColors.textSecondary)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 11)
                            .background(selected == opt ? AppColors.textPrimary : Color.clear)
                            .cornerRadius(999)
                    }
                }
            }
        }
    }
}

// MARK: - Bar Chart
struct BarChartView: View {
    let values: [Double]
    let labels: [String]
    let color: Color
    let maxValue: Double

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            ForEach(0..<values.count, id: \.self) { i in
                VStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(color.opacity(i == values.count - 1 ? 1.0 : 0.45))
                        .frame(height: max(4, CGFloat(values[i] / maxValue) * 80))
                    Text(labels[i])
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(AppColors.textTertiary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .animation(.easeOut, value: values)
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(AppColors.textSecondary)
            Text(value)
                .font(.system(size: 28, weight: .semibold))
                .foregroundColor(AppColors.textPrimary)
            Text(subtitle)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(AppRadius.pill)
        .overlay(RoundedRectangle(cornerRadius: AppRadius.pill).stroke(AppColors.border, lineWidth: 1))
    }
}

// MARK: - Macro Arc
struct MacroArc: View {
    let label: String
    let current: Double
    let goal: Double
    let color: Color

    var progress: Double { goal > 0 ? min(current / goal, 1) : 0 }

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                RingView(progress: progress, color: color, lineWidth: 10, size: 72)
                VStack(spacing: 0) {
                    Text("\(Int(current))")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Text("g")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(AppColors.textSecondary)
                }
            }
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(color)
        }
    }
}
