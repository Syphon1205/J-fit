import type { CSSProperties } from 'react';
import { CloudSun, Droplets, MapPin, Thermometer, Wind, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export type WeatherCardWeather = {
    city: string;
    observedAt: string;
    condition: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    dewpoint: number;
    wind: string;
};

export type WeatherCardHour = {
    time: string;
    temp: number;
    precipitation: number;
    windMph: number;
};

export type WeatherCardWindow = {
    title: string;
    summary: string;
};

type WeatherCardProps = {
    weather: WeatherCardWeather;
    hours: WeatherCardHour[];
    trainingWindow: WeatherCardWindow;
    status: string;
    onScheduleRun: () => void;
};

export function WeatherCard({ weather, hours, trainingWindow, status, onScheduleRun }: WeatherCardProps) {
    const visibleHours = hours.slice(0, 6);
    const metrics: Array<[string, string, LucideIcon, string]> = [
        ['Humidity', `${weather.humidity}%`, Droplets, 'var(--app-secondary)'],
        ['Dewpoint', `${weather.dewpoint}°`, Thermometer, 'var(--app-accent)'],
        ['Wind', weather.wind, Wind, 'var(--app-muted)'],
    ];

    return (
        <section style={styles.card}>
            <div style={styles.topRow}>
                <div>
                    <div style={styles.locationRow}>
                        <MapPin size={16} color="var(--app-accent)" />
                        <span>{weather.city}</span>
                    </div>
                    <h2 style={styles.temp}>{weather.temperature > 0 ? `${weather.temperature}°` : '--'}</h2>
                    <p style={styles.condition}>{weather.condition} · feels like {weather.feelsLike > 0 ? `${weather.feelsLike}°` : '--'}</p>
                    <p style={styles.status}>{status}</p>
                </div>
                <div style={styles.weatherIcon}>
                    <CloudSun size={28} color="var(--app-accent)" />
                </div>
            </div>

            <div style={styles.metricGrid}>
                {metrics.map(([label, value, Icon, color]) => (
                    <div key={String(label)} style={styles.metric}>
                        <Icon size={17} color={String(color)} />
                        <span style={styles.metricLabel}>{label}</span>
                        <strong style={styles.metricValue}>{value}</strong>
                    </div>
                ))}
            </div>

            <div style={styles.window}>
                <div style={styles.windowHeader}>
                    <span style={styles.goodDot} />
                    <span style={styles.windowLabel}>Optimal window</span>
                </div>
                <h3 style={styles.windowTitle}>{trainingWindow.title.replace('Optimal Run Window: ', 'Run window: ')}</h3>
                <p style={styles.windowCopy}>{trainingWindow.summary}</p>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    style={styles.windowButton}
                    onClick={onScheduleRun}
                >
                    Schedule run
                </motion.button>
            </div>

            <div style={styles.hourRow}>
                {visibleHours.map((hour) => (
                    <div key={`${hour.time}-${hour.temp}`} style={styles.hour}>
                        <span style={styles.hourTime}>{hour.time}</span>
                        <span style={styles.hourTemp}>{hour.temp}°</span>
                        <span style={styles.rain}>{hour.precipitation}%</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default WeatherCard;

const styles: Record<string, CSSProperties> = {
    card: {
        background: 'var(--app-card)',
        border: '1px solid var(--app-border)',
        borderRadius: 32,
        boxShadow: 'var(--app-shadow)',
        padding: 18,
        color: 'var(--app-text)',
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
    },
    locationRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--app-muted)',
        fontSize: 13,
        fontWeight: 800,
    },
    temp: {
        margin: '12px 0 0',
        fontSize: 56,
        lineHeight: 0.95,
        letterSpacing: -3,
        color: 'var(--app-heading)',
        fontWeight: 800,
    },
    condition: {
        margin: '8px 0 0',
        color: 'var(--app-muted)',
        fontSize: 15,
        lineHeight: 1.35,
        fontWeight: 700,
    },
    status: {
        margin: '5px 0 0',
        color: 'var(--app-muted)',
        fontSize: 12,
        fontWeight: 650,
    },
    weatherIcon: {
        width: 54,
        height: 54,
        borderRadius: 20,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--app-accent-soft)',
        flexShrink: 0,
    },
    metricGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        marginTop: 18,
    },
    metric: {
        borderRadius: 22,
        background: 'var(--app-bg)',
        padding: 12,
        display: 'grid',
        gap: 5,
        minWidth: 0,
    },
    metricLabel: {
        color: 'var(--app-muted)',
        fontSize: 11,
        fontWeight: 750,
    },
    metricValue: {
        color: 'var(--app-text)',
        fontSize: 15,
        fontWeight: 900,
        whiteSpace: 'nowrap',
    },
    window: {
        marginTop: 14,
        borderRadius: 26,
        padding: 16,
        background: 'var(--app-raised)',
    },
    windowHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
    },
    goodDot: {
        width: 9,
        height: 9,
        borderRadius: 99,
        background: '#22c55e',
    },
    windowLabel: {
        color: 'var(--app-muted)',
        fontSize: 12,
        fontWeight: 850,
    },
    windowTitle: {
        margin: '8px 0 0',
        color: 'var(--app-heading)',
        fontSize: 22,
        lineHeight: 1.12,
        fontWeight: 900,
        letterSpacing: -0.7,
    },
    windowCopy: {
        margin: '8px 0 0',
        color: 'var(--app-muted)',
        fontSize: 14,
        lineHeight: 1.45,
        fontWeight: 650,
    },
    windowButton: {
        marginTop: 14,
        border: 0,
        borderRadius: 999,
        background: 'var(--app-accent)',
        color: '#fff',
        minHeight: 42,
        padding: '0 16px',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 850,
    },
    hourRow: {
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginTop: 14,
        paddingBottom: 2,
    },
    hour: {
        minWidth: 64,
        borderRadius: 20,
        background: 'var(--app-bg)',
        padding: '10px 8px',
        display: 'grid',
        gap: 4,
        textAlign: 'center',
    },
    hourTime: {
        color: 'var(--app-muted)',
        fontSize: 12,
        fontWeight: 750,
    },
    hourTemp: {
        color: 'var(--app-heading)',
        fontSize: 17,
        fontWeight: 900,
    },
    rain: {
        color: 'var(--app-accent)',
        fontSize: 11,
        fontWeight: 800,
    },
};
