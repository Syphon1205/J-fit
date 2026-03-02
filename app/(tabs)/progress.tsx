import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card, ProgressRing } from '../../src/components/ui';
import { useProgressStore } from '../../src/stores/progressStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 80;
const chartHeight = 180;

const periods = ['Week', 'Month', '3 Months', 'Year'];

// Number of weight entries to show per period
const periodEntryCount: Record<string, number> = { Week: 2, Month: 9, '3 Months': 9, Year: 9 };

export default function ProgressScreen() {
    const router = useRouter();
    const [activePeriod, setActivePeriod] = useState('Month');
    const { weightHistory, personalRecords, weeklyWorkoutMinutes, weeklyCalories, weeklySteps } = useProgressStore();
    const { workoutLogs } = useWorkoutStore();

    // Build 10-week heatmap data from logs
    const today = new Date();
    const heatmapDays = Array.from({ length: 70 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (69 - i));
        const iso = d.toISOString().split('T')[0];
        const log = workoutLogs.find((l) => l.date === iso);
        return { date: iso, cal: log ? log.caloriesBurned : 0 };
    });
    const maxCal = Math.max(...heatmapDays.map((d) => d.cal), 1);

    // Calorie trend from logs (last 14 workouts)
    const calTrend = [...workoutLogs].reverse().slice(0, 14);
    const calMax = Math.max(...calTrend.map((l) => l.caloriesBurned), 1);
    const calPoints = calTrend.map((l, i) => ({
        x: (i / Math.max(calTrend.length - 1, 1)) * chartWidth,
        y: chartHeight * 0.8 - (l.caloriesBurned / calMax) * chartHeight * 0.75,
    }));
    const calLine = calPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const calArea = `${calLine} L ${chartWidth} ${chartHeight * 0.8} L 0 ${chartHeight * 0.8} Z`;

    // HR zones (mock data based on weekly cardio intensity)
    const hrZones = [
        { label: 'Rest', pct: 0.08, color: '#64748B' },
        { label: 'Fat Burn', pct: 0.22, color: colors.info },
        { label: 'Cardio', pct: 0.38, color: colors.primary },
        { label: 'Peak', pct: 0.24, color: colors.tertiary },
        { label: 'Max', pct: 0.08, color: colors.error },
    ];

    // Filter weight data based on period
    const count = periodEntryCount[activePeriod] || weightHistory.length;
    const filteredHistory = weightHistory.slice(-count);
    const weights = filteredHistory.map((w) => w.value);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const wRange = maxW - minW || 1;

    const weightPoints = weights.map((v, i) => ({
        x: (i / Math.max(weights.length - 1, 1)) * chartWidth,
        y: chartHeight - ((v - minW) / wRange) * chartHeight,
    }));

    const weightLinePath = weightPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

    const weightAreaPath = `${weightLinePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

    // Weekly volume bars
    const maxMinutes = Math.max(...weeklyWorkoutMinutes, 1);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const barWidth = (chartWidth - 60) / 7;

    const latestWeight = weights[weights.length - 1] || 0;
    const oldestWeight = weights[0] || latestWeight;
    const weightChange = (latestWeight - oldestWeight).toFixed(1);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.topRow}>
                    <View>
                        <Text style={styles.title}>Progress</Text>
                        <Text style={styles.subtitle}>Track your journey</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/progress/add-weight')}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                        <Text style={styles.addBtnText}>Log Weight</Text>
                    </TouchableOpacity>
                </View>

                {/* Period selector */}
                <View style={styles.periodRow}>
                    {periods.map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setActivePeriod(p)}
                            style={activePeriod === p ? [styles.periodPill, styles.periodPillActive] : styles.periodPill}
                        >
                            <Text style={activePeriod === p ? [styles.periodText, styles.periodTextActive] : styles.periodText}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Weight Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartTitle}>Weight</Text>
                            <Text style={styles.chartValue}>{weights[weights.length - 1]} kg</Text>
                        </View>
                        <View style={styles.trendBadge}>
                            <Ionicons name="trending-down" size={14} color={colors.success} />
                            <Text style={styles.trendText}>-3.8 kg</Text>
                        </View>
                    </View>
                    <Svg width={chartWidth} height={chartHeight + 30} style={{ marginTop: spacing.md }}>
                        <Defs>
                            <SvgLinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                                <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                            </SvgLinearGradient>
                        </Defs>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                            <Line
                                key={frac}
                                x1={0}
                                y1={frac * chartHeight}
                                x2={chartWidth}
                                y2={frac * chartHeight}
                                stroke={colors.border}
                                strokeDasharray="4,4"
                            />
                        ))}
                        {/* Area fill */}
                        <Path d={weightAreaPath} fill="url(#weightGrad)" />
                        {/* Line */}
                        <Path d={weightLinePath} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                        {/* Data points */}
                        {weightPoints.map((p, i) => (
                            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.primary} stroke={colors.background} strokeWidth={2} />
                        ))}
                        {/* Labels */}
                        {filteredHistory.filter((_, i) => i % 2 === 0).map((entry, i) => (
                            <SvgText
                                key={i}
                                x={weightPoints[i * 2]?.x}
                                y={chartHeight + 20}
                                fill={colors.textTertiary}
                                fontSize={10}
                                textAnchor="middle"
                            >
                                {entry.date.slice(5)}
                            </SvgText>
                        ))}
                    </Svg>
                </Card>

                {/* Weekly Volume Bar Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartTitle}>Workout Volume</Text>
                            <Text style={styles.chartSubtitle}>Minutes per day</Text>
                        </View>
                    </View>
                    <Svg width={chartWidth} height={chartHeight + 30} style={{ marginTop: spacing.md }}>
                        {weeklyWorkoutMinutes.map((mins, i) => {
                            const barH = (mins / maxMinutes) * (chartHeight - 20);
                            const x = i * (barWidth + 6) + 10;
                            return (
                                <React.Fragment key={i}>
                                    <Defs>
                                        <SvgLinearGradient id={`bar${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor={mins > 0 ? colors.secondary : colors.textTertiary} stopOpacity="1" />
                                            <Stop offset="1" stopColor={mins > 0 ? colors.secondaryDim : colors.textTertiary} stopOpacity="0.5" />
                                        </SvgLinearGradient>
                                    </Defs>
                                    <Rect
                                        x={x}
                                        y={chartHeight - barH}
                                        width={barWidth - 4}
                                        height={barH || 2}
                                        rx={6}
                                        fill={`url(#bar${i})`}
                                    />
                                    <SvgText
                                        x={x + (barWidth - 4) / 2}
                                        y={chartHeight + 18}
                                        fill={colors.textTertiary}
                                        fontSize={10}
                                        textAnchor="middle"
                                    >
                                        {dayLabels[i]}
                                    </SvgText>
                                    {mins > 0 && (
                                        <SvgText
                                            x={x + (barWidth - 4) / 2}
                                            y={chartHeight - barH - 6}
                                            fill={colors.textSecondary}
                                            fontSize={10}
                                            textAnchor="middle"
                                        >
                                            {mins}
                                        </SvgText>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Svg>
                </Card>

                {/* Summary Stats */}
                <View style={styles.summaryRow}>
                    <Card style={styles.summaryCard}>
                        <ProgressRing size={56} strokeWidth={5} progress={weeklyWorkoutMinutes.reduce((a, b) => a + b, 0) / 300} color={colors.primary}>
                            <Ionicons name="time" size={16} color={colors.primary} />
                        </ProgressRing>
                        <Text style={styles.summaryValue}>{weeklyWorkoutMinutes.reduce((a, b) => a + b, 0)}</Text>
                        <Text style={styles.summaryLabel}>Min this week</Text>
                    </Card>
                    <Card style={styles.summaryCard}>
                        <ProgressRing size={56} strokeWidth={5} progress={weeklyCalories.reduce((a, b) => a + b, 0) / 20000} color={colors.tertiary}>
                            <Ionicons name="flame" size={16} color={colors.tertiary} />
                        </ProgressRing>
                        <Text style={styles.summaryValue}>{(weeklyCalories.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}k</Text>
                        <Text style={styles.summaryLabel}>Cal this week</Text>
                    </Card>
                    <Card style={styles.summaryCard}>
                        <ProgressRing size={56} strokeWidth={5} progress={weeklySteps.reduce((a, b) => a + b, 0) / 70000} color={colors.info}>
                            <Ionicons name="footsteps" size={16} color={colors.info} />
                        </ProgressRing>
                        <Text style={styles.summaryValue}>{(weeklySteps.reduce((a, b) => a + b, 0) / 1000).toFixed(0)}k</Text>
                        <Text style={styles.summaryLabel}>Steps / week</Text>
                    </Card>
                </View>

                {/* Workout Consistency Heatmap */}
                <Text style={styles.sectionTitle}>Consistency 🔥</Text>
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Last 10 Weeks</Text>
                    <View style={styles.heatmapGrid}>
                        {heatmapDays.map((day, i) => {
                            const intensity = day.cal / maxCal;
                            const bg = day.cal === 0
                                ? colors.surface
                                : intensity > 0.7 ? colors.primary
                                    : intensity > 0.4 ? colors.primary + 'AA'
                                        : colors.primary + '44';
                            return (
                                <View
                                    key={i}
                                    style={[styles.heatCell, { backgroundColor: bg }]}
                                />
                            );
                        })}
                    </View>
                    <View style={styles.heatLegend}>
                        <Text style={styles.heatLegendText}>Less</Text>
                        {['surface', '44', 'AA', ''].map((op, i) => (
                            <View key={i} style={[styles.heatCell, { backgroundColor: op === 'surface' ? colors.surface : colors.primary + op, marginHorizontal: 2 }]} />
                        ))}
                        <Text style={styles.heatLegendText}>More</Text>
                    </View>
                </Card>

                {/* Calorie Burn Trend */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartTitle}>Calorie Burn Trend</Text>
                            <Text style={styles.chartSubtitle}>Last {calTrend.length} workouts</Text>
                        </View>
                        <View style={[styles.trendBadge, { backgroundColor: colors.tertiary + '18' }]}>
                            <Ionicons name="flame" size={14} color={colors.tertiary} />
                            <Text style={[styles.trendText, { color: colors.tertiary }]}>
                                {calTrend.length > 0 ? `${calTrend[calTrend.length - 1].caloriesBurned} cal` : '--'}
                            </Text>
                        </View>
                    </View>
                    <Svg width={chartWidth} height={chartHeight * 0.8 + 10} style={{ marginTop: spacing.md }}>
                        <Defs>
                            <SvgLinearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.tertiary} stopOpacity="0.35" />
                                <Stop offset="1" stopColor={colors.tertiary} stopOpacity="0" />
                            </SvgLinearGradient>
                        </Defs>
                        {[0, 0.33, 0.67, 1].map((frac) => (
                            <Line key={frac} x1={0} y1={frac * chartHeight * 0.75} x2={chartWidth} y2={frac * chartHeight * 0.75}
                                stroke={colors.border} strokeDasharray="4,4" />
                        ))}
                        <Path d={calArea} fill="url(#calGrad)" />
                        <Path d={calLine} stroke={colors.tertiary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                        {calPoints.map((p, i) => (
                            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.tertiary} stroke={colors.background} strokeWidth={2} />
                        ))}
                    </Svg>
                </Card>

                {/* Heart Rate Zones */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Heart Rate Zones</Text>
                    <Text style={styles.chartSubtitle}>Weekly average distribution</Text>
                    <View style={styles.zonesContainer}>
                        {hrZones.map((zone) => (
                            <View key={zone.label} style={styles.zoneRow}>
                                <Text style={styles.zoneLabel}>{zone.label}</Text>
                                <View style={styles.zoneBarBg}>
                                    <View style={[styles.zoneBarFill, { width: `${zone.pct * 100}%` as any, backgroundColor: zone.color }]} />
                                </View>
                                <Text style={[styles.zonePct, { color: zone.color }]}>{Math.round(zone.pct * 100)}%</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Personal Records */}
                <Text style={styles.sectionTitle}>Personal Records 🏆</Text>
                {personalRecords.map((pr, idx) => (
                    <Card key={idx} style={styles.prCard}>
                        <View style={styles.prRow}>
                            <View style={styles.prLeft}>
                                <View style={styles.prIcon}>
                                    <Ionicons name="trophy" size={18} color={colors.warning} />
                                </View>
                                <View>
                                    <Text style={styles.prExercise}>{pr.exercise}</Text>
                                    <Text style={styles.prDate}>{pr.date}</Text>
                                </View>
                            </View>
                            <View style={styles.prRight}>
                                <Text style={styles.prValue}>{pr.value}</Text>
                                {pr.previousValue && (
                                    <Text style={styles.prPrev}>from {pr.previousValue}</Text>
                                )}
                            </View>
                        </View>
                    </Card>
                ))}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    title: { ...typography.display, color: colors.textPrimary },
    subtitle: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '40', marginTop: spacing.sm },
    addBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
    periodPill: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
    },
    periodPillActive: {
        backgroundColor: colors.primary,
    },
    periodText: { ...typography.caption, color: colors.textSecondary },
    periodTextActive: { color: colors.textInverse, fontWeight: '700' },
    chartCard: { marginBottom: spacing.lg },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    chartTitle: { ...typography.bodyBold, color: colors.textPrimary },
    chartSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    chartValue: { ...typography.h2, color: colors.primary, marginTop: spacing.xs },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.success + '18',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    trendText: { ...typography.caption, color: colors.success, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
    summaryCard: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    summaryValue: { ...typography.bodyBold, color: colors.textPrimary },
    summaryLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    prCard: { marginBottom: spacing.sm },
    prRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    prLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    prIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.warning + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    prExercise: { ...typography.subhead, color: colors.textPrimary, fontWeight: '600' },
    prDate: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    prRight: { alignItems: 'flex-end' },
    prValue: { ...typography.bodyBold, color: colors.primary },
    prPrev: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    // heatmap
    heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: spacing.md },
    heatCell: { width: 12, height: 12, borderRadius: 2 },
    heatLegend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
    heatLegendText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
    // zones
    zonesContainer: { gap: spacing.md, marginTop: spacing.md },
    zoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    zoneLabel: { ...typography.caption, color: colors.textSecondary, width: 60, fontSize: 11 },
    zoneBarBg: { flex: 1, height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
    zoneBarFill: { height: '100%', borderRadius: 4 },
    zonePct: { ...typography.caption, fontWeight: '700', width: 32, textAlign: 'right', fontSize: 11 },
});
