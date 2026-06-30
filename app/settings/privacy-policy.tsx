import React, { useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { safeBack } from '../../src/utils/navigation';

export const privacyPolicySections = [
    ['Effective date', 'June 1, 2026. Cunningham Fitness is a private fitness, training, recovery, and trainer-review application. This policy explains what data the app handles, why it is used, and how you can control it.'],
    ['Information you provide', 'You may provide your name, email address, profile photo, height, weight, goals, goal weight, training preferences, notes, agenda entries, workout logs, nutrition entries, and other fitness details you choose to enter.'],
    ['Health and wearable data', 'With your permission, Cunningham Fitness may read Apple Health or Android Health Connect data such as steps, distance, workouts, active energy, heart rate, resting heart rate, heart-rate variability, sleep, weight, and related recovery metrics. Health permissions are optional and can be changed in system settings.'],
    ['Workout, run, and location data', 'When you track a run, the app may use location while the workout is active to calculate distance, pace, route, and GPS points. Routes are used for your run history and trainer review. The app does not track location when you are not using a location-based feature.'],
    ['Camera, motion, and notifications', 'Camera access may be used for posture checks, profile photos, barcode or label workflows, and form review features. Motion access may support steps and movement estimates. Notifications may be used for workout timers, reminders, and coaching prompts.'],
    ['Trainer sync', 'If you start Trainer Nearby Sync, Cunningham Fitness may share a review packet with the trainer desktop app on your local network. This may include profile basics, workout history, runs, sleep, readiness, heart metrics, and agenda items. Trainer sync happens only when you choose to start sharing.'],
    ['How data is used', 'Data is used to operate the app, show dashboards, calculate readiness and recovery, personalize workouts, support trainer recommendations, save progress, sync authorized health metrics, and help you manage privacy and export controls.'],
    ['Data sharing', 'Cunningham Fitness does not sell personal data. Data may be shared only with services you authorize, operating-system providers needed for features such as health, maps, notifications, and authentication, the trainer app when you start local sync, or when required by law.'],
    ['Storage and retention', 'Most app data is stored locally on your device under the app storage namespace. Data remains until you reset progress, clear local data, delete your account/local profile, revoke system permissions, or remove the app.'],
    ['Your controls', 'You can disconnect health permissions in Apple Health, iOS Settings, Android Health Connect, or Android Settings. You can reset progress, clear local data, request export controls where available, and delete local account data from Health and Privacy.'],
    ['Security', 'The app uses platform storage and system permission prompts to protect local data. No system can be guaranteed completely secure, so you should use device passcodes, OS updates, and trusted networks when syncing with a trainer.'],
    ['Children', 'Cunningham Fitness is not intended for children under 13. If you believe a child has provided personal data, contact the support channel listed with the app.'],
    ['Changes', 'This policy may be updated as Cunningham Fitness adds features. Material changes should be reflected in the app and may require renewed acknowledgement.'],
    ['Contact', 'For privacy questions or requests, use the Cunningham Fitness support contact provided in the app store listing or your private training support channel.'],
] as const;

export const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    useEffect(() => {
        void Linking.openURL(GOOGLE_PRIVACY_POLICY_URL).catch(() => undefined);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/settings/privacy')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
                <View style={styles.hero}>
                    <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
                    <Text style={styles.title}>Privacy Policy</Text>
                    <Text style={styles.copy}>The full policy opens in your browser. Cunningham Fitness uses Google privacy policy standards for the review version and keeps this in-app summary for quick reference.</Text>
                    <TouchableOpacity style={styles.openButton} onPress={() => Linking.openURL(GOOGLE_PRIVACY_POLICY_URL)}>
                        <Ionicons name="open-outline" size={18} color={colors.textInverse} />
                        <Text style={styles.openButtonText}>Open Browser Policy</Text>
                    </TouchableOpacity>
                </View>
                {privacyPolicySections.map(([title, copy]) => (
                    <View key={title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        <Text style={styles.sectionCopy}>{copy}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    topTitle: { ...typography.h3, color: colors.textPrimary },
    scroll: { flex: 1 },
    content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
    hero: { backgroundColor: colors.primaryGlow, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary + '30', gap: spacing.sm },
    title: { ...typography.h2, color: colors.textPrimary },
    copy: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    openButton: { marginTop: spacing.sm, minHeight: 48, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    openButtonText: { ...typography.bodyBold, color: colors.textInverse },
    section: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
    sectionCopy: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
