import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface RunSession {
    id: string;
    date: string;
    duration: number; // seconds
    distance: number; // km
    avgPace: number; // min/km
    calories: number;
    route: Coordinate[];
    elevationGain?: number;
}

interface RunState {
    sessions: RunSession[];
    addSession: (session: RunSession) => void;
    deleteSession: (id: string) => void;
    reset: () => void;
}

export const useRunStore = create<RunState>()(persist((set) => ({
    sessions: [
        {
            id: 'demo_sf_embarcadero',
            date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            duration: 1820,
            distance: 5.2,
            avgPace: 5.83,
            calories: 412,
            route: [
                { latitude: 37.7955, longitude: -122.3937 },
                { latitude: 37.7971, longitude: -122.3952 },
                { latitude: 37.8000, longitude: -122.3970 },
                { latitude: 37.8024, longitude: -122.3985 },
                { latitude: 37.8055, longitude: -122.4010 },
                { latitude: 37.8078, longitude: -122.4045 },
                { latitude: 37.8085, longitude: -122.4095 }
            ],
            elevationGain: 48,
        },
        {
            id: 'demo_sj_guadalupe',
            date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
            duration: 2640,
            distance: 8.1,
            avgPace: 5.45,
            calories: 618,
            route: [
                { latitude: 37.3325, longitude: -121.9015 },
                { latitude: 37.3350, longitude: -121.9020 },
                { latitude: 37.3385, longitude: -121.9055 },
                { latitude: 37.3420, longitude: -121.9090 },
                { latitude: 37.3465, longitude: -121.9125 },
                { latitude: 37.3510, longitude: -121.9160 }
            ],
            elevationGain: 72,
        },
    ],
    addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),
    deleteSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    reset: () => set({ sessions: [] }),
}), {
    name: 'jfit-runs',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        sessions: state.sessions,
    }),
}));
