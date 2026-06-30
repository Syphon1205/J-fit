import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button, Card } from '../../src/components/ui';
import { borderRadius, colors, spacing, typography } from '../../src/theme';
import { safeBack } from '../../src/utils/navigation';

type TrainerVideo = {
    id: string;
    title: string;
    duration: string;
    level: string;
    exercise: 'pushups' | 'squats' | 'lunges' | 'plank' | 'burpees';
    summary: string;
    cues: string[];
    color: string;
};

const trainerVideos: TrainerVideo[] = [
    {
        id: 'push-up-clean-form',
        title: 'Push-up clean form',
        duration: '08:24',
        level: 'Beginner-friendly',
        exercise: 'pushups',
        summary: 'Lock in a strong plank, lower with control, and keep the shoulders stacked.',
        cues: ['Hands under shoulders', 'Ribs down, glutes tight', 'Chest touches first'],
        color: colors.primary,
    },
    {
        id: 'squat-mechanics',
        title: 'Squat mechanics breakdown',
        duration: '11:10',
        level: 'Strength session',
        exercise: 'squats',
        summary: 'Coach-led walkthrough for stance, depth, and knee tracking under load.',
        cues: ['Brace before descent', 'Drive knees out', 'Stand tall through the hips'],
        color: colors.secondary,
    },
    {
        id: 'mobility-flow',
        title: '15-minute mobility flow',
        duration: '15:02',
        level: 'Recovery reset',
        exercise: 'plank',
        summary: 'A smooth, low-intensity flow to open the hips, spine, and shoulders.',
        cues: ['Breathe through each rep', 'Move at a steady cadence', 'Finish with longer holds'],
        color: colors.tertiary,
    },
];

export default function TrainerVideosScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => safeBack(router, '/workouts')}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trainer Videos</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={[colors.primary + '2A', colors.surface, colors.secondary + '10']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroBadge}>
                        <Ionicons name="videocam" size={14} color={colors.primary} />
                        <Text style={styles.heroBadgeText}>Trainer-led technique</Text>
                    </View>
                    <Text style={styles.heroTitle}>Watch, learn, and train cleaner</Text>
                    <Text style={styles.heroSub}>
                        Use these clips as quick reminders before a set, or pair them with a practice record session.
                    </Text>
                    <View style={styles.heroStats}>
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>{trainerVideos.length}</Text>
                            <Text style={styles.heroStatLabel}>clips</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>HD</Text>
                            <Text style={styles.heroStatLabel}>coach videos</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>Featured sessions</Text>
                {trainerVideos.map((video) => (
                    <Card key={video.id} style={styles.videoCard}>
                        <View style={styles.videoTopRow}>
                            <View style={[styles.videoIcon, { backgroundColor: video.color + '20' }]}>
                                <Ionicons name="play" size={18} color={video.color} />
                            </View>
                            <View style={styles.videoMeta}>
                                <View style={styles.videoTag}>
                                    <Text style={styles.videoTagText}>{video.level}</Text>
                                </View>
                                <Text style={styles.videoDuration}>{video.duration}</Text>
                            </View>
                        </View>

                        <Text style={styles.videoTitle}>{video.title}</Text>
                        <Text style={styles.videoSummary}>{video.summary}</Text>

                        <View style={styles.cueList}>
                            {video.cues.map((cue) => (
                                <View key={cue} style={styles.cueRow}>
                                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                    <Text style={styles.cueText}>{cue}</Text>
                                </View>
                            ))}
                        </View>

                        <Button
                            title="Open practice session"
                            onPress={() => router.push(`/workout/record?exercise=${video.exercise}`)}
                            variant="secondary"
                            size="md"
                        />
                    </Card>
                ))}

                <Card variant="glow" style={styles.footerCard}>
                    <Text style={styles.footerTitle}>Want this hooked to real trainer uploads?</Text>
                    <Text style={styles.footerSub}>
                        Add your hosted video URLs or a private content source and this screen can become a live library.
                    </Text>
                    <Button
                        title="Go to Record & Score"
                        onPress={() => router.push('/workout/record?exercise=pushups')}
                        size="md"
                    />
                    <Button
                        title="Save a note"
                        onPress={() => Alert.alert('Next step', 'Send me the trainer video source and I can wire up actual playback.')}
                        variant="ghost"
                        size="md"
                    />
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    hero: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.border,
        alignSelf: 'flex-start',
    },
    heroBadgeText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
    heroTitle: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
    heroSub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
    heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
    heroStat: { flex: 1 },
    heroStatValue: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
    heroStatLabel: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    heroDivider: { width: 1, height: 32, backgroundColor: colors.border },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    videoCard: { marginBottom: spacing.md },
    videoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    videoIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    videoMeta: { alignItems: 'flex-end' },
    videoTag: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
    videoTagText: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
    videoDuration: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },
    videoTitle: { ...typography.h3, color: colors.textPrimary },
    videoSummary: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
    cueList: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
    cueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    cueText: { ...typography.caption, color: colors.textSecondary },
    footerCard: { gap: spacing.sm },
    footerTitle: { ...typography.h3, color: colors.textPrimary },
    footerSub: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
});
