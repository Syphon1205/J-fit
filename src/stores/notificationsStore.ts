import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface Notification {
    id: string;
    type: 'workout' | 'achievement' | 'reminder' | 'sync';
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
    reset: () => void;
    settings: {
        workoutReminders: boolean;
        achievements: boolean;
        syncAlerts: boolean;
        weeklyReport: boolean;
    };
    updateSetting: (key: string, value: boolean) => void;
}

const sampleNotifications: Notification[] = [];

export const useNotificationsStore = create<NotificationsState>()(persist((set) => ({
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

    reset: () =>
        set({
            notifications: [],
            unreadCount: 0,
        }),

    settings: {
        workoutReminders: true,
        achievements: true,
        syncAlerts: true,
        weeklyReport: true,
    },

    updateSetting: (key: string, value: boolean) =>
        set((state) => ({
            settings: { ...state.settings, [key]: value },
        })),
}), {
    name: 'jfit-notifications',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        settings: state.settings,
    }),
}));
