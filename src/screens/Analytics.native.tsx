import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

const weeklyVolume = [
    { muscle: 'Chest', sets: 18, target: 12 },
    { muscle: 'Back', sets: 10, target: 18 },
    { muscle: 'Quads', sets: 12, target: 14 },
    { muscle: 'Hamstrings', sets: 8, target: 16 },
    { muscle: 'Shoulders', sets: 14, target: 10 },
    { muscle: 'Arms', sets: 11, target: 10 },
];

export default function Analytics() {
    const { colors } = useThemeColors();
    const styles = makeStyles(colors);
    const max = Math.max(...weeklyVolume.map((item) => item.target), ...weeklyVolume.map((item) => item.sets));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View>
                    <Text style={styles.kicker}>Training intelligence</Text>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>Deep volume audit for strength progression.</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.kicker}>Weekly sets per muscle group</Text>
                            <Text style={styles.cardTitle}>Volume Balance</Text>
                        </View>
                        <Ionicons name="analytics-outline" size={28} color={colors.primary} />
                    </View>
                    <View style={styles.bars}>
                        {weeklyVolume.map((item) => (
                            <View key={item.muscle} style={styles.barRow}>
                                <Text style={styles.barLabel}>{item.muscle}</Text>
                                <View style={styles.track}>
                                    <View style={[styles.target, { width: `${(item.target / max) * 100}%` }]} />
                                    <View style={[styles.fill, { width: `${(item.sets / max) * 100}%` }]} />
                                </View>
                                <Text style={styles.barValue}>{item.sets}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.kicker}>Coach insight</Text>
                    <Text style={styles.cardTitle}>Posterior chain correction window</Text>
                    <Text style={styles.copy}>
                        You are biased toward anterior pushing this week. Add 16 sets of posterior-chain pulling across rows, hinges, and hamstring work.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 118, gap: 14, paddingTop: 12 },
    kicker: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    title: { color: colors.textPrimary, fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.4 },
    subtitle: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, fontWeight: '600', marginTop: 6 },
    card: { backgroundColor: colors.surface, borderRadius: 32, borderWidth: 1, borderColor: colors.border, padding: 18 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    cardTitle: { color: colors.textPrimary, fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
    bars: { gap: 14, marginTop: 18 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barLabel: { width: 88, color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    track: { flex: 1, height: 13, borderRadius: 999, backgroundColor: colors.surfaceLight, overflow: 'hidden' },
    target: { position: 'absolute', height: '100%', backgroundColor: colors.secondary + '36', borderRadius: 999 },
    fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
    barValue: { width: 26, textAlign: 'right', color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
    copy: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 12 },
});
