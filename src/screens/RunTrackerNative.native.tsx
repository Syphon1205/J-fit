import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Polyline, UrlTile } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { Coordinate, useRunStore } from '../stores/runStore';
import { safeBack } from '../utils/navigation';
import { getMapboxPublicToken, getMapboxTileUrlTemplate } from '../utils/mapbox';

type RunStatus = 'idle' | 'running' | 'paused';

const fallbackCoord = { latitude: 35.4676, longitude: -97.5164 };
const mapboxToken = getMapboxPublicToken();
const mapboxTileUrl = getMapboxTileUrlTemplate(mapboxToken);

const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const formatPace = (pace: number) => {
    if (!Number.isFinite(pace) || pace <= 0) return "--'--\"";
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}'${String(sec).padStart(2, '0')}"`;
};

const distanceKm = (a: Coordinate, b: Coordinate) => {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export default function RunTrackerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useThemeColors();
    const styles = makeStyles(colors, isDark);
    const { addSession } = useRunStore();
    const mapRef = useRef<MapView>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const subRef = useRef<Location.LocationSubscription | null>(null);
    const lastRef = useRef<Coordinate | null>(null);

    const [status, setStatus] = useState<RunStatus>('idle');
    const [location, setLocation] = useState<Coordinate>(fallbackCoord);
    const [route, setRoute] = useState<Coordinate[]>([]);
    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [gpsStatus, setGpsStatus] = useState('Getting GPS');

    const pace = distance > 0 ? duration / 60 / distance : 0;
    const calories = Math.round(distance * 70);

    const stopWatchers = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        subRef.current?.remove();
        subRef.current = null;
    }, []);

    const handlePoint = useCallback((coord: Coordinate) => {
        setLocation(coord);
        setRoute((prev) => {
            const last = lastRef.current;
            if (!last) {
                lastRef.current = coord;
                return [coord];
            }
            const segment = distanceKm(last, coord);
            if (segment < 0.003 || segment > 0.25) return prev;
            lastRef.current = coord;
            setDistance((current) => current + segment);
            return [...prev, coord];
        });
        mapRef.current?.animateCamera({ center: coord, zoom: 16 }, { duration: 350 });
    }, []);

    const startRun = useCallback(async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
            Alert.alert('Location needed', 'Enable location to track outdoor runs.');
            setGpsStatus('Permission needed');
            return;
        }

        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }).catch(() => null);
        const start = first ? { latitude: first.coords.latitude, longitude: first.coords.longitude } : fallbackCoord;
        setGpsStatus(first ? 'GPS locked' : 'Simulator route');
        setStatus('running');
        setDuration(0);
        setDistance(0);
        setRoute([start]);
        setLocation(start);
        lastRef.current = start;

        stopWatchers();
        timerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
        subRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 4, timeInterval: 1500 },
            (fix) => handlePoint({ latitude: fix.coords.latitude, longitude: fix.coords.longitude }),
        );
    }, [handlePoint, stopWatchers]);

    const pauseRun = () => {
        setStatus('paused');
        stopWatchers();
    };

    const resumeRun = async () => {
        setStatus('running');
        timerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
        subRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 4, timeInterval: 1500 },
            (fix) => handlePoint({ latitude: fix.coords.latitude, longitude: fix.coords.longitude }),
        );
    };

    const endRun = () => {
        stopWatchers();
        if (distance >= 0.05) {
            addSession({
                id: String(Date.now()),
                date: new Date().toISOString().split('T')[0],
                duration,
                distance: Math.round(distance * 100) / 100,
                avgPace: pace,
                calories,
                route,
            });
        }
        Alert.alert('Run saved', `${distance.toFixed(2)} km · ${formatDuration(duration)} · ${formatPace(pace)}/km`, [
            { text: 'Done', onPress: () => safeBack(router, '/run') },
        ]);
    };

    useEffect(() => {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .then((fix) => {
                const coord = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
                setLocation(coord);
                setGpsStatus('GPS ready');
            })
            .catch(() => setGpsStatus('Simulator route'));
        return stopWatchers;
    }, [stopWatchers]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                mapType="none"
                initialRegion={{ ...location, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
                region={{ ...location, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
                showsUserLocation
                showsMyLocationButton={false}
                userInterfaceStyle="light"
                scrollEnabled
                zoomEnabled
                zoomControlEnabled={false}
                toolbarEnabled={false}
            >
                {mapboxTileUrl ? (
                    <UrlTile
                        key={mapboxTileUrl}
                        urlTemplate={mapboxTileUrl}
                        maximumZ={19}
                        tileSize={512}
                        tileCacheMaxAge={0}
                        shouldReplaceMapContent
                    />
                ) : null}
                {route.length > 1 && <Polyline coordinates={route} strokeColor={colors.primary} strokeWidth={6} lineCap="round" lineJoin="round" />}
            </MapView>

            <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                <View style={[styles.topBar, { paddingTop: insets.top ? 0 : 10 }]}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => status === 'idle' ? safeBack(router, '/run') : Alert.alert('Discard run?', 'End without saving?', [{ text: 'Cancel' }, { text: 'Discard', style: 'destructive', onPress: () => safeBack(router, '/run') }])}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.titlePill}>
                        <Text style={styles.kicker}>GPS Run</Text>
                        <Text style={styles.title}>Run Tracker</Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton} onPress={() => mapRef.current?.animateCamera({ center: location, zoom: 16 })}>
                        <Ionicons name="locate-outline" size={21} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={[styles.panel, { paddingBottom: insets.bottom + 18 }]}>
                <View style={styles.gpsPill}>
                    <Ionicons name="location-outline" size={15} color={colors.primary} />
                    <Text style={styles.gpsText}>{gpsStatus}</Text>
                </View>
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>km</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                        <Text style={styles.statLabel}>time</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatPace(pace)}</Text>
                        <Text style={styles.statLabel}>pace</Text>
                    </View>
                </View>

                {status === 'idle' && (
                    <TouchableOpacity style={styles.primaryButton} onPress={startRun}>
                        <Ionicons name="play" size={22} color="#fff" />
                        <Text style={styles.primaryText}>Start Run</Text>
                    </TouchableOpacity>
                )}
                {status === 'running' && (
                    <View style={styles.controlRow}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={pauseRun}><Text style={styles.secondaryText}>Pause</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButtonWide} onPress={endRun}><Text style={styles.primaryText}>End Run</Text></TouchableOpacity>
                    </View>
                )}
                {status === 'paused' && (
                    <View style={styles.controlRow}>
                        <TouchableOpacity style={styles.primaryButtonWide} onPress={resumeRun}><Text style={styles.primaryText}>Resume</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={endRun}><Text style={styles.secondaryText}>Finish</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors'], isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14 },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    titlePill: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 14 },
    kicker: { color: colors.primary, fontSize: 10, fontWeight: '900' },
    title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 1 },
    gpsPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: colors.surfaceLight, paddingHorizontal: 10, minHeight: 30, marginBottom: 10 },
    gpsText: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
    panel: { position: 'absolute', left: 12, right: 12, bottom: 0, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, shadowColor: '#0f172a', shadowOpacity: isDark ? 0.18 : 0.07, shadowRadius: 18, elevation: 8 },
    stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { color: colors.textPrimary, fontSize: 23, fontWeight: '900' },
    statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginTop: 2 },
    primaryButton: { minHeight: 50, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryButtonWide: { flex: 1.15, minHeight: 50, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
    controlRow: { flexDirection: 'row', gap: 9 },
    secondaryButton: { flex: 1, minHeight: 50, borderRadius: 999, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    secondaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
});
