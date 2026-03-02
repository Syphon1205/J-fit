import { create } from 'zustand';

export interface Connection {
    id: string;
    name: string;
    icon: string;
    color: string;
    connected: boolean;
    lastSync?: string | null;
    description: string;
    syncing?: boolean;
}

interface ConnectionsState {
    connections: Connection[];
    toggle: (id: string) => void;
    sync: (id: string) => Promise<void>;
}

const defaultConnections: Connection[] = [
    { id: 'apple_health', name: 'Apple Health', icon: 'heart', color: '#FF2D55', connected: true, lastSync: '2 min ago', description: 'Sync workouts, steps, heart rate, and activity data' },
    { id: 'google_fit', name: 'Google Fit', icon: 'fitness', color: '#4285F4', connected: false, lastSync: null, description: 'Sync activity, steps, and workout data' },
    { id: 'strava', name: 'Strava', icon: 'bicycle', color: '#FC4C02', connected: true, lastSync: '1 hour ago', description: 'Import running, cycling, and swimming activities' },
    { id: 'fitbit', name: 'Fitbit', icon: 'watch', color: '#00B0B9', connected: false, lastSync: null, description: 'Sync sleep, steps, heart rate, and workout data' },
    { id: 'garmin', name: 'Garmin', icon: 'navigate', color: '#007CC3', connected: false, lastSync: null, description: 'Sync GPS activities, heart rate, and training data' },
    { id: 'samsung_health', name: 'Samsung Health', icon: 'phone-portrait', color: '#1428A0', connected: false, lastSync: null, description: 'Sync Samsung Galaxy Watch and phone health data' },
];

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
    connections: defaultConnections,

    toggle: (id: string) => {
        set((state) => ({
            connections: state.connections.map((c) =>
                c.id === id ? { ...c, connected: !c.connected, lastSync: !c.connected ? 'Just now' : null } : c
            ),
        }));
    },

    sync: async (id: string) => {
        set((state) => ({
            connections: state.connections.map((c) =>
                c.id === id ? { ...c, syncing: true } : c
            ),
        }));
        await new Promise((r) => setTimeout(r, 1500));
        set((state) => ({
            connections: state.connections.map((c) =>
                c.id === id ? { ...c, syncing: false, lastSync: 'Just now' } : c
            ),
        }));
    },
}));
