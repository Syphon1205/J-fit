import { create } from 'zustand';

export interface Notification {
    id: string;
    type: 'workout' | 'nutrition' | 'achievement' | 'reminder' | 'sync';
    title: string;
    body: string;
    time: string;
    read: boolean;
    icon: string;
    color: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    settings: {
        workoutReminders: boolean;
        nutritionReminders: boolean;
        achievements: boolean;
        syncAlerts: boolean;
        weeklyReport: boolean;
    };
    updateSetting: (key: string, value: boolean) => void;
}

const sampleNotifications: Notification[] = [
    { id: 'n1', type: 'achievement', title: 'New PR! 🏆', body: 'You hit 100kg on Bench Press — a new personal record!', time: '10 min ago', read: false, icon: 'trophy', color: '#F59E0B' },
    { id: 'n2', type: 'workout', title: 'Workout Reminder', body: 'Push Day is scheduled for today at 6:00 PM. Ready to crush it?', time: '2 hours ago', read: false, icon: 'barbell', color: '#00E5C7' },
    { id: 'n3', type: 'sync', title: 'Apple Health Synced', body: 'Your activity data has been synced — 10,100 steps recorded.', time: '3 hours ago', read: false, icon: 'heart', color: '#FF2D55' },
    { id: 'n4', type: 'nutrition', title: 'Protein Goal Met ✅', body: "You've hit your daily protein goal of 140g. Great work!", time: '5 hours ago', read: true, icon: 'nutrition', color: '#A78BFA' },
    { id: 'n5', type: 'reminder', title: 'Log Your Meals', body: "Don't forget to log dinner to keep your nutrition on track.", time: 'Yesterday', read: true, icon: 'restaurant', color: '#10B981' },
    { id: 'n6', type: 'achievement', title: '6-Day Streak! 🔥', body: "You've worked out 6 days in a row. Keep going for the weekly badge!", time: 'Yesterday', read: true, icon: 'flame', color: '#EF4444' },
    { id: 'n7', type: 'sync', title: 'Strava Activity Imported', body: '5.2km run imported · 28:45 · 312 cal burned', time: '2 days ago', read: true, icon: 'bicycle', color: '#FC4C02' },
    { id: 'n8', type: 'workout', title: 'Weekly Summary Ready', body: 'You trained 5 days and burned 2,275 calories this week!', time: '3 days ago', read: true, icon: 'stats-chart', color: '#3B82F6' },
];

export const useNotificationsStore = create<NotificationsState>((set) => ({
    notifications: sampleNotifications,
    unreadCount: sampleNotifications.filter((n) => !n.read).length,

    markRead: (id: string) =>
        set((state) => {
            const updated = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
            return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
        }),

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),

    settings: {
        workoutReminders: true,
        nutritionReminders: true,
        achievements: true,
        syncAlerts: true,
        weeklyReport: true,
    },

    updateSetting: (key: string, value: boolean) =>
        set((state) => ({
            settings: { ...state.settings, [key]: value },
        })),
}));
