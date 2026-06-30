import { Geolocation, Position } from '@capacitor/geolocation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Coordinate, useRunStore } from '../../src/stores/runStore';
import { safeBack } from '../../src/utils/navigation';
import { getMapboxPublicToken, getMapboxStylePreviewUrl } from '../../src/utils/mapbox';

type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

const BLUE = '#1A73E8';
const MINT = '#00BFA5';
const OKC = { latitude: 35.4676, longitude: -97.5164 };
const MAP_ZOOM = 15;

const goalPresets: Record<string, { label: string; distanceKm: number }> = {
    easy: { label: 'Easy', distanceKm: 5 },
    speed: { label: 'Speed', distanceKm: 4 },
    distance: { label: 'Distance', distanceKm: 10 },
    recovery: { label: 'Recovery', distanceKm: 3 },
};

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatPace = (pace: number) => {
    if (!Number.isFinite(pace) || pace <= 0) return "--'--\"";
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}'${String(sec).padStart(2, '0')}"`;
};

const haversineDistance = (a: Coordinate, b: Coordinate) => {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const coordinateFromPosition = (position: Position): Coordinate => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
});

export default function RunTrackerWebScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ goal?: string }>();
    const { addSession } = useRunStore();
    const selectedGoal = goalPresets[(params.goal || 'easy').toLowerCase()] ?? goalPresets.easy;
    const accent = typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || BLUE
        : BLUE;
    const secondary = typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--app-secondary').trim() || MINT
        : MINT;
    const mapboxToken = getMapboxPublicToken();

    const [status, setStatus] = useState<RunStatus>('idle');
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
    const [route, setRoute] = useState<Coordinate[]>([]);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedKmh, setSpeedKmh] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watchIdRef = useRef<string | null>(null);
    const lastFixRef = useRef<{ coord: Coordinate; timestamp: number } | null>(null);
    const statusRef = useRef<RunStatus>('idle');
    statusRef.current = status;

    const center = currentLocation ?? OKC;
    const pace = distance > 0 ? (duration / 60) / distance : 0;
    const calories = Math.round(distance * 65);
    const mapFrameSrc = useMemo(() => getMapboxStylePreviewUrl(center, MAP_ZOOM, mapboxToken), [center, mapboxToken]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const clearWatch = useCallback(async () => {
        if (!watchIdRef.current) return;
        const id = watchIdRef.current;
        watchIdRef.current = null;
        await Geolocation.clearWatch({ id });
    }, []);

    const handlePosition = useCallback((position: Position | null) => {
        if (!position) return;
        const coord = coordinateFromPosition(position);
        const timestamp = position.timestamp || Date.now();
        setCurrentLocation(coord);

        if (statusRef.current !== 'running') return;
        const accuracy = position.coords.accuracy ?? 25;
        if (accuracy > 45) return;

        const lastFix = lastFixRef.current;
        if (!lastFix) {
            lastFixRef.current = { coord, timestamp };
            setRoute((prev) => (prev.length ? prev : [coord]));
            return;
        }

        const segmentKm = haversineDistance(lastFix.coord, coord);
        const elapsedHours = Math.max((timestamp - lastFix.timestamp) / 3_600_000, 1 / 3_600_000);
        const inferredSpeed = segmentKm / elapsedHours;
        if (segmentKm < 0.003 || inferredSpeed > 25 || (segmentKm > 0.2 && timestamp - lastFix.timestamp < 8000)) return;

        setDistance((value) => value + segmentKm);
        setRoute((prev) => [...prev, coord]);
        setSpeedKmh(position.coords.speed != null && position.coords.speed >= 0 ? position.coords.speed * 3.6 : inferredSpeed);
        lastFixRef.current = { coord, timestamp };
    }, []);

    const requestLocation = useCallback(async () => {
        try {
            const permission = await Geolocation.requestPermissions();
            const granted = permission.location === 'granted';
            setPermissionGranted(granted);
            if (!granted) return false;

            const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
            const coord = coordinateFromPosition(position);
            setCurrentLocation(coord);
            lastFixRef.current = { coord, timestamp: position.timestamp || Date.now() };
            return true;
        } catch {
            setPermissionGranted(false);
            return false;
        }
    }, []);

    const startWatch = useCallback(async () => {
        await clearWatch();
        watchIdRef.current = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
            (position) => handlePosition(position)
        );
    }, [clearWatch, handlePosition]);

    useEffect(() => {
        requestLocation();
        return () => {
            clearTimer();
            clearWatch();
        };
    }, [clearWatch, requestLocation]);

    const startRun = useCallback(async () => {
        const granted = permissionGranted || await requestLocation();
        if (!granted || !currentLocation) {
            window.alert('Allow location access and wait for a GPS lock before starting.');
            return;
        }

        setStatus('running');
        setDuration(0);
        setDistance(0);
        setSpeedKmh(0);
        setRoute([currentLocation]);
        lastFixRef.current = { coord: currentLocation, timestamp: Date.now() };
        clearTimer();
        timerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
        await startWatch();
    }, [currentLocation, permissionGranted, requestLocation, startWatch]);

    const pauseRun = useCallback(async () => {
        setStatus('paused');
        clearTimer();
        await clearWatch();
    }, [clearWatch]);

    const resumeRun = useCallback(async () => {
        setStatus('running');
        clearTimer();
        timerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
        await startWatch();
    }, [startWatch]);

    const discardRun = useCallback(async () => {
        clearTimer();
        await clearWatch();
        setStatus('idle');
        setDuration(0);
        setDistance(0);
        setSpeedKmh(0);
        setRoute([]);
    }, [clearWatch]);

    const finishRun = useCallback(async () => {
        clearTimer();
        await clearWatch();
        setStatus('finished');

        if (distance < 0.1) {
            window.alert('Run at least 100m to save a session.');
            setStatus('idle');
            return;
        }

        addSession({
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            duration,
            distance: Math.round(distance * 100) / 100,
            avgPace: pace,
            calories,
            route,
        });

        window.alert(`Run Complete\nDistance: ${distance.toFixed(2)} km\nTime: ${formatDuration(duration)}\nPace: ${formatPace(pace)}/km\nCalories: ${calories} kcal`);
        safeBack(router, '/run');
    }, [addSession, calories, clearWatch, distance, duration, pace, route, router]);

    const closeScreen = () => {
        if (status === 'idle') safeBack(router, '/run');
        else discardRun();
    };

    const routePreview = route.slice(-32);
    const minLat = Math.min(...routePreview.map((point) => point.latitude), center.latitude);
    const maxLat = Math.max(...routePreview.map((point) => point.latitude), center.latitude);
    const minLng = Math.min(...routePreview.map((point) => point.longitude), center.longitude);
    const maxLng = Math.max(...routePreview.map((point) => point.longitude), center.longitude);
    const pathPoints = routePreview.map((point) => {
        const x = maxLng === minLng ? 50 : ((point.longitude - minLng) / (maxLng - minLng)) * 70 + 15;
        const y = maxLat === minLat ? 50 : (1 - (point.latitude - minLat) / (maxLat - minLat)) * 58 + 21;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={styles.shell}>
            <div style={styles.mapStage}>
                <div style={styles.mapGrid} />
                {mapFrameSrc ? (
                    <div style={styles.mapFrameClip}>
                        <iframe
                            title="Run map"
                            src={mapFrameSrc}
                            style={styles.mapFrame}
                            loading="eager"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ) : (
                    null
                )}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.routeSvg}>
                    {pathPoints ? <polyline points={pathPoints} fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
                </svg>
                <div style={{ ...styles.locationDot, background: accent }} />
            </div>

            <div style={styles.topBar}>
                <button type="button" onClick={closeScreen} style={styles.iconButton}>
                    {status === 'idle' ? '<' : 'x'}
                </button>
                <div style={styles.titleBlock}>
                    <div style={{ ...styles.kicker, color: accent }}>GPS Run</div>
                    <div style={styles.title}>{selectedGoal.label} {selectedGoal.distanceKm}k</div>
                </div>
                <button type="button" onClick={() => requestLocation()} style={styles.iconButton}>
                    ⌖
                </button>
            </div>

            <div style={styles.bottomPanel}>
                <div style={styles.gpsRow}>
                    <span style={{ ...styles.dot, background: permissionGranted ? secondary : '#FACC15' }} />
                    {permissionGranted ? 'GPS active' : 'Location needed'}
                </div>
                <div style={styles.metrics}>
                    <div style={styles.metric}>
                        <span style={styles.metricValue}>{formatPace(pace)}</span>
                        <span style={styles.metricLabel}>PACE / KM</span>
                    </div>
                    <div style={styles.metric}>
                        <span style={styles.metricValue}>{distance.toFixed(2)}</span>
                        <span style={styles.metricLabel}>KM</span>
                    </div>
                    <div style={styles.metric}>
                        <span style={styles.metricValue}>{formatDuration(duration)}</span>
                        <span style={styles.metricLabel}>TIME</span>
                    </div>
                </div>

                <div style={styles.microStats}>
                    <span>{Math.max(speedKmh, 0).toFixed(1)} km/h</span>
                    <span>{calories} kcal</span>
                    <span>{route.length} GPS points</span>
                </div>

                <div style={styles.controls}>
                    {status === 'idle' && (
                        <button type="button" onClick={startRun} style={{ ...styles.primaryButton, background: accent }}>Start Run</button>
                    )}
                    {status === 'running' && (
                        <>
                            <button type="button" onClick={pauseRun} style={styles.secondaryButton}>Pause</button>
                            <button type="button" onClick={finishRun} style={{ ...styles.primaryButton, background: accent }}>End Run</button>
                        </>
                    )}
                    {status === 'paused' && (
                        <>
                            <button type="button" onClick={resumeRun} style={{ ...styles.primaryButton, background: accent }}>Resume</button>
                            <button type="button" onClick={finishRun} style={styles.secondaryButton}>End Run</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const glass: CSSProperties = {
    background: 'var(--app-card)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    boxShadow: 'var(--app-shadow)',
    border: '1px solid var(--app-border)',
};

const styles: Record<string, CSSProperties> = {
    shell: { position: 'fixed', inset: 0, minHeight: '100dvh', overflow: 'hidden', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    mapStage: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#111827,#020617)', overflow: 'hidden' },
    mapGrid: { position: 'absolute', inset: 0, opacity: 0.28, backgroundImage: 'linear-gradient(var(--app-border) 1px, transparent 1px), linear-gradient(90deg, var(--app-border) 1px, transparent 1px)', backgroundSize: '42px 42px' },
    mapFrameClip: { position: 'absolute', inset: 0, overflow: 'hidden', touchAction: 'pan-x pan-y pinch-zoom' },
    mapFrame: { position: 'absolute', left: '-8%', top: '-8%', width: '116%', height: '116%', border: 0, touchAction: 'pan-x pan-y pinch-zoom' },
    routeSvg: { position: 'absolute', inset: '12% 8% 24%', width: '84%', height: '64%', filter: 'drop-shadow(0 10px 22px rgba(0,0,0,.22))' },
    locationDot: { position: 'absolute', left: '50%', top: '44%', width: 18, height: 18, marginLeft: -9, marginTop: -9, borderRadius: 999, boxShadow: '0 0 0 8px rgba(255,255,255,.18), 0 0 28px currentColor' },
    topBar: { position: 'absolute', top: 'max(12px, calc(env(safe-area-inset-top) + 10px))', left: 14, right: 14, display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) 44px', alignItems: 'center', gap: 10, zIndex: 10 },
    iconButton: { width: 44, height: 44, border: 0, borderRadius: 22, color: 'var(--app-text)', fontSize: 22, lineHeight: '22px', ...glass },
    titleBlock: { minWidth: 0, padding: '9px 13px 10px', borderRadius: 22, ...glass },
    kicker: { fontSize: 10, fontWeight: 850, letterSpacing: 0 },
    title: { marginTop: 1, fontSize: 18, fontWeight: 850, letterSpacing: 0 },
    dot: { width: 9, height: 9, borderRadius: 9, boxShadow: '0 0 0 4px rgba(0,191,165,0.12)' },
    bottomPanel: { position: 'absolute', left: 12, right: 12, bottom: 'max(12px, calc(env(safe-area-inset-bottom) + 10px))', zIndex: 10, padding: 14, borderRadius: 26, ...glass },
    gpsRow: { display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10, color: 'var(--app-muted)', fontSize: 11, fontWeight: 850 },
    metrics: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
    metric: { minWidth: 0, padding: '10px 7px', borderRadius: 18, background: 'var(--app-bg)', textAlign: 'center' },
    metricValue: { display: 'block', color: 'var(--app-heading)', fontSize: 20, fontWeight: 900, letterSpacing: 0, whiteSpace: 'nowrap' },
    metricLabel: { display: 'block', marginTop: 4, color: 'var(--app-muted)', fontSize: 9, fontWeight: 900, letterSpacing: 0.8 },
    microStats: { marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--app-muted)', fontSize: 11, fontWeight: 850 },
    controls: { marginTop: 12, display: 'flex', gap: 9 },
    primaryButton: { flex: 1, border: 0, borderRadius: 999, minHeight: 48, color: '#fff', font: 'inherit', fontSize: 14, fontWeight: 950 },
    secondaryButton: { flex: 1, border: 0, borderRadius: 999, minHeight: 48, background: 'var(--app-bg)', color: 'var(--app-text)', font: 'inherit', fontSize: 14, fontWeight: 900 },
};
