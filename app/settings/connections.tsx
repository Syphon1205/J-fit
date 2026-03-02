import React from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useConnectionsStore } from '../../src/stores/connectionsStore';

export default function ConnectionsScreen() {
    const router = useRouter();
    const { connections, toggle, sync } = useConnectionsStore();

    const connected = connections.filter((c) => c.connected);
    const available = connections.filter((c) => !c.connected);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Connected Devices</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.desc}>
                    Connect your wearables and fitness apps to automatically sync your health data.
                </Text>

                {connected.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>CONNECTED</Text>
                        {connected.map((conn) => (
                            <Card key={conn.id} style={styles.connCard}>
                                <View style={styles.connRow}>
                                    <View style={[styles.connIcon, { backgroundColor: conn.color + '20' }]}>
                                        <Ionicons name={conn.icon as any} size={22} color={conn.color} />
                                    </View>
                                    <View style={styles.connInfo}>
                                        <Text style={styles.connName}>{conn.name}</Text>
                                        <Text style={styles.connDesc}>{conn.description}</Text>
                                        {conn.lastSync && (
                                            <View style={styles.syncRow}>
                                                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                                <Text style={styles.syncText}>Synced {conn.lastSync}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.connActions}>
                                        {conn.syncing ? (
                                            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => sync(conn.id)}
                                                style={styles.syncBtn}
                                            >
                                                <Ionicons name="refresh" size={14} color={colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        <Switch
                                            value={conn.connected}
                                            onValueChange={() => toggle(conn.id)}
                                            trackColor={{ false: colors.surface, true: colors.primary + '60' }}
                                            thumbColor={conn.connected ? colors.primary : colors.textTertiary}
                                        />
                                    </View>
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                {available.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>AVAILABLE</Text>
                        {available.map((conn) => (
                            <Card key={conn.id} style={styles.connCard}>
                                <View style={styles.connRow}>
                                    <View style={[styles.connIcon, { backgroundColor: conn.color + '20' }]}>
                                        <Ionicons name={conn.icon as any} size={22} color={conn.color} />
                                    </View>
                                    <View style={styles.connInfo}>
                                        <Text style={styles.connName}>{conn.name}</Text>
                                        <Text style={styles.connDesc}>{conn.description}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.connectBtn}
                                        onPress={() => toggle(conn.id)}
                                    >
                                        <Text style={styles.connectBtnText}>Connect</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                <Card style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>
                        On iOS, Apple Health requires device permissions granted via the system prompt.{'\n'}
                        Android uses Google Fit via OAuth. Strava and Fitbit use secure OAuth 2.0 flows.
                    </Text>
                </Card>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    topTitle: { ...typography.bodyBold, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl },
    desc: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
    sectionTitle: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
    connCard: { marginBottom: spacing.sm },
    connRow: { flexDirection: 'row', alignItems: 'center' },
    connIcon: {
        width: 44, height: 44, borderRadius: borderRadius.md,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0,
    },
    connInfo: { flex: 1, marginRight: spacing.sm },
    connName: { ...typography.bodyBold, color: colors.textPrimary },
    connDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    syncText: { ...typography.caption, color: colors.success, fontSize: 10 },
    connActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    syncBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.primaryGlow,
        alignItems: 'center', justifyContent: 'center',
    },
    connectBtn: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1, borderColor: colors.primary,
    },
    connectBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.xl,
        backgroundColor: colors.surfaceLight,
    },
    infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
});
