import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { safeBack } from '../../src/utils/navigation';

const faqs = [
    { q: 'How do I connect my Apple Watch?', a: 'Go to Profile → Connected Devices → Apple Health and toggle it on. You\'ll be prompted to grant HealthKit permissions. Your Apple Watch automatically syncs through Apple Health.' },
    { q: 'How does the workout timer work?', a: 'Open any workout and tap "Start Workout". The timer tracks your total session time. Tap "Complete Set ✓" after each exercise to trigger the rest-interval countdown. Tap Skip to skip rest.' },
    { q: 'Can I create custom workouts?', a: 'Custom workouts are coming in the next update. For now, you can modify the pre-built programs to fit your needs.' },
    { q: 'How is my data stored?', a: 'All your fitness data is stored securely on your device. Health data synced from wearables stays on-device unless you explicitly export it.' },
    { q: 'How do I log my weight?', a: 'Go to the Progress tab and tap the "+" button to log a new weight entry. It will appear on your weight trend chart immediately.' },
    { q: 'Where does watch data come from?', a: 'Connect Apple Health or Health Connect in Settings. Apple Watch, Fitbit, and Google wearables should sync there first, then Cunningham Fitness imports the clean health snapshot.' },
    { q: 'Can I sync with Strava?', a: 'Yes! Go to Profile → Connected Devices → Strava and tap Connect. Your runs, rides, and swims will import automatically.' },
];

export default function HelpScreen() {
    const router = useRouter();
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Contact options */}
                <View style={styles.contactRow}>
                    {[
                        { icon: 'mail-outline', label: 'Email Us', sub: 'support@jfit.app', color: colors.primary },
                        { icon: 'chatbubble-outline', label: 'Live Chat', sub: 'Usually < 2 min', color: colors.secondary },
                    ].map((c) => (
                        <TouchableOpacity key={c.label} activeOpacity={0.85} style={[styles.contactCard, { borderColor: c.color + '30' }]}>
                            <View style={[styles.contactIcon, { backgroundColor: c.color + '18' }]}>
                                <Ionicons name={c.icon as any} size={22} color={c.color} />
                            </View>
                            <Text style={styles.contactLabel}>{c.label}</Text>
                            <Text style={styles.contactSub}>{c.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
                {faqs.map((faq, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => setExpanded(expanded === i ? null : i)}
                        activeOpacity={0.85}
                    >
                        <Card style={expanded === i ? [styles.faqCard, styles.faqCardOpen] : styles.faqCard}>
                            <View style={styles.faqRow}>
                                <Text style={expanded === i ? [styles.faqQ, { color: colors.primary }] : styles.faqQ}>{faq.q}</Text>
                                <Ionicons
                                    name={expanded === i ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={expanded === i ? colors.primary : colors.textTertiary}
                                />
                            </View>
                            {expanded === i && (
                                <Text style={styles.faqA}>{faq.a}</Text>
                            )}
                        </Card>
                    </TouchableOpacity>
                ))}

                <Text style={styles.version}>J-Fit v1.0.0 · Made with 💪</Text>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    contactRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    contactCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
    contactIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    contactLabel: { ...typography.bodyBold, color: colors.textPrimary },
    contactSub: { ...typography.caption, color: colors.textSecondary },
    sectionLabel: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.md },
    faqCard: { marginBottom: spacing.sm },
    faqCardOpen: { borderColor: colors.primary + '30' },
    faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQ: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
    faqA: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 22 },
    version: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xxl },
});
