import React, { useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { typography, spacing, borderRadius } from '../src/theme';
import { Card } from '../src/components/ui';
import { useChallengesStore } from '../src/stores/challengesStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { useStreak } from '../src/hooks/useStreak';
import { safeBack } from '../src/utils/navigation';

const { width: screenWidth } = Dimensions.get('window');

export default function ChallengesScreen() {
    const router = useRouter();
    const { colors } = useThemeColors();
    const { challenges, refreshProgress } = useChallengesStore();
    const { streak } = useStreak();

    useEffect(() => {
        refreshProgress();
    }, []);

    const active = challenges.filter((c) => !c.completed);
    const completed = challenges.filter((c) => c.completed);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/')} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Challenges</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Streak Hero */}
                <LinearGradient
                    colors={[colors.warning + '25', colors.tertiary + '15']}
                    style={styles.streakHero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={[styles.streakNum, { color: colors.warning }]}>{streak}</Text>
                    <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                    <Text style={[styles.streakSub, { color: colors.textTertiary }]}>Keep it going — don't break the chain!</Text>
                </LinearGradient>

                {/* Active Challenges */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Challenges</Text>
                {active.map((challenge) => {
                    const pct = Math.min(challenge.progress / challenge.target, 1);
                    const daysLeft = Math.max(0, Math.ceil(
                        (new Date(challenge.endDate).getTime() - Date.now()) / 86_400_000
                    ));
                    return (
                        <Card key={challenge.id} style={[styles.challengeCard, { backgroundColor: colors.surface }]}>
                            <LinearGradient
                                colors={[challenge.color + '15', 'transparent']}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.cardTop}>
                                    <View style={[styles.challengeIcon, { backgroundColor: challenge.color + '25' }]}>
                                        <Text style={styles.challengeIconText}>{challenge.icon}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{challenge.title}</Text>
                                        <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>{challenge.description}</Text>
                                    </View>
                                    <View style={[styles.durationBadge, { backgroundColor: colors.surfaceLight }]}>
                                        <Text style={[styles.durationText, { color: colors.textTertiary }]}>
                                            {daysLeft}d left
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress bar */}
                                <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
                                    <View style={[styles.progressFill, {
                                        width: `${pct * 100}%` as any,
                                        backgroundColor: challenge.color,
                                    }]} />
                                </View>
                                <View style={styles.progressRow}>
                                    <Text style={[styles.progressText, { color: challenge.color }]}>
                                        {challenge.progress} / {challenge.target} {challenge.unit}
                                    </Text>
                                    <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                                        {Math.round(pct * 100)}%
                                    </Text>
                                </View>

                                {/* Reward */}
                                <View style={[styles.rewardRow, { borderTopColor: colors.border }]}>
                                    <Ionicons name="gift-outline" size={14} color={colors.textTertiary} />
                                    <Text style={[styles.rewardText, { color: colors.textTertiary }]}>{challenge.reward}</Text>
                                </View>
                            </LinearGradient>
                        </Card>
                    );
                })}

                {/* Completed Challenges */}
                {completed.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Completed 🏆</Text>
                        {completed.map((challenge) => (
                            <Card key={challenge.id} style={[styles.challengeCard, styles.completedCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.cardTop}>
                                    <View style={[styles.challengeIcon, { backgroundColor: colors.success + '25' }]}>
                                        <Text style={styles.challengeIconText}>{challenge.icon}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{challenge.title}</Text>
                                        <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>{challenge.description}</Text>
                                    </View>
                                    <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                                </View>
                                <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
                                    <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.success }]} />
                                </View>
                                <View style={styles.progressRow}>
                                    <Text style={[styles.progressText, { color: colors.success }]}>Completed! {challenge.reward}</Text>
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3 },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    // Streak hero
    streakHero: { borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    streakEmoji: { fontSize: 48, marginBottom: spacing.sm },
    streakNum: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
    streakLabel: { ...typography.h3, marginTop: 4 },
    streakSub: { ...typography.caption, marginTop: spacing.sm, textAlign: 'center' },
    // Section
    sectionTitle: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.lg },
    // Challenge card
    challengeCard: { marginBottom: spacing.md, padding: 0, overflow: 'hidden' },
    completedCard: { opacity: 0.85 },
    cardGradient: { padding: spacing.lg },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
    challengeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    challengeIconText: { fontSize: 24 },
    cardInfo: { flex: 1 },
    challengeTitle: { ...typography.bodyBold },
    challengeDesc: { ...typography.caption, marginTop: 2 },
    durationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
    durationText: { ...typography.caption, fontSize: 11 },
    // Progress
    progressBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
    progressFill: { height: '100%', borderRadius: 4 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
    progressText: { ...typography.caption, fontWeight: '600' },
    // Reward
    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
    rewardText: { ...typography.caption, fontSize: 11 },
});
