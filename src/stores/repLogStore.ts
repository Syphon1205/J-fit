import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface RepLogEntry {
    id: string;
    date: string;
    exercise: string;
    sets: number;
    reps: number;
    weightKg?: number;
    notes?: string;
    source: 'manual' | 'trainer';
    createdAt: string;
}

type RepLogInput = Omit<RepLogEntry, 'id' | 'createdAt' | 'source'> & { source?: RepLogEntry['source'] };

interface RepLogState {
    repEntries: RepLogEntry[];
    addRepEntry: (entry: RepLogInput) => void;
    removeRepEntry: (id: string) => void;
    reset: () => void;
}

const cleanNumber = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(0, Math.round(value));
};

export const useRepLogStore = create<RepLogState>()(
    persist(
        (set) => ({
            repEntries: [],
            addRepEntry: (entry) => {
                const now = new Date().toISOString();
                const nextEntry: RepLogEntry = {
                    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    date: entry.date,
                    exercise: entry.exercise.trim() || 'Workout reps',
                    sets: cleanNumber(entry.sets, 1),
                    reps: cleanNumber(entry.reps, 1),
                    weightKg: entry.weightKg && Number.isFinite(entry.weightKg) ? Math.max(0, Number(entry.weightKg)) : undefined,
                    notes: entry.notes?.trim() || undefined,
                    source: entry.source ?? 'manual',
                    createdAt: now,
                };
                set((state) => ({ repEntries: [nextEntry, ...state.repEntries] }));
            },
            removeRepEntry: (id) => {
                set((state) => ({ repEntries: state.repEntries.filter((entry) => entry.id !== id) }));
            },
            reset: () => set({ repEntries: [] }),
        }),
        {
            name: 'jfit-rep-logs',
            storage: createJSONStorage(() => appStorage),
        },
    ),
);
