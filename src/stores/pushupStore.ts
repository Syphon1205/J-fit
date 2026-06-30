import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface PushupHistoryEntry {
    date: string;
    target: number;
    completed: number;
}

interface PushupState {
    challengeDate: string;
    dailyTarget: number;
    dailyCount: number;
    history: PushupHistoryEntry[];
    ensureTodayChallenge: () => void;
    addPushups: (count: number) => void;
    resetToday: () => void;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getTargetForDate = (date: string) => {
    const hash = date.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return 10 + (hash % 11); // 10..20
};

const upsertHistory = (
    history: PushupHistoryEntry[],
    payload: PushupHistoryEntry,
) => {
    const existing = history.find((entry) => entry.date === payload.date);
    if (existing) {
        return history.map((entry) => (
            entry.date === payload.date
                ? { ...entry, target: payload.target, completed: payload.completed }
                : entry
        ));
    }

    return [payload, ...history].slice(0, 60);
};

export const usePushupStore = create<PushupState>()(
    persist((set, get) => ({
        challengeDate: getTodayKey(),
        dailyTarget: getTargetForDate(getTodayKey()),
        dailyCount: 0,
        history: [],

        ensureTodayChallenge: () => {
            const today = getTodayKey();
            if (get().challengeDate === today) {
                return;
            }

            set({
                challengeDate: today,
                dailyTarget: getTargetForDate(today),
                dailyCount: 0,
            });
        },

        addPushups: (count) => {
            const increment = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
            if (increment <= 0) {
                return;
            }

            set((state) => {
                const today = getTodayKey();
                const isSameDay = state.challengeDate === today;
                const target = isSameDay ? state.dailyTarget : getTargetForDate(today);
                const nextCount = (isSameDay ? state.dailyCount : 0) + increment;

                const shouldTrack = nextCount >= target;
                const nextHistory = shouldTrack
                    ? upsertHistory(state.history, {
                        date: today,
                        target,
                        completed: nextCount,
                    })
                    : state.history;

                return {
                    challengeDate: today,
                    dailyTarget: target,
                    dailyCount: nextCount,
                    history: nextHistory,
                };
            });
        },

        resetToday: () => {
            const today = getTodayKey();
            set({
                challengeDate: today,
                dailyTarget: getTargetForDate(today),
                dailyCount: 0,
            });
        },
    }), {
        name: 'jfit-pushups',
        storage: createJSONStorage(() => appStorage),
    }),
);
