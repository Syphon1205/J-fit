import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRunStore } from '../../src/stores/runStore';
import { safeBack } from '../../src/utils/navigation';
import { getMapboxPublicToken } from '../../src/utils/mapbox';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export default function RunDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors: theme } = useThemeColors();
    const { sessions } = useRunStore();

    const run = useMemo(() => sessions.find((s) => s.id === id), [id, sessions]);
    const token = getMapboxPublicToken();

    if (!run) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.textSecondary }}>Run not found</Text>
                <TouchableOpacity onPress={() => safeBack(router, '/run')} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const formatPace = (pace: number) => {
        if (!isFinite(pace) || pace <= 0) return "--'--\"";
        const min = Math.floor(pace);
        const sec = Math.round((pace - min) * 60);
        return `${min}'${String(sec).padStart(2, '0')}"`;
    };

    const coordinates = JSON.stringify(run.route.map((r) => [r.longitude, r.latitude]));

    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
    <style>
    body { margin: 0; padding: 0; background: #E5E5EA; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    /* Hide Mapbox UI elements for cleaner Apple Maps look */
    .mapboxgl-control-container { display: none !important; }
    </style>
    </head>
    <body>
    <div id="map"></div>
    <script>
        mapboxgl.accessToken = '${token}';
        const coords = ${coordinates};

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11', 
            center: coords.length ? coords[0] : [-122.4194, 37.7749],
            zoom: 14,
            pitch: 0,
            attributionControl: false
        });

        map.on('load', () => {
            if (coords.length === 0) return;

            const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
            for (const coord of coords) {
                bounds.extend(coord);
            }
            map.fitBounds(bounds, { padding: 60 });

            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coords
                    }
                }
            });

            // Add Apple Maps style thick glowing blue line
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#007AFF', 
                    'line-width': 8,
                    'line-opacity': 0.9
                }
            });
            
            // Inner core for 3D depth effect
            map.addLayer({
                'id': 'route-inner',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#47A1FF', 
                    'line-width': 4,
                    'line-opacity': 1
                }
            });
        });
    </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            {/* Map Background using iframe srcDoc */}
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    <iframe 
                        srcDoc={mapHtml} 
                        style={styles.iframe} 
                        frameBorder="0" 
                        sandbox="allow-scripts allow-same-origin" 
                    />
                ) : (
                    // React Native WebView would go here, but Expo Router targets web out of the box for Capacitor
                    <iframe 
                        srcDoc={mapHtml} 
                        style={styles.iframe} 
                        frameBorder="0" 
                        sandbox="allow-scripts allow-same-origin" 
                    />
                )}
            </View>

            {/* Back Button */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/run')} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                    <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Bottom Glassmorphism Details Card */}
            <View style={styles.bottomSheet}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.header}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                            <Ionicons name="footsteps" size={24} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                {new Date(run.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </Text>
                            <Text style={[styles.title, { color: theme.textPrimary }]}>Outdoor Run</Text>
                        </View>
                    </View>

                    <View style={styles.metricsGrid}>
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>DISTANCE</Text>
                            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                                {run.distance.toFixed(2)} <Text style={{ fontSize: 16, color: theme.textSecondary }}>km</Text>
                            </Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>TIME</Text>
                            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{formatDuration(run.duration)}</Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>AVG PACE</Text>
                            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{formatPace(run.avgPace)}</Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>CALORIES</Text>
                            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{run.calories} kcal</Text>
                        </View>
                        {run.elevationGain != null && (
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>ELEV GAIN</Text>
                                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{run.elevationGain}m</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    iframe: { width: '100%', height: '100%' },
    topBar: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 32,
        left: 16,
        right: 16,
        zIndex: 10,
    },
    detailsCard: {
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    title: { fontSize: 24, fontWeight: '800' },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 24,
        columnGap: 16,
    },
    metric: {
        width: '45%',
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '900',
    },
});
