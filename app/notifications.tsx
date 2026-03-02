import React from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { useNotificationsStore } from '../src/stores/notificationsStore';

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, unreadCount, markRead, markAllRead } = useNotificationsStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text style={styles.markAll}>Mark all read</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 80 }} />
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount} unread</Text>
                    </View>
                )}
                {notifications.map((n) => (
                    <TouchableOpacity
                        key={n.id}
                        onPress={() => markRead(n.id)}
                        style={[styles.card, !n.read && styles.cardUnread]}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: n.color + '20' }]}>
                            <Ionicons name={n.icon as any} size={20} color={n.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{n.title}</Text>
                                {!n.read && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.cardBody}>{n.body}</Text>
                            <Text style={styles.cardTime}>{n.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {notifications.length === 0 && (
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                )}
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
    title: { ...typography.h3, color: colors.textPrimary },
    markAll: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
    unreadBadge: {
        backgroundColor: colors.primaryGlow,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
        marginBottom: spacing.md,
    },
    unreadText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    cardUnread: {
        borderColor: colors.primary + '30',
        backgroundColor: colors.primaryGlow,
    },
    iconWrap: {
        width: 42, height: 42, borderRadius: 21,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    cardTitle: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
    unreadDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.primary, marginLeft: spacing.sm,
    },
    cardBody: { ...typography.subhead, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.xs },
    cardTime: { ...typography.caption, color: colors.textTertiary },
    empty: { alignItems: 'center', paddingTop: 80, gap: spacing.lg },
    emptyText: { ...typography.body, color: colors.textTertiary },
});
