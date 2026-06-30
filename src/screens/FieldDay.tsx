import { useEffect, useMemo, useRef, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

const haversineKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

type GearLoad = 'light' | 'medium' | 'heavy';

const gearMultiplier: Record<GearLoad, number> = {
    light: 1,
    medium: 1.08,
    heavy: 1.16,
};

export default function FieldDay() {
    const [tracking, setTracking] = useState(false);
    const [gear, setGear] = useState<GearLoad>('medium');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [distanceKm, setDistanceKm] = useState(0);
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [lastFix, setLastFix] = useState<{ lat: number; lon: number } | null>(null);
    const watchIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!tracking) return;
        const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [tracking]);

    const startTracking = async () => {
        if (tracking) return;
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') return;

        setTracking(true);
        setElapsedSeconds(0);
        setDistanceKm(0);
        setLastFix(null);

        const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true },
            (position, error) => {
                if (error || !position) return;
                const next = { lat: position.coords.latitude, lon: position.coords.longitude };
                setLocation(next);
                setLastFix((prev) => {
                    if (!prev) return next;
                    const delta = haversineKm(prev, next);
                    if (delta > 0.002 && delta < 1) {
                        setDistanceKm((current) => current + delta);
                    }
                    return next;
                });
            }
        );
        watchIdRef.current = id;
    };

    const stopTracking = async () => {
        if (watchIdRef.current) {
            await Geolocation.clearWatch({ id: watchIdRef.current });
            watchIdRef.current = null;
        }
        setTracking(false);
    };

    const minutes = Math.floor(elapsedSeconds / 60);
    const zone2Minutes = Math.round(minutes * 0.7 * gearMultiplier[gear]);
    const calories = Math.round(minutes * 5.2 * gearMultiplier[gear]);

    const mapUrl = useMemo(() => {
        if (!location) return null;
        const { lat, lon } = location;
        return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=13&size=640x360&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
    }, [location]);

    return (
        <div className="min-h-screen bg-black text-white">
            <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
                <header className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Field Day</p>
                    <h1 className="text-3xl font-semibold">Active recovery, powered by your favorite hobbies.</h1>
                    <p className="text-sm text-gray-400">
                        Track photography, hiking, or storm chasing days as legitimate recovery strain.
                    </p>
                </header>

                <section className="rounded-3xl bg-white/5 p-6 backdrop-blur-2xl">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Live Map</p>
                        <span className="text-xs text-gray-400">{location ? 'Location locked' : 'Awaiting GPS'}</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-white/5">
                        {mapUrl ? (
                            <img src={mapUrl} alt="Field Day Map" className="h-56 w-full object-cover" />
                        ) : (
                            <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                                Secure GPS to render your live trail.
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: 'Time on Feet', value: `${minutes} min` },
                        { label: 'Distance Covered', value: `${distanceKm.toFixed(2)} km` },
                        { label: 'Estimated Zone 2', value: `${zone2Minutes} min` },
                    ].map((metric) => (
                        <div key={metric.label} className="rounded-3xl bg-white/5 p-6 backdrop-blur-2xl">
                            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">{metric.label}</p>
                            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-3xl bg-white/5 p-6 backdrop-blur-2xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Camera / Gear Load</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {(['light', 'medium', 'heavy'] as GearLoad[]).map((option) => (
                            <button
                                key={option}
                                onClick={() => setGear(option)}
                                className={`rounded-2xl px-4 py-4 text-sm font-semibold uppercase tracking-wide ${
                                    gear === option
                                        ? 'bg-white/10 text-white'
                                        : 'bg-white/5 text-gray-400'
                                } backdrop-blur-2xl`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">
                        Gear load adjusts strain. Current estimate: {calories} active calories.
                    </p>
                </section>

                <button
                    onClick={tracking ? stopTracking : startTracking}
                    className="rounded-3xl bg-[#CCFF00] px-8 py-5 text-lg font-semibold text-black"
                >
                    {tracking ? 'End Expedition' : 'Start Expedition'}
                </button>
            </main>
        </div>
    );
}
