import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { typography } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useHealthStore, HealthDataType } from '../../src/stores/healthStore';
import { safeBack } from '../../src/utils/navigation';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const categoryLabels: Record<string, string> = {
    activity: 'Activity',
    body: 'Body Measurements',
    vitals: 'Heart & Vitals',
    sleep: 'Sleep',
    nutrition: 'Nutrition',
};

const categoryIcons: Record<string, string> = {
    activity: 'walk-outline',
    body: 'body-outline',
    vitals: 'heart-outline',
    sleep: 'moon-outline',
    nutrition: 'nutrition-outline',
};

const getCatColor = (cat: string, colors: ReturnType<typeof useThemeColors>['colors']) => {
    const map: Record<string, string> = {
        activity: colors.primary,
        body: colors.secondary,
        vitals: '#FF2D55',
        sleep: colors.info,
        nutrition: '#F59E0B',
    };
    return map[cat] ?? colors.primary;
};

function DataTypeRow({ item, onToggle, colors, styles }: { item: HealthDataType; onToggle: () => void; colors: ReturnType<typeof useThemeColors>['colors']; styles: ReturnType<typeof makeStyles> }) {
    return (
        <View style={styles.dataTypeRow}>
            <View style={[styles.dataTypeIcon, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name={item.icon as any} size={13} color={colors.textSecondary} />
            </View>
            <View style={styles.dataTypeInfo}>
                <Text style={styles.dataTypeName}>{item.name}</Text>
                <Text style={styles.dataTypeDesc}>{item.description}</Text>
            </View>
            <Switch
                value={item.enabled}
                onValueChange={onToggle}
                trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
                thumbColor={item.enabled ? colors.primary : colors.textTertiary}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
        </View>
    );
}

export default function HealthPermissionsScreen() {
    const router = useRouter();
    const { colors, gradients } = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { sources, dataTypes, latestSnapshot, lastError, requestPermission, syncNow, toggleDataType, disconnect } = useHealthStore();
    const [expandedCategory, setExpandedCategory] = useState<string | null>('activity');

    const currentPlatformSource = sources.find((s) =>
        Platform.OS === 'ios' ? s.id === 'apple_health' : s.id === 'google_health'
    ) ?? sources[0];

    const categories = [...new Set(dataTypes.map((d) => d.category))];
    const enabledCount = dataTypes.filter((d) => d.enabled).length;

    const handleConnect = (sourceId: string) => {
        const source = sources.find((s) => s.id === sourceId);
        if (!source) return;
        Alert.alert(
            `Connect ${source.name}`,
            `Cunningham Fitness will request permission to read your health data from ${source.name}. You can control exactly which data types are shared.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => requestPermission(sourceId) },
            ]
        );
    };

    const handleDisconnect = (sourceId: string) => {
        const source = sources.find((s) => s.id === sourceId);
        Alert.alert(
            `Disconnect ${source?.name}`,
            'Cunningham Fitness will stop reading data from this source. Your existing data will be kept.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Disconnect', style: 'destructive', onPress: () => disconnect(sourceId) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Health & Data</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                bounces
                alwaysBounceVertical
                contentInsetAdjustmentBehavior="automatic"
            >
                {/* Hero */}
                <LinearGradient
                    colors={gradients.primary}
                    style={styles.heroBanner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.heroIcon}>
                        <Ionicons name="heart-half" size={28} color="#FF2D55" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>Sync Your Health Data</Text>
                        <Text style={styles.heroDesc}>
                            Connect to your device's health app to automatically import workouts, steps, sleep, heart rate, and more.
                        </Text>
                    </View>
                </LinearGradient>

                {/* Primary source */}
                <Text style={styles.sectionLabel}>YOUR DEVICE</Text>
                <Card style={[styles.sourceCard, currentPlatformSource.connected && styles.sourceCardConnected]}>
                    <View style={styles.sourceRow}>
                        <LinearGradient
                            colors={[currentPlatformSource.color + '30', currentPlatformSource.color + '10']}
                            style={styles.sourceIconBg}
                        >
                            <Ionicons name={currentPlatformSource.icon as any} size={24} color={currentPlatformSource.color} />
                        </LinearGradient>
                        <View style={styles.sourceInfo}>
                            <View style={styles.sourceNameRow}>
                                <Text style={styles.sourceName}>{currentPlatformSource.name}</Text>
                                {currentPlatformSource.connected && (
                                    <View style={styles.connectedBadge}>
                                        <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                                        <Text style={styles.connectedBadgeText}>Connected</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.sourceSync}>
                                {currentPlatformSource.connected && currentPlatformSource.lastSync
                                    ? `Last synced ${currentPlatformSource.lastSync}`
                                    : 'Not connected'}
                            </Text>
                        </View>
                        {currentPlatformSource.syncing ? (
                            <ActivityIndicator size="small" color={currentPlatformSource.color} />
                        ) : currentPlatformSource.connected ? (
                            <TouchableOpacity style={styles.syncBtn} onPress={() => syncNow(currentPlatformSource.id)}>
                                <Ionicons name="refresh" size={16} color={currentPlatformSource.color} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    {currentPlatformSource.connected ? (
                        <TouchableOpacity style={styles.disconnectBtn} onPress={() => handleDisconnect(currentPlatformSource.id)}>
                            <Text style={styles.disconnectBtnText}>Disconnect</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.connectBtn, { backgroundColor: currentPlatformSource.color }]}
                            onPress={() => handleConnect(currentPlatformSource.id)}
                            disabled={currentPlatformSource.syncing}
                        >
                            {currentPlatformSource.syncing ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.connectBtnText}>Requesting access…</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="link-outline" size={16} color="#fff" />
                                    <Text style={styles.connectBtnText}>Connect {currentPlatformSource.name}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </Card>

                {latestSnapshot && (
                    <Card style={styles.syncedCard}>
                        <View style={styles.syncedHeader}>
                            <Text style={styles.syncedTitle}>Latest Imported Data</Text>
                            <Text style={styles.syncedTime}>{new Date(latestSnapshot.syncedAt).toLocaleTimeString()}</Text>
                        </View>
                        <View style={styles.syncedMetrics}>
                            <View style={styles.syncedMetricItem}>
                                <Ionicons name="footsteps-outline" size={16} color={colors.primary} />
                                <Text style={styles.syncedMetricValue}>{latestSnapshot.stepsToday.toLocaleString()}</Text>
                                <Text style={styles.syncedMetricLabel}>Steps today</Text>
                            </View>
                            <View style={styles.syncedMetricItem}>
                                <Ionicons name="map-outline" size={16} color={colors.secondary} />
                                <Text style={styles.syncedMetricValue}>{latestSnapshot.distanceKmToday ? `${latestSnapshot.distanceKmToday.toFixed(2)} km` : 'Watch sync'}</Text>
                                <Text style={styles.syncedMetricLabel}>Distance</Text>
                            </View>
                            <View style={styles.syncedMetricItem}>
                                <Ionicons name="flame-outline" size={16} color={colors.tertiary} />
                                <Text style={styles.syncedMetricValue}>{latestSnapshot.activeCaloriesToday ?? 'Watch sync'}</Text>
                                <Text style={styles.syncedMetricLabel}>Active kcal</Text>
                            </View>
                        </View>
                        <Text style={styles.syncedSource}>Source: {latestSnapshot.sourceLabel}</Text>
                    </Card>
                )}

                {lastError && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning-outline" size={16} color={colors.warning} />
                        <Text style={styles.errorText}>{lastError}</Text>
                    </View>
                )}

                {/* Data type permissions */}
                <View style={styles.dataTypesHeader}>
                    <Text style={styles.sectionLabel}>DATA PERMISSIONS</Text>
                    <Text style={styles.dataTypesCount}>{enabledCount}/{dataTypes.length} enabled</Text>
                </View>

                <Card style={styles.dataTypesCard}>
                    {categories.map((cat, catIdx) => {
                        const items = dataTypes.filter((d) => d.category === cat);
                        const enabledInCat = items.filter((d) => d.enabled).length;
                        const isExpanded = expandedCategory === cat;
                        return (
                            <View key={cat}>
                                {catIdx > 0 && <View style={styles.catDivider} />}
                                <TouchableOpacity
                                    style={styles.catHeader}
                                    onPress={() => setExpandedCategory(isExpanded ? null : cat)}
                                >
                                    <View style={[styles.catIcon, { backgroundColor: getCatColor(cat, colors) + '20' }]}>
                                        <Ionicons name={categoryIcons[cat] as any} size={14} color={getCatColor(cat, colors)} />
                                    </View>
                                    <Text style={styles.catLabel}>{categoryLabels[cat]}</Text>
                                    <Text style={styles.catCount}>{enabledInCat}/{items.length}</Text>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={14}
                                        color={colors.textTertiary}
                                    />
                                </TouchableOpacity>
                                {isExpanded && (
                                    <View style={styles.catItems}>
                                        {items.map((item) => (
                                            <DataTypeRow key={item.id} item={item} colors={colors} styles={styles} onToggle={() => toggleDataType(item.id)} />
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </Card>

                {/* Privacy note */}
                <View style={styles.privacyNote}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
                    <Text style={styles.privacyText}>
                        Your health data is stored privately on your device. Cunningham Fitness never sells or shares your data with third parties.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topTitle: { ...typography.h3, color: colors.textPrimary },
    content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
    heroBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
    },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,45,85,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 4 },
    heroDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
    sectionLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        paddingHorizontal: 2,
    },
    dataTypesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dataTypesCount: { ...typography.caption, color: colors.textTertiary },
    sourceCard: { padding: 16, gap: 12 },
    sourceCardConnected: { borderColor: colors.success + '40', borderWidth: 1 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sourceIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceInfo: { flex: 1 },
    sourceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    sourceName: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: colors.success + '20',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    connectedBadgeText: { ...typography.caption, color: colors.success, fontSize: 10, fontWeight: '600' },
    sourceSync: { ...typography.caption, color: colors.textTertiary },
    syncBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 14,
    },
    connectBtnText: { ...typography.body, color: '#fff', fontWeight: '700', fontSize: 15 },
    syncedCard: { padding: 14, gap: 10 },
    syncedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    syncedTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
    syncedTime: { ...typography.caption, color: colors.textTertiary },
    syncedMetrics: { flexDirection: 'row', gap: 8 },
    syncedMetricItem: {
        flex: 1,
        backgroundColor: colors.surfaceLight,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        gap: 2,
    },
    syncedMetricValue: { ...typography.subhead, color: colors.textPrimary, fontWeight: '700' },
    syncedMetricLabel: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
    syncedSource: { ...typography.caption, color: colors.textSecondary },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.warning + '40',
        backgroundColor: colors.warning + '12',
        borderRadius: 12,
        padding: 10,
    },
    errorText: { ...typography.caption, color: colors.warning, flex: 1, lineHeight: 17 },
    disconnectBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    disconnectBtnText: { ...typography.caption, color: colors.textTertiary, fontWeight: '600' },
    dataTypesCard: { padding: 0, overflow: 'hidden' },
    catHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
    },
    catIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    catLabel: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '600' },
    catCount: { ...typography.caption, color: colors.textTertiary, marginRight: 4 },
    catDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    catItems: { paddingHorizontal: 14, paddingBottom: 8 },
    dataTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dataTypeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dataTypeInfo: { flex: 1 },
    dataTypeName: { ...typography.body, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
    dataTypeDesc: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: colors.success + '10',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.success + '25',
    },
    privacyText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 17 },
});
